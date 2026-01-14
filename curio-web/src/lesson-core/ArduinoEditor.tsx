// src/lesson-core/ArduinoEditor.tsx
"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import styles from "./AruinoEditor.module.css";

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

  // (kept from your TSX even though it isn’t used yet)
  const [aiHelpMap, setAiHelpMap] = React.useState<Record<string, string>>({});

  const [popoverContent, setPopoverContent] = React.useState("");
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });
  const [popoverVisible, setPopoverVisible] = React.useState(false);

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
     - File mode: load from localStorage token payload (with sessionStorage cache to survive Strict Mode)
     - Lesson mode: load from localStorage storageKey
  ============================================================ */
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // FILE MODE: load payload passed from opener via localStorage
    if (fileToken) {
      try {
        // 1) Try localStorage (cross-tab handoff)
        let raw = window.localStorage.getItem(FILE_TOKEN_PREFIX + fileToken);

        // 2) If missing (Strict Mode double-mount, or cleanup already happened), fall back to sessionStorage cache
        if (!raw) {
          raw = window.sessionStorage.getItem(FILE_TOKEN_CACHE_PREFIX + fileToken);
        }

        if (!raw) {
          // IMPORTANT: don’t clobber if we already have something in state
          setStatus("Could not load file (missing token).");
          setFileHandle(null);
          setFileName("ElectricBoard.ino");
          setValue((prev) => (prev ? prev : DEFAULT_SKETCH));
          return;
        }

        const payload = JSON.parse(raw) as { name: string; text: string };

        // Cache for this tab so Strict Mode remount still works
        try {
          window.sessionStorage.setItem(
            FILE_TOKEN_CACHE_PREFIX + fileToken,
            JSON.stringify({ name: payload.name, text: payload.text })
          );
        } catch {
          // ignore
        }

        setFileName(safeNameFromPath(payload.name || "Sketch.ino"));
        setValue(payload.text ?? DEFAULT_SKETCH);

        // File handles cannot be transferred
        setFileHandle(null);
        setStatus(`Opened: ${payload.name}`);

        // Cleanup localStorage token AFTER we’ve cached it (and don’t do it synchronously)
        // This prevents Strict Mode remount from immediately losing the payload.
        if (window.localStorage.getItem(FILE_TOKEN_PREFIX + fileToken)) {
          window.setTimeout(() => {
            try {
              window.localStorage.removeItem(FILE_TOKEN_PREFIX + fileToken);
            } catch {
              // ignore
            }
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

    // LESSON MODE
    if (storageKey) {
      const saved = window.localStorage.getItem(storageKey);
      setValue(saved ?? DEFAULT_SKETCH);
      setStatus("Ready.");
      setFileHandle(null);
      setFileName("ElectricBoard.ino");
      return;
    }

    // no storageKey + no fileToken
    setValue(DEFAULT_SKETCH);
    setStatus("Ready.");
    setFileHandle(null);
    setFileName("ElectricBoard.ino");
  }, [storageKey, fileToken]);

  /* ============================================================
     Sync across tabs (LESSON MODE ONLY)
     - If lesson sketch changes in another tab, reflect it here.
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

    // Only lesson mode autosaves to localStorage
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
          [
            /\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|millis|micros)\b(?=\s*\()/,
            "function",
          ],
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

  // Send the clicked error (with snippet context) to AI, streaming into popover
  const sendErrorToAI = async (snippetOrCode: string, errorMessage: string, lineNumber: number) => {
    if (!snippetOrCode) {
      setPopoverContent("Cannot explain: code is empty.");
      return;
    }

    setPopoverContent("Loading explanation...");
    setStatus("Requesting AI explanation...");

    try {
      const res = await fetch("/api/ai/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "arduino-verify",
          code: snippetOrCode,
          errors: [{ line: lineNumber, message: errorMessage }],
          sentences: 3,
          verbosity: "brief",
        }),
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
      const popoverRef = { current: "" };

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
            const { token } = JSON.parse(data);
            popoverRef.current += token;
            setPopoverContent(popoverRef.current);
          }

          if (eventType === "done") setStatus("AI explanation complete.");
          if (eventType === "error") {
            const { error } = JSON.parse(data);
            setPopoverContent(error);
            setStatus("AI request failed.");
          }
        }
      }
    } catch (err) {
      console.error("❌ AI error:", err);
      setPopoverContent("Something went wrong while asking the AI helper.");
      setStatus("AI request failed.");
    }
  };

  const onMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme("arduino-dark");
    setStatus("Ready.");

    editor.onMouseDown((e: any) => {
      if (!e?.target?.position) return;

      const POPOVER_OFFSET = 12;
      const line = e.target.position.lineNumber;
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ resource: model.uri, owner: "verify" }) || [];
      const marker = markers.find((m: any) => line >= m.startLineNumber && line <= m.endLineNumber);

      if (!marker) {
        setPopoverVisible(false);
        return;
      }

      const editorDom = editor.getDomNode();
      if (!editorDom) return;

      const editorRect = editorDom.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;

      // Vertical position relative to editor + its own internal scroll
      const top = e.event.posy - editorRect.top + editorDom.scrollTop;

      // Place popover to the right of editor
      let left = editorRect.width + POPOVER_OFFSET;

      // Clamp popover so it doesn't go off-screen
      const POPUP_WIDTH = 300;
      const maxLeft = window.innerWidth - POPUP_WIDTH - 10;
      if (left + editorRect.left + scrollX > maxLeft) {
        left = maxLeft - editorRect.left - scrollX;
      }

      setPopoverPosition({ top, left });
      setPopoverContent(marker.message || "Loading explanation...");
      setPopoverVisible(true);

      const full = editor.getValue() as string;
      const snippet = getCodeContext(full, marker.startLineNumber, 4);
      sendErrorToAI(snippet, marker.message, marker.startLineNumber);
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
    const MIN = 40,
      MAX = 500;
    if (newHeight < MIN) newHeight = MIN;
    if (newHeight > MAX) newHeight = MAX;
    setBottomHeight(newHeight);
  }

  function handleDragEnd() {
    setIsResizing(false);
    window.removeEventListener("mousemove", handleDragMove as any);
    window.removeEventListener("mouseup", handleDragEnd as any);
  }

  const hasFooterContent = !!compilerOutput;

  const handleVerify = async () => {
    if (!editorRef.current || !monacoRef.current) return;

    setStatus("Verifying sketch...");
    setCompilerOutput("");
    setLastErrors([]);
    setAiHelpMap({});

    try {
      const res = await fetch("/api/verify-arduino", {
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
          aiKey: `${err.line}:${err.column || 1}`,
          tags: [monacoRef.current.MarkerTag.Unnecessary],
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

      const outputText = errors
        .map((err) => `Sketch.ino:${err.line}:${err.column || 1}: error: ${err.message}`)
        .join("\n");

      setCompilerOutput(outputText);
      setStatus(`Found ${errors.length} error(s).`);
    } catch (err) {
      console.error(err);
      setStatus("Verification failed (server error).");
      setCompilerOutput("Server error.");
    }
  };

  const explainErrorsWithAI = async () => {
    if (!lastErrors || lastErrors.length === 0) {
      setCompilerOutput("No errors to explain. Run Verify first.");
      return;
    }

    setStatus("Requesting AI explanation...");
    setCompilerOutput("");
    setIsExplaining(true);

    try {
      const res = await fetch("/api/ai/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "arduino-verify",
          code: value,
          errors: lastErrors,
          sentences: 20,
          verbosity: "verbose",
        }),
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
            const { token } = JSON.parse(data);
            setCompilerOutput((prev) => prev + token);
          }

          if (eventType === "done") setStatus("AI explanation complete.");
          if (eventType === "error") {
            const { error } = JSON.parse(data);
            setCompilerOutput(error);
            setStatus("AI request failed.");
          }
        }
      }
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
    setAiHelpMap({});
    setLastErrors([]);
    setPopoverVisible(false);

    // Only lesson mode should write back to the lesson sketch key
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
      window.open(
        `/editor/arduino?fileToken=${encodeURIComponent(fileToken)}`,
        "_blank",
        "noopener,noreferrer"
      );
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

      // Prefer File System Access API
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

        const token =
          (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        window.localStorage.setItem(FILE_TOKEN_PREFIX + token, JSON.stringify({ name: file.name, text }));

        window.open(`/editor/arduino?fileToken=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
        return;
      }

      // Fallback: hidden input
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
      const token =
        (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

    const token =
      (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(
      FILE_TOKEN_PREFIX + token,
      JSON.stringify({ name: "NewSketch.ino", text: DEFAULT_SKETCH })
    );

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
      {/* hidden file input fallback */}
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
              opacity: lastErrors.length === 0 || isExplaining ? 0.5 : 1,
              cursor: lastErrors.length === 0 || isExplaining ? "not-allowed" : "pointer",
            }}
            disabled={lastErrors.length === 0 || isExplaining}
          >
            Explain Error
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
            maxHeight: "60vh",
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
              {lastSaved && (
                <span style={{ marginLeft: 12 }}>| Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: hasFooterContent ? "auto" : "hidden",
              padding: hasFooterContent ? "4px 10px 6px" : "0 10px 4px",
            }}
          >
            {compilerOutput && (
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
            )}
          </div>
        </div>
      </div>

      {/* AI popover */}
      {popoverVisible && (
        <div
          style={{
            position: "absolute",
            top: popoverPosition.top,
            left: popoverPosition.left,
            background: "#1f2937",
            color: "#d1d5db",
            padding: "8px 12px",
            borderRadius: 6,
            maxWidth: 300,
            fontSize: 12,
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            zIndex: 1000,
            cursor: "pointer",
          }}
          onClick={() => setPopoverVisible(false)}
          title="Click to close"
        >
          {popoverContent}
        </div>
      )}
    </div>
  );
}
