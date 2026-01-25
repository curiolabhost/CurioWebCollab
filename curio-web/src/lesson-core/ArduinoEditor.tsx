"use client";

import * as React from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import styles from "./ArduinoEditor.module.css";

const DEFAULT_SKETCH = `/* Electric Board Code Editor */
void setup() {
  // put your setup code here, to run once:
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

const ARDUINO_FUNCS = [
  "pinMode",
  "digitalWrite",
  "digitalRead",
  "analogWrite",
  "analogRead",
  "delay",
  "millis",
  "micros",
  "Serial.begin",
  "Serial.print",
  "Serial.println",
  "setup",
  "loop",
];

type CoachItem = {
  tag: "OK" | "WARN" | "TIP" | "NEXT" | "IDEA";
  line: number | null;
  text: string;
  why: string;
  recommendation: string;
  code: string | null;
};

type CoachPayload = {
  summary: string;
  hasErrors: boolean;
  sections: { title: string; items: CoachItem[] }[];
};


type ArduinoEditorProps = {
  height?: string | number;
  width?: string | number;

  // Lesson-mode persistence (localStorage, per lesson)
  storageKey?: string;

  // File-mode (opened from Files > Open; content handed off via localStorage token)
  fileToken?: string;
};

type VerifyError = {
  line: number;
  column?: number;
  message: string;
};

type HelpMode = "popup" | "popup-more" | "popup-lesson" | "arduino-verify" |"project-coach";

type PopoverItem = {
  id: string;
  errorKey: string;
  top: number;
  left: number;
  content: string;
  mode: HelpMode;
  busy: boolean;
  ctx: { code: string; snippet: string; message: string; line: number };
};

const toolbarButtonStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 15,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
};

function safeNameFromPath(name: string) {
  const s = String(name || "").trim();
  return s || "ElectricBoard.ino";
}

const FILE_TOKEN_PREFIX = "curio:fileopen:";
const FILE_TOKEN_CACHE_PREFIX = "curio:fileopen-cache:"; // sessionStorage per tab

export default function ArduinoEditor({
  height = "100%",
  width = "100%",
  storageKey,
  fileToken,
}: ArduinoEditorProps) {
  const isFileMode = !!fileToken;

  const [isExplaining, setIsExplaining] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("Ready.");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [lastErrors, setLastErrors] = React.useState<VerifyError[]>([]);
  const [compilerOutput, setCompilerOutput] = React.useState("");

  const [aiHelpMap, setAiHelpMap] = React.useState<Record<string, string>>({});
  const [aiCooldownUntil, setAiCooldownUntil] = React.useState<number>(0);

  const [popovers, setPopovers] = React.useState<PopoverItem[]>([]);
  const [coachJson, setCoachJson] = React.useState<CoachPayload | null>(null);
  const [coachRaw, setCoachRaw] = React.useState<string>(""); // optional for debugging


  const popoversRef = React.useRef<PopoverItem[]>([]);
    React.useEffect(() => {
      popoversRef.current = popovers;
    }, [popovers]);

  // Multi-popover drag refs
  const dragPopoverIdRef = React.useRef<string | null>(null);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  const [bottomHeight, setBottomHeight] = React.useState(90);
  const [isResizing, setIsResizing] = React.useState(false);
  const dragStartYRef = React.useRef(0);
  const dragStartHeightRef = React.useRef(0);

  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);

  // -------- Files menu state --------
  const [filesMenuOpen, setFilesMenuOpen] = React.useState(false);
  const filesBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const filesMenuRef = React.useRef<HTMLDivElement | null>(null);

  // Currently opened/saved file handle (only works in Chromium w/ File System Access API)
  const [fileHandle, setFileHandle] = React.useState<any>(null);
  const [fileName, setFileName] = React.useState<string>("ElectricBoard.ino");

  // hidden <input type=file> fallback
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  /* ============================================================
     Load editor content
  ============================================================ */
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (fileToken) {
      try {
        let raw = window.localStorage.getItem(FILE_TOKEN_PREFIX + fileToken);
        if (!raw) raw = window.sessionStorage.getItem(FILE_TOKEN_CACHE_PREFIX + fileToken);

        if (!raw) {
          setStatus("Could not load file (missing token).");
          setFileHandle(null);
          setFileName("ElectricBoard.ino");
          setValue((prev) => (prev ? prev : DEFAULT_SKETCH));
          return;
        }

        const payload = JSON.parse(raw) as { name: string; text: string };

        try {
          window.sessionStorage.setItem(
            FILE_TOKEN_CACHE_PREFIX + fileToken,
            JSON.stringify({ name: payload.name, text: payload.text })
          );
        } catch {}

        setFileName(safeNameFromPath(payload.name || "Sketch.ino"));
        setValue(payload.text ?? DEFAULT_SKETCH);
        setFileHandle(null);
        setStatus(`Opened: ${payload.name}`);

        if (window.localStorage.getItem(FILE_TOKEN_PREFIX + fileToken)) {
          window.setTimeout(() => {
            try {
              window.localStorage.removeItem(FILE_TOKEN_PREFIX + fileToken);
            } catch {}
          }, 750);
        }
      } catch {
        setStatus("Failed to open file.");
        setFileHandle(null);
        setFileName("ElectricBoard.ino");
        setValue((prev) => (prev ? prev : DEFAULT_SKETCH));
      }
      return;
    }

    if (storageKey) {
      const saved = window.localStorage.getItem(storageKey);
      setValue(saved ?? DEFAULT_SKETCH);
      setStatus("Ready.");
      setFileHandle(null);
      setFileName("ElectricBoard.ino");
      return;
    }

    setValue(DEFAULT_SKETCH);
    setStatus("Ready.");
    setFileHandle(null);
    setFileName("ElectricBoard.ino");
  }, [storageKey, fileToken]);

  /* ============================================================
     Sync across tabs (LESSON MODE ONLY)
  ============================================================ */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!storageKey) return;
    if (isFileMode) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const next = e.newValue ?? "";
      setValue(next || DEFAULT_SKETCH);
      setStatus("Synced from other tab.");
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, isFileMode]);

  // Close Files menu on outside click / escape
  React.useEffect(() => {
    if (!filesMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;

      const btn = filesBtnRef.current;
      const menu = filesMenuRef.current;

      if (btn && btn.contains(t)) return;
      if (menu && menu.contains(t)) return;

      setFilesMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilesMenuOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [filesMenuOpen]);

  const onChange = (v: string | undefined) => {
    const text = v ?? "";
    setValue(text);
    setStatus("Editing...");

    if (!storageKey || isFileMode) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    rafRef.current = window.requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(storageKey, text);
        setLastSaved(new Date());
        setStatus("Saved (lesson).");
      } catch {
        setStatus("Save failed (storage).");
      }
    });
  };


  type CoachLine = { tag: "OK" | "WARN" | "TIP" | "NEXT" | "IDEA" | "PLAIN"; text: string };

  function parseCoachLines(raw: string): CoachLine[] {
    return String(raw || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^\[(OK|WARN|TIP|NEXT|IDEA)\]\s*(.*)$/i);
        if (!m) return { tag: "PLAIN", text: line };
        return { tag: m[1].toUpperCase() as CoachLine["tag"], text: m[2] || "" };
      });
  }

  type CoachTag = CoachItem["tag"];

function coachTagColor(tag: CoachTag) {
  switch (tag) {
    case "OK":
      return "#86efac";
    case "WARN":
      return "#fca5a5";
    case "TIP":
      return "#93c5fd";
    case "NEXT":
      return "#fcd34d";
    case "IDEA":
      return "#c4b5fd";
    default:
      return "#e5e7eb";
  }
}

function coachTagBg(tag: CoachTag) {
  switch (tag) {
    case "OK":
      return "rgba(34,197,94,0.15)";
    case "WARN":
      return "rgba(239,68,68,0.15)";
    case "TIP":
      return "rgba(59,130,246,0.15)";
    case "NEXT":
      return "rgba(245,158,11,0.18)";
    case "IDEA":
      return "rgba(139,92,246,0.15)";
    default:
      return "rgba(148,163,184,0.10)";
  }
}


  function makeId() {
    return (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function startPopoverDrag(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const p = popovers.find((x) => x.id === id);
    if (!p) return;

    dragPopoverIdRef.current = id;
    dragOffsetRef.current = {
      x: e.clientX - p.left,
      y: e.clientY - p.top,
    };

    window.addEventListener("mousemove", onPopoverDragMove);
    window.addEventListener("mouseup", stopPopoverDrag);
  }

  function onPopoverDragMove(e: MouseEvent) {
    const id = dragPopoverIdRef.current;
    if (!id) return;

    setPopovers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const W = 320;
        const H = 220;
        const left = Math.max(10, Math.min(window.innerWidth - W - 10, e.clientX - dragOffsetRef.current.x));
        const top = Math.max(10, Math.min(window.innerHeight - H - 10, e.clientY - dragOffsetRef.current.y));
        return { ...p, left, top };
      })
    );
  }

  function stopPopoverDrag() {
    dragPopoverIdRef.current = null;
    window.removeEventListener("mousemove", onPopoverDragMove);
    window.removeEventListener("mouseup", stopPopoverDrag);
  }

  function getCodeContext(code: string, lineNumber: number, radius = 3) {
    const lines = code.split("\n");
    const start = Math.max(0, lineNumber - radius - 1);
    const end = Math.min(lines.length, lineNumber + radius);

    return lines
      .slice(start, end)
      .map((line, i) => {
        const actualLine = start + i + 1;
        const marker = actualLine === lineNumber ? ">> " : "   ";
        return `${marker}${actualLine}: ${line}`;
      })
      .join("\n");
  }

  const beforeMount = (monaco: any) => {
    monaco.editor.defineTheme("arduino-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "#82a8abff" },
        { token: "keyword.control", foreground: "#a1cd75ff" },
        { token: "keyword", foreground: "#a1cd75ff" },
        { token: "keyword.arduino", foreground: "#ce9261ff", fontStyle: "bold" },
        { token: "type", foreground: "#4EC9B0" },
        { token: "number", foreground: "#B5CEA8" },
        { token: "string", foreground: "#CE9178" },
        { token: "string.escape", foreground: "#D7BA7D" },
        { token: "constant", foreground: "#DCDCAA" },
        { token: "preprocessor", foreground: "#9CDCFE" },
        { token: "function", foreground: "#ce9261ff" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editorLineNumber.foreground": "#6b7280",
        "editorCursor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#111827",
        "editor.selectionBackground": "#264F78",
        "editorIndentGuides": "#1f2933",
        "editorError.foreground": "#ff5555",
        "editorError.background": "#8d0000ff",
        "editorGutter.background": "#0f172a",
      },
    });

    monaco.languages.setMonarchTokensProvider("cpp", {
      keywords: ["for", "while", "do", "switch", "case", "break", "continue", "if", "else", "return"],
      arduinoKeywords: [
        "setup",
        "loop",
        "pinMode",
        "digitalWrite",
        "digitalRead",
        "analogWrite",
        "analogRead",
        "delay",
        "millis",
        "micros",
        "Serial",
        "Serial.begin",
        "Serial.print",
        "Serial.println",
      ],
      arduinoConstants: ["HIGH", "LOW", "INPUT", "OUTPUT", "INPUT_PULLUP"],
      typeKeywords: [
        "void",
        "int",
        "long",
        "float",
        "double",
        "char",
        "bool",
        "boolean",
        "unsigned",
        "short",
        "byte",
        "word",
        "String",
        "static",
        "const",
      ],
      tokenizer: {
        root: [
          [/^\s*#\s*\w+/, "preprocessor"],
          [/\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|millis|micros)\b(?=\s*\()/, "function"],
          [
            /[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*/,
            {
              cases: {
                "@arduinoKeywords": "keyword.arduino",
                "@arduinoConstants": "constant",
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "identifier",
              },
            },
          ],
          { include: "@whitespace" },
          [/[{}()\[\]]/, "@brackets"],
          [/0b[01]+/, "number"],
          [/0x[\da-fA-F]+/, "number"],
          [/\d+(\.\d+)?([eE][\-+]?\d+)?/, "number"],
          [/"/, "string", "@string"],
          [/'[^\\']'/, "string"],
        ],
        whitespace: [
          [/[ \t\r\n]+/, "white"],
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
        ],
        comment: [
          [/[^\/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[\/*]/, "comment"],
        ],
        string: [
          [/[^\\"]+/, "string"],
          [/\\./, "string.escape"],
          [/"/, "string", "@pop"],
        ],
      },
    });

    monaco.languages.registerCompletionItemProvider("cpp", {
      provideCompletionItems: () => ({
        suggestions: ARDUINO_FUNCS.map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: label,
        })),
      }),
    });
  };

  async function streamHelpSSE(payload: any, onToken: (t: string) => void) {
    const res = await fetch("http://ec2-3-147-46-215.us-east-2.compute.amazonaws.com:4000/ai/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI route failed (${res.status}): ${t}`);
    }
    if (!res.body) {
      throw new Error("AI route returned no body (streaming not enabled).");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(chunk, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const evt of events) {
        const lines = evt.split("\n");
        let eventType = "message";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }

        if (eventType === "token") {
          try {
            const parsed = JSON.parse(data || "{}");
            if (parsed?.token) onToken(parsed.token);
          } catch {
            // ignore malformed chunks
          }
        }

        if (eventType === "done") setStatus("AI explanation complete.");
        if (eventType === "error") {
          let msg = "AI request failed.";
          try {
            msg = JSON.parse(data || "{}")?.error || msg;
          } catch {}

          const isRateLimit =
            /rate limit/i.test(msg) ||
            /Limit \d+, Used \d+/i.test(msg) ||
            /Please try again/i.test(msg);

          // Throw, but tag it so callers can show a friendly message
          const err = new Error(msg) as Error & { code?: string };
          if (isRateLimit) err.code = "RATE_LIMIT";
          throw err;
        }

      }
    }
  }

  function updatePopover(popoverId: string, patch: Partial<PopoverItem>) {
    setPopovers((prev) => {
      if (!prev.some((p) => p.id === popoverId)) return prev; // popover was closed
      return prev.map((p) => (p.id === popoverId ? { ...p, ...patch } : p));
    });
  }


  // One function for BOTH popup + verify
  const sendErrorToAI = async (
    mode: HelpMode,
    snippetOrCode: string,
    errorMessageOrErrors: string | VerifyError[],
    lineNumber?: number,
    target: "popover" | "bottom" = "popover",
    popoverId?: string
  ) => {
    if (!snippetOrCode) {
      if (target === "bottom") setCompilerOutput("Cannot explain: code is empty.");
      else if (popoverId) {
        setPopovers((prev) =>
          prev.map((p) => (p.id === popoverId ? { ...p, content: "Cannot explain: code is empty.", busy: false } : p))
        );
      }
      return;
    }

    if (Date.now() < aiCooldownUntil) {
      const secs = Math.ceil((aiCooldownUntil - Date.now()) / 1000);
      const msg = `AI is cooling down (${secs}s).`;
      if (target === "bottom") setCompilerOutput(msg);
      else if (popoverId) setPopovers((prev) => prev.map((p) => (p.id === popoverId ? { ...p, content: msg, busy: false } : p)));
      return;
    }
    setStatus("Requesting help...");

    // --- Initial UI text ---
    if (target === "bottom") {
      setCompilerOutput("");
    } else if (popoverId) {
      const loading =
        mode === "popup"
          ? "Loading diagnosis..."
          : mode === "popup-more"
          ? "Loading fix suggestion..."
          : mode === "popup-lesson"
          ? "Loading full help..."
          : "Loading explanation...";

      setPopovers((prev) =>
        prev.map((p) => (p.id === popoverId ? { ...p, mode, busy: true, content: loading } : p))
      );
    }

    const errors: VerifyError[] = Array.isArray(errorMessageOrErrors)
      ? errorMessageOrErrors
      : [{ line: lineNumber || 1, message: errorMessageOrErrors }];

    // --- Payload selection ---
    const payload =
      mode === "popup"
        ? { mode: "popup", code: snippetOrCode, errors, sentences: 1, verbosity: "brief" }
        : mode === "popup-more"
        ? { mode: "popup-more", code: snippetOrCode, errors, sentences: 2, verbosity: "brief" }
        : mode === "popup-lesson"
        ? { mode: "popup-lesson", code: snippetOrCode, errors, sentences: 4, verbosity: "brief" }
        : mode === "project-coach"
        ? { mode: "project-coach", code: snippetOrCode, errors, sentences: 8, verbosity: "brief" }
        : { mode: "arduino-verify", code: snippetOrCode, errors, sentences: 3, verbosity: "brief" };

    // --- Stream into the right target ---

if (target === "bottom") {
  setCompilerOutput("");
  setCoachJson(null);
  setCoachRaw("");

  let acc = "";

  try {
    await streamHelpSSE(payload, (t) => {
      acc += t;
      setCoachRaw(acc); // shows progress if you want
    });

    const trimmed = acc.trim();

    if (mode === "project-coach") {
      // ✅ never crash UI on bad output
      if (!trimmed.startsWith("{")) {
        setCoachJson(null);
        setCompilerOutput(trimmed);
        setStatus("AI feedback (text).");
        return;
      }

      try {
        const parsed = JSON.parse(trimmed) as CoachPayload;
        setCoachJson(parsed);
        setCompilerOutput("");
        setStatus("AI feedback ready.");
        return;
      } catch {
        setCoachJson(null);
        setCompilerOutput(trimmed);
        setStatus("AI feedback parse failed (showing text).");
        return;
      }
    }

    // fallback for non-JSON modes
    setCompilerOutput(trimmed);
    setStatus("AI explanation complete.");
  } catch (e: any) {
    const msg = e?.message || "AI request failed.";

    const isRate =
      e?.code === "RATE_LIMIT" ||
      /rate limit/i.test(msg) ||
      /Please try again/i.test(msg);

    if (isRate) {
      setCompilerOutput("AI is rate-limited right now. Try again in ~20 seconds.");
      setStatus("AI rate-limited.");
      setAiCooldownUntil(Date.now() + 22_000);
    } else {
      setCompilerOutput(msg);
      setStatus("AI request failed.");
    }
  }

  return;
}


    if (!popoverId) return;

    let acc = "";
    try {
      await streamHelpSSE(payload, (t) => {
        acc += t;
        updatePopover(popoverId, { content: acc });
      });
    } catch (e: any) {
      const msg = e?.message || "AI request failed.";

      const isRate =
        e?.code === "RATE_LIMIT" ||
        /rate limit/i.test(msg) ||
        /Please try again/i.test(msg);

      const nice = isRate
        ? "AI is rate-limited right now. Try again in ~20 seconds."
        : msg;

      updatePopover(popoverId, { content: nice });

      setStatus(isRate ? "AI rate-limited." : "AI request failed.");

      if (isRate) {
        setAiCooldownUntil(Date.now() + 22_000);
      }
    } finally {
      updatePopover(popoverId, { busy: false });
    }



  };

  const onMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme("arduino-dark");
    setStatus("Ready.");

    editor.onMouseDown((e: any) => {
      if (!e?.target?.position) return;

      const pos = e.target.position;
      const line = pos.lineNumber;

      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ resource: model.uri, owner: "verify" }) || [];
      const marker = markers.find((m: any) => line >= m.startLineNumber && line <= m.endLineNumber);
      if (!marker) return;
      const errorKey = `${marker.startLineNumber}:${marker.startColumn || 1}:${marker.message || ""}`;


      const full = editor.getValue() as string;
      const snippet = getCodeContext(full, marker.startLineNumber, 4);

      // Position near the error token INSIDE the editor (close to code)
      const anchorPos = { lineNumber: marker.startLineNumber, column: marker.startColumn || 1 };
      const scrolled = editor.getScrolledVisiblePosition(anchorPos);

      const POPOVER_W = 320;
      const POPOVER_H = 220;
      const OFFSET_X = 250;
      const OFFSET_Y = 20;

      let left = (scrolled?.left ?? 20) + OFFSET_X;
      let top = (scrolled?.top ?? 20) + OFFSET_Y;

      const editorDom = editor.getDomNode();
      if (editorDom) {
        const rect = editorDom.getBoundingClientRect();
        const maxLeft = rect.width - POPOVER_W - 10;
        const maxTop = rect.height - POPOVER_H - 10;

        if (left > maxLeft) left = Math.max(10, left - POPOVER_W - OFFSET_X);
        if (top > maxTop) top = Math.max(10, top - POPOVER_H - OFFSET_Y);
      }

const existing = popoversRef.current.find((p) => p.errorKey === errorKey);

if (existing) {
  // Refresh existing popover instead of creating a new one
  if (existing.busy) return;
  setPopovers((prev) =>
    prev.map((p) =>
      p.id === existing.id
        ? {
            ...p,
            top,
            left,
            mode: "popup",
            busy: true,
            content: "Loading diagnosis...",
            ctx: {
              code: full,
              snippet,
              message: marker.message,
              line: marker.startLineNumber,
            },
          }
        : p
    )
  );

  sendErrorToAI("popup", snippet, marker.message, marker.startLineNumber, "popover", existing.id);
  return;
}

// Otherwise create a brand new popover
    const id = makeId();

    setPopovers((prev) => [
      ...prev,
      {
        id,
        errorKey, 
        top,
        left,
        content: "Loading diagnosis...",
        mode: "popup",
        busy: true,
        ctx: {
          code: full,
          snippet,
          message: marker.message,
          line: marker.startLineNumber,
        },
      },
    ]);

    sendErrorToAI("popup", snippet, marker.message, marker.startLineNumber, "popover", id);

    });
  };

  // Resizable bottom bar handlers
  function handleDragStart(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = bottomHeight;
    window.addEventListener("mousemove", handleDragMove as any);
    window.addEventListener("mouseup", handleDragEnd as any);
  }

  function handleDragMove(e: MouseEvent) {
    const deltaY = dragStartYRef.current - e.clientY;
    let newHeight = dragStartHeightRef.current + deltaY;
    const MIN = 40;
      const MAX = Math.floor(window.innerHeight * 0.88);
    if (newHeight < MIN) newHeight = MIN;
    if (newHeight > MAX) newHeight = MAX;
    setBottomHeight(newHeight);
  }

  function handleDragEnd() {
    setIsResizing(false);
    window.removeEventListener("mousemove", handleDragMove as any);
    window.removeEventListener("mouseup", handleDragEnd as any);
  }

  const hasFooterContent = !!compilerOutput || !!coachJson || !!coachRaw;


  const handleVerify = async () => {
    if (!editorRef.current || !monacoRef.current) return;

    setStatus("Verifying sketch...");
    setCompilerOutput("");
    setCoachJson(null);
    setCoachRaw("");

    setLastErrors([]);
    setAiHelpMap({});

    try {
      const res = await fetch("http://ec2-3-147-46-215.us-east-2.compute.amazonaws.com:4000/verify-arduino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });

      let data: any = null;
      const text = await res.text();

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus(`Verification failed (${res.status}).`);
        setCompilerOutput(text || "Server returned an empty response.");
        return;
      }

      if (!data) {
        setStatus("Verification failed (invalid response).");
        setCompilerOutput(text || "Server returned an empty response.");
        return;
      }

      if (data.ok) {
        setStatus("Done verifying.");
        if (data.notices?.length) setCompilerOutput(data.notices.join("\n\n"));
        monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), "verify", []);
        return;
      }

      const errors: VerifyError[] = data.errors || [];
      setLastErrors(errors);

      monacoRef.current.editor.setModelMarkers(
        editorRef.current.getModel(),
        "verify",
        errors.map((err) => ({
          startLineNumber: err.line,
          startColumn: err.column || 1,
          endLineNumber: err.line,
          endColumn: (err.column || 1) + 1,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error,
        }))
      );

      editorRef.current.deltaDecorations(
        [],
        errors.map((err) => ({
          range: new monacoRef.current.Range(err.line, 1, err.line, 1000),
          options: {
            isWholeLine: true,
            className: styles.errorLineHighlight,
            glyphMarginClassName: styles.errorGlyph,
          },
        }))
      );

      const outputText = errors.map((err) => `Sketch.ino:${err.line}:${err.column || 1}: error: ${err.message}`).join("\n");

      setCompilerOutput(outputText);
      setStatus(`Found ${errors.length} error(s).`);
    } catch (err) {
      console.error(err);
      setStatus("Verification failed (server error).");
      setCompilerOutput("Server error.");
    }
  };

  const explainErrorsWithAI = async () => {
    const code = value || "";

    setStatus("Requesting suggestions...");
    setCompilerOutput("");
    setIsExplaining(true);

    try {
      // If the user hasn't verified, lastErrors will be empty — that's fine.
      // We still send full code and ask for general improvements.

      await sendErrorToAI("project-coach", value, lastErrors, undefined, "bottom");
    } catch (err) {
      console.error("❌ AI error:", err);
      setCompilerOutput("Something went wrong while asking the AI helper.");
      setStatus("AI request failed.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleReset = () => {
    setValue(DEFAULT_SKETCH);
    setCompilerOutput("");
    setCoachJson(null);
    setCoachRaw("");
    setAiHelpMap({});
    setLastErrors([]);
    setPopovers([]);

    if (!isFileMode && storageKey) {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(storageKey, DEFAULT_SKETCH);
      } catch (e) {
        console.error(e);
      }
    }

    setStatus("Sketch reset to default.");
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), "verify", []);
    }
  };

  // ---------------- Expand ----------------
  const handleExpand = () => {
    if (typeof window === "undefined") return;

    if (fileToken) {
      window.open(`/editor/arduino?fileToken=${encodeURIComponent(fileToken)}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (!storageKey) return;
    const url = `/editor/arduino?key=${encodeURIComponent(storageKey)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ---------------- Files actions ----------------

  function closeFilesMenu() {
    setFilesMenuOpen(false);
  }

  async function writeToFileHandle(handle: any, text: string) {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  function downloadAsFile(text: string, name: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name || "ElectricBoard.ino";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  const handleOpen = async () => {
    closeFilesMenu();

    try {
      const anyWin = window as any;

      if (anyWin?.showOpenFilePicker) {
        const [handle] = await anyWin.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Arduino sketch",
              accept: { "text/plain": [".ino", ".cpp", ".h", ".txt"] },
            },
          ],
        });
        if (!handle) return;

        const file = await handle.getFile();
        const text = await file.text();

        const token = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(FILE_TOKEN_PREFIX + token, JSON.stringify({ name: file.name, text }));

        window.open(`/editor/arduino?fileToken=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
        return;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    } catch (e) {
      console.error(e);
      setStatus("Open cancelled or failed.");
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const text = await f.text();
      const token = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      window.localStorage.setItem(FILE_TOKEN_PREFIX + token, JSON.stringify({ name: f.name, text }));

      window.open(`/editor/arduino?fileToken=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setStatus("Failed to open file.");
    }
  };

  const handleSaveAs = async () => {
    closeFilesMenu();

    try {
      const anyWin = window as any;
      if (anyWin?.showSaveFilePicker) {
        const handle = await anyWin.showSaveFilePicker({
          suggestedName: fileName || "ElectricBoard.ino",
          types: [
            {
              description: "Arduino sketch",
              accept: { "text/plain": [".ino", ".cpp", ".h", ".txt"] },
            },
          ],
        });

        if (!handle) return;

        await writeToFileHandle(handle, value);
        setFileHandle(handle);

        try {
          const file = await handle.getFile();
          setFileName(safeNameFromPath(file.name));
        } catch {}

        setLastSaved(new Date());
        setStatus("Saved to disk.");
        return;
      }

      downloadAsFile(value, fileName || "ElectricBoard.ino");
      setLastSaved(new Date());
      setStatus("Downloaded (Save As).");
    } catch (e) {
      console.error(e);
      setStatus("Save As cancelled or failed.");
    }
  };

  const handleSave = async () => {
    closeFilesMenu();

    try {
      if (fileHandle) {
        await writeToFileHandle(fileHandle, value);
        setLastSaved(new Date());
        setStatus("Saved to disk.");
        return;
      }

      await handleSaveAs();
    } catch (e) {
      console.error(e);
      setStatus("Save failed.");
    }
  };

  const handleCreateNew = () => {
    closeFilesMenu();
    if (typeof window === "undefined") return;

    const token = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(FILE_TOKEN_PREFIX + token, JSON.stringify({ name: "NewSketch.ino", text: DEFAULT_SKETCH }));

    window.open(`/editor/arduino?fileToken=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    setStatus("Created new sketch in a new tab.");
  };

  const filesMenuItemStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    fontSize: 12,
    color: "#e5e7eb",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  };

  const filesMenuItemHintStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: 10,
  };

  return (
    <div
      style={{
        width,
        height,
        minWidth: 260,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "visible",
        border: "1px solid #1f2937",
        background: "#020617",
        position: "relative",
        userSelect: isResizing ? "none" : "auto",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".ino,.cpp,.h,.txt,text/plain"
        style={{ display: "none" }}
        onChange={onFileInputChange}
      />

      {/* Top bar */}
      <div
        style={{
          background: "#020617",
          borderBottom: "1px solid #1f2937",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 12,
          color: "#e5e7eb",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "999px", background: "#10b981" }} />
          <span>{safeNameFromPath(fileName)}</span>
          {isFileMode ? (
            <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>(File)</span>
          ) : (
            <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>(Lesson)</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={handleVerify} style={toolbarButtonStyle}>
            Verify
          </button>

        <button
          type="button"
          onClick={explainErrorsWithAI}
          style={{
            ...toolbarButtonStyle,
            opacity: isExplaining ? 0.5 : 1,
            cursor: isExplaining ? "not-allowed" : "pointer",
          }}
          disabled={isExplaining}
        >
          Check Code
        </button>

          {/* Files dropdown */}
          <div style={{ position: "relative" }}>
            <button
              ref={filesBtnRef}
              type="button"
              onClick={() => setFilesMenuOpen((v) => !v)}
              style={{
                ...toolbarButtonStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              aria-haspopup="menu"
              aria-expanded={filesMenuOpen}
            >
              Files <span style={{ opacity: 0.8 }}>▾</span>
            </button>

            {filesMenuOpen ? (
              <div
                ref={filesMenuRef}
                role="menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: 220,
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  padding: 6,
                  zIndex: 2000,
                }}
              >
                <button role="menuitem" type="button" onClick={handleOpen} style={filesMenuItemStyle}>
                  Open…
                  <span style={filesMenuItemHintStyle}>from computer</span>
                </button>

                <button role="menuitem" type="button" onClick={handleSave} style={filesMenuItemStyle}>
                  Save
                  <span style={filesMenuItemHintStyle}>{fileHandle ? "overwrite" : "Save As"}</span>
                </button>

                <button role="menuitem" type="button" onClick={handleSaveAs} style={filesMenuItemStyle}>
                  Save As…
                  <span style={filesMenuItemHintStyle}>choose location</span>
                </button>

                <div style={{ height: 1, background: "#1f2937", margin: "6px 0" }} />

                <button role="menuitem" type="button" onClick={handleCreateNew} style={filesMenuItemStyle}>
                  Create New
                  <span style={filesMenuItemHintStyle}>new tab</span>
                </button>
              </div>
            ) : null}
          </div>

          <button type="button" onClick={handleExpand} style={toolbarButtonStyle}>
            Expand
          </button>

          <button type="button" onClick={handleReset} style={{ ...toolbarButtonStyle, opacity: 0.8 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Editor + footer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="cpp"
            value={value}
            onChange={onChange}
            beforeMount={beforeMount}
            onMount={onMount}
            options={{
              fontSize: 14,
              fontFamily:
                "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: "off",
              tabSize: 2,
              insertSpaces: true,
              smoothScrolling: true,
              scrollBeyondLastLine: false,
              bracketPairColorization: { enabled: true },
              glyphMargin: true,
              lineNumbers: "on",
            }}
          />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            height: 6,
            cursor: "row-resize",
            background: "#020617",
            borderTop: "1px solid #1f2937",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              margin: "2px auto",
              borderRadius: 999,
              background: "#4b5563",
            }}
          />
        </div>

        {/* Bottom bar */}
        <div
          style={{
            height: bottomHeight,
            minHeight: 40,
            //maxHeight: "60vh",
            borderTop: "1px solid #1f2937",
            background: "#020617",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 11,
            color: "#9ca3af",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "2px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              gap: 10,
            }}
          >
            <span>{status}</span>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Board: Arduino Uno • Port: Not connected
              {lastSaved && <span style={{ marginLeft: 12 }}>| Last saved: {lastSaved.toLocaleTimeString()}</span>}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: hasFooterContent ? "auto" : "hidden",
              padding: hasFooterContent ? "4px 10px 6px" : "0 10px 4px",
            }}
          >
{coachJson ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb" }}>
      {coachJson.summary}
    </div>

    {coachJson.sections.map((sec, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
          {sec.title}
        </div>

        {sec.items.map((it, j) => (
          <div
            key={j}
            style={{
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: "8px 10px",
              background: "#0b1220",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  background: coachTagBg(it.tag),
                  color: coachTagColor(it.tag),
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {it.tag}
              </span>

              {it.line != null ? (
                <span style={{ fontSize: 10, color: "#9ca3af" }}>Line {it.line}</span>
              ) : null}
            </div>

            <div style={{ color: "#e5e7eb", fontSize: 11, lineHeight: 1.35 }}>
              <strong style={{ color: "#e5e7eb" }}>{it.text}</strong>
            </div>

            <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 6, lineHeight: 1.35 }}>
              <div><span style={{ color: "#cbd5e1", fontWeight: 700 }}>Why:</span> {it.why}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Recommendation:</span> {it.recommendation}
              </div>
            </div>

            {it.code ? (
              <pre
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: 11,
                  color: "#e5e7eb",
                  background: "#060b16",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                {it.code}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    ))}
  </div>
) : compilerOutput ? (
  <pre
    style={{
      margin: 0,
      whiteSpace: "pre-wrap",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      fontSize: 11,
      color: "#fca5a5",
      lineHeight: 1.3,
    }}
  >
    {compilerOutput}
  </pre>
) : null}


          </div>
        </div>
      </div>

      {/* AI popovers (multiple) */}
      {popovers.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            width: 320,
            background: "#0b1220",
            color: "#e5e7eb",
            border: "1px solid #1f2937",
            padding: 10,
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
            zIndex: 1000,
            cursor: "default",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (drag handle) */}
          <div
            onMouseDown={(e) => startPopoverDrag(p.id, e)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              cursor: "grab",
              userSelect: "none",
              paddingBottom: 4,
            }}
          >
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {p.mode === "popup" ? "Diagnosis" : p.mode === "popup-more" ? "Fix suggestion" : "Why it happened"}
            </div>

            <button
              type="button"
              onClick={() => setPopovers((prev) => prev.filter((x) => x.id !== p.id))}
              aria-label="Close"
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#111827",
                color: "#e5e7eb",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ marginTop: 8, color: "#e5e7eb", lineHeight: 1.35, whiteSpace: "pre-wrap" }}>{p.content}</div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              disabled={p.busy}
              onClick={() => sendErrorToAI("popup-more", p.ctx.snippet, p.ctx.message, p.ctx.line, "popover", p.id)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid #1f2937",
                background: "#111827",
                color: "#e5e7eb",
                cursor: p.busy ? "not-allowed" : "pointer",
                opacity: p.busy ? 0.55 : 1,
                fontSize: 12,
              }}
            >
              Explain more
            </button>

            <button
              type="button"
              disabled={p.busy}
              onClick={() => sendErrorToAI("popup-lesson", p.ctx.code, p.ctx.message, p.ctx.line, "popover", p.id)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid #1f2937",
                background: "#111827",
                color: "#e5e7eb",
                cursor: p.busy ? "not-allowed" : "pointer",
                opacity: p.busy ? 0.55 : 1,
                fontSize: 12,
              }}
            >
              Open full help
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

