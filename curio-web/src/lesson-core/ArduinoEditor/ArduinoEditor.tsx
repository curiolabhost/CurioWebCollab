// ArduinoEditor.tsx
"use client";

import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter, linter, type Diagnostic, setDiagnostics } from "@codemirror/lint";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";

import styles from "./ArduinoEditor.module.css";

import ArduinoEditorTopBar from "./topBar";
import ArduinoEditorFooter from "./footer";

import {
  type VerifyError,
  type CoachPayload,
  makeId,
  safeNameFromPath,
  getCodeContext,
  formatAIText,
  verifyErrorsToDiagnostics,
  streamHelpSSE,
  makeEmptyCoach,
  createCoachStreamParser,
} from "./arduinoLogic";

const DEFAULT_SKETCH = `/* Electric Board Code Editor */
void setup() {
  // put your setup code here, to run once:
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === "production" ? "https://api.curio.courses" : "http://localhost:4000");

console.log("NEXT_PUBLIC_API_BASE =", process.env.NEXT_PUBLIC_API_BASE);
console.log("API_BASE being used =", API_BASE);

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

function arduinoCompletionSource(ctx: CompletionContext) {
  const word = ctx.matchBefore(/[A-Za-z_][A-Za-z0-9_.]*/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;

  return {
    from: word.from,
    options: ARDUINO_FUNCS.map((label) => ({
      label,
      type: "function" as const,
    })),
  };
}

// ---------- Error line highlighter ----------
const setErrorLinesEffect = StateEffect.define<number[]>();

const errorLineDecosField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    if (tr.docChanged) decos = decos.map(tr.changes);

    for (const e of tr.effects) {
      if (e.is(setErrorLinesEffect)) {
        const lines = e.value || [];
        if (!lines.length) return Decoration.none;

        const uniqSorted = Array.from(new Set<number>(lines))
          .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= tr.state.doc.lines)
          .sort((a: number, b: number) => a - b);

        const ranges = uniqSorted.map((ln: number) => {
          const line = tr.state.doc.line(ln);
          return Decoration.line({ class: styles.cmErrorLine }).range(line.from);
        });

        return Decoration.set(ranges, true);
      }
    }

    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const errorLineHighlighter = [errorLineDecosField];

// ---------- Types ----------
type HelpMode = "popup" | "popup-more" | "popup-lesson" | "arduino-verify" | "project-coach";

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

type ArduinoEditorProps = {
  height?: string | number;
  width?: string | number;

  // Lesson-mode persistence
  storageKey?: string;

  // File-mode persistence
  fileToken?: string;

  // Backend identity (required for server persistence)
  projectSlug?: string;
  lessonSlug?: string;

  /** When provided (e.g. admin view), use this instead of fetching from API */
  initialArduinoCode?: string | null;
  /** When true, display only; no save to server or localStorage */
  readOnly?: boolean;
};

async function fetchArduinoState(projectSlug: string, lessonSlug: string) {
  const qs = new URLSearchParams({ projectSlug, lessonSlug });
  const res = await fetch(`/api/arduino-state?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as { ok: boolean; arduino?: { code?: string } | null };
}

async function saveArduinoState(projectSlug: string, lessonSlug: string, code: string) {
  const res = await fetch("/api/arduino-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectSlug, lessonSlug, code }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { ok: boolean; arduino?: { code?: string } | null };
}

const FILE_TOKEN_PREFIX = "curio:fileopen:";
const FILE_TOKEN_CACHE_PREFIX = "curio:fileopen-cache:"; // sessionStorage per tab

export default function ArduinoEditor({
  height = "100%",
  width = "100%",
  storageKey,
  fileToken,
  projectSlug,
  lessonSlug,
  initialArduinoCode,
  readOnly = false,
}: ArduinoEditorProps) {
  const isFileMode = !!fileToken;

  const [isExplaining, setIsExplaining] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("Ready.");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [lastErrors, setLastErrors] = React.useState<VerifyError[]>([]);
  const [compilerOutput, setCompilerOutput] = React.useState("");

  const [aiCooldownUntil, setAiCooldownUntil] = React.useState<number>(0);

  const [popovers, setPopovers] = React.useState<PopoverItem[]>([]);
  const [coachJson, setCoachJson] = React.useState<CoachPayload | null>(null);
  const [coachRaw, setCoachRaw] = React.useState<string>("");
  const [coachLive, setCoachLive] = React.useState<CoachPayload | null>(null);

  const [isSaving, setIsSaving] = React.useState(false);

  const popoversRef = React.useRef<PopoverItem[]>([]);
  React.useEffect(() => {
    popoversRef.current = popovers;
  }, [popovers]);

  // Multi-popover drag refs
  const dragPopoverIdRef = React.useRef<string | null>(null);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  // Footer resize
  const [bottomHeight, setBottomHeight] = React.useState(90);
  const [isResizing, setIsResizing] = React.useState(false);
  const dragStartYRef = React.useRef(0);
  const dragStartHeightRef = React.useRef(0);

  // Local save throttle
  const rafRef = React.useRef<number | null>(null);

  // CodeMirror refs
  const cmViewRef = React.useRef<EditorView | null>(null);
  const diagnosticsRef = React.useRef<Diagnostic[]>([]);

  // Debounced server save
  const serverSaveTimerRef = React.useRef<number | null>(null);

  // Coach stream parser
  const coachParserRef = React.useRef<ReturnType<typeof createCoachStreamParser> | null>(null);

  // -------- Files menu state --------
  const [filesMenuOpen, setFilesMenuOpen] = React.useState(false);
  const filesBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const filesMenuRef = React.useRef<HTMLDivElement | null>(null);

  // Currently opened/saved file handle (Chromium File System Access API)
  const [fileHandle, setFileHandle] = React.useState<any>(null);
  const [fileName, setFileName] = React.useState<string>("ElectricBoard.ino");

  // hidden <input type=file> fallback
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  /* ============================================================
     CodeMirror: linter + click-to-explain
  ============================================================ */

  const verifyLinter = React.useMemo(
    () =>
      linter(() => {
        return diagnosticsRef.current;
      }),
    []
  );

  const sendErrorToAI = React.useCallback(
    async (
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
            prev.map((p) =>
              p.id === popoverId ? { ...p, content: "Cannot explain: code is empty.", busy: false } : p
            )
          );
        }
        return;
      }

      if (Date.now() < aiCooldownUntil) {
        const secs = Math.ceil((aiCooldownUntil - Date.now()) / 1000);
        const msg = `AI is cooling down (${secs}s).`;
        if (target === "bottom") setCompilerOutput(msg);
        else if (popoverId) {
          setPopovers((prev) => prev.map((p) => (p.id === popoverId ? { ...p, content: msg, busy: false } : p)));
        }
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

        setPopovers((prev) => prev.map((p) => (p.id === popoverId ? { ...p, mode, busy: true, content: loading } : p)));
      }

      const errors: VerifyError[] = Array.isArray(errorMessageOrErrors)
        ? errorMessageOrErrors
        : [{ line: lineNumber || 1, message: errorMessageOrErrors }];

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

      // --- BOTTOM TARGET (footer) ---
      if (target === "bottom") {
        setCompilerOutput("");
        setCoachJson(null);
        setCoachRaw("");

        // Initialize coach live parser for project-coach
        if (mode === "project-coach") {
          const base = makeEmptyCoach(errors);
          setCoachLive(base);
          coachParserRef.current = createCoachStreamParser(base, (p) => setCoachLive(p));
        } else {
          setCoachLive(null);
          coachParserRef.current = null;
        }

        let acc = "";

        try {
          await streamHelpSSE(payload, (t) => {
            acc += t;

            if (mode === "project-coach") {
              coachParserRef.current?.ingestChunk(t);
              // keep a raw fallback visible while cards haven't materialized yet
              setCoachRaw(acc);
              return;
            }

            setCompilerOutput(acc);
          });

          const trimmed = acc.trim();

          if (mode === "project-coach") {
            coachParserRef.current?.flush();
            const final = coachParserRef.current?.getPayload();
            const hasCards = !!final?.sections?.some((s) => (s?.items || []).length > 0);

            if (hasCards) {
              setCompilerOutput("");
              setCoachRaw("");
              setStatus("AI feedback ready.");
              return;
            }

            setCoachLive(null);
            setCoachRaw("");
            setCompilerOutput(trimmed);
            setStatus("AI feedback (text).");
            return;
          }

          setCompilerOutput(trimmed);
          setStatus("AI explanation complete.");
        } catch (e: any) {
          const msg = e?.message || "AI request failed.";
          const isRate = e?.code === "RATE_LIMIT" || /rate limit/i.test(msg) || /Please try again/i.test(msg);

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

      // --- POPOVER TARGET ---
      if (!popoverId) return;

      const updatePopover = (popoverId: string, patch: Partial<PopoverItem>) => {
        setPopovers((prev) => {
          if (!prev.some((p) => p.id === popoverId)) return prev;
          return prev.map((p) => (p.id === popoverId ? { ...p, ...patch } : p));
        });
      };

      let acc = "";
      try {
        await streamHelpSSE(payload, (t) => {
          acc += t;
          updatePopover(popoverId, { content: acc });
        });
      } catch (e: any) {
        const msg = e?.message || "AI request failed.";
        const isRate = e?.code === "RATE_LIMIT" || /rate limit/i.test(msg) || /Please try again/i.test(msg);
        const nice = isRate ? "AI is rate-limited right now. Try again in ~20 seconds." : msg;

        updatePopover(popoverId, { content: nice });
        setStatus(isRate ? "AI rate-limited." : "AI request failed.");

        if (isRate) setAiCooldownUntil(Date.now() + 22_000);
      } finally {
        updatePopover(popoverId, { busy: false });
      }
    },
    [aiCooldownUntil]
  );

  const clickToExplainErrors = React.useMemo(() => {
    return EditorView.domEventHandlers({
      mousedown: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return;

        const hit = diagnosticsRef.current.find((d) => pos >= d.from && pos <= d.to);
        if (!hit) return;

        const line = view.state.doc.lineAt(pos).number;
        const code = view.state.doc.toString();
        const snippet = getCodeContext(code, line, 4);

        const id = makeId();
        const errorKey = `${line}:${hit.message}`;

        setPopovers((prev) => [
          ...prev,
          {
            id,
            errorKey,
            top: event.clientY - 10,
            left: event.clientX + 10,
            content: "Loading diagnosis...",
            mode: "popup",
            busy: true,
            ctx: { code, snippet, message: hit.message, line },
          },
        ]);

        sendErrorToAI("popup", snippet, hit.message, line, "popover", id);
      },
    });
  }, [sendErrorToAI]);

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

    // Admin view: use provided initial code, skip fetch
    if (initialArduinoCode != null) {
      setValue(typeof initialArduinoCode === "string" ? initialArduinoCode : DEFAULT_SKETCH);
      setStatus(readOnly ? "Admin view (read-only)" : "Loaded from admin state.");
      setFileHandle(null);
      setFileName("ElectricBoard.ino");
      return;
    }

    if (storageKey) {
      const canServer = !!(projectSlug && lessonSlug && !fileToken);

      if (canServer) {
        (async () => {
          try {
            const r = await fetchArduinoState(projectSlug!, lessonSlug!);
            const serverCode = r?.ok ? r?.arduino?.code : null;

            if (typeof serverCode === "string" && serverCode.length > 0) {
              setValue(serverCode);
              setStatus("Loaded from server.");
              if (!readOnly) {
                try {
                  window.localStorage.setItem(storageKey, serverCode);
                } catch {}
              }
            } else {
              const saved = window.localStorage.getItem(storageKey);
              setValue(saved ?? DEFAULT_SKETCH);
              setStatus("Loaded from device (fallback).");
            }
          } catch {
            const saved = window.localStorage.getItem(storageKey);
            setValue(saved ?? DEFAULT_SKETCH);
            setStatus("Loaded from device (fallback).");
          } finally {
            setFileHandle(null);
            setFileName("ElectricBoard.ino");
          }
        })();

        return;
      }

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
  }, [storageKey, fileToken, projectSlug, lessonSlug, initialArduinoCode, readOnly]);

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
    if (readOnly) return;
    const text = v ?? "";
    setValue(text);
    setStatus("Editing...");

    // ---------- Local save (lesson-mode only) ----------
    if (storageKey && !isFileMode) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      rafRef.current = window.requestAnimationFrame(() => {
        try {
          window.localStorage.setItem(storageKey, text);
          setLastSaved(new Date());
          setStatus("Saved (device).");
        } catch {
          setStatus("Save failed (storage).");
        }
      });
    }

    // ---------- Backend save (only if we have identity + lesson mode) ----------
    const canServer = !!(projectSlug && lessonSlug && storageKey && !isFileMode);
    if (!canServer) return;

    if (serverSaveTimerRef.current) window.clearTimeout(serverSaveTimerRef.current);

    serverSaveTimerRef.current = window.setTimeout(async () => {
      try {
        const r = await saveArduinoState(projectSlug!, lessonSlug!, text);
        if (!r?.ok) {
          setStatus("Save failed (server).");
          return;
        }
        setLastSaved(new Date());
        setStatus("Saved (server).");
      } catch (e) {
        console.error(e);
        setStatus("Save failed (server).");
      }
    }, 700);
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

  const hasFooterContent = !!compilerOutput || !!coachJson || !!coachRaw || !!coachLive;

  const reloadFromServer = async () => {
    if (readOnly) return;
    if (isFileMode) {
      setStatus("Reload not available in File mode.");
      return;
    }
    if (!projectSlug || !lessonSlug) {
      setStatus("Reload failed: missing project/lesson identity.");
      return;
    }

    setStatus("Reloading from server...");

    try {
      const r = await fetchArduinoState(projectSlug, lessonSlug);
      const serverCode = r?.ok ? r?.arduino?.code : null;

      if (typeof serverCode === "string" && serverCode.length > 0) {
        setValue(serverCode);
        setLastSaved(new Date());
        setStatus("Reloaded from server.");

        if (storageKey) {
          try {
            window.localStorage.setItem(storageKey, serverCode);
          } catch {}
        }

        diagnosticsRef.current = [];
        cmViewRef.current?.dispatch(setDiagnostics(cmViewRef.current.state, []));

        setCompilerOutput("");
        setCoachJson(null);
        setCoachRaw("");
        setLastErrors([]);
        setPopovers([]);
        return;
      }

      const local = storageKey ? window.localStorage.getItem(storageKey) : null;
      setValue(local ?? DEFAULT_SKETCH);
      setStatus("Server had no saved code (loaded fallback).");
    } catch (e) {
      console.error(e);
      setStatus("Reload failed (server).");
    }
  };

  const saveNowToServer = async () => {
    if (readOnly) return;
    if (isFileMode) {
      setStatus("Save to server not available in File mode.");
      return;
    }
    if (!projectSlug || !lessonSlug) {
      setStatus("Save failed: missing project/lesson identity.");
      return;
    }

    if (serverSaveTimerRef.current) {
      window.clearTimeout(serverSaveTimerRef.current);
      serverSaveTimerRef.current = null;
    }

    setIsSaving(true);
    setStatus("Saving to server...");

    try {
      const r = await saveArduinoState(projectSlug, lessonSlug, value ?? "");
      if (!r?.ok) {
        setStatus("Save failed (server).");
        return;
      }

      setLastSaved(new Date());
      setStatus("Saved (server).");

      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, value ?? "");
        } catch {}
      }
    } catch (e) {
      console.error(e);
      setStatus("Save failed (server).");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!cmViewRef.current) return;
    const view = cmViewRef.current;

    setStatus("Verifying sketch...");
    setCompilerOutput("");
    setCoachJson(null);
    setCoachRaw("");
    setCoachLive(null);
    coachParserRef.current = null;

    setLastErrors([]);

    // clear previous UI immediately
    view.dispatch({ effects: setErrorLinesEffect.of([]) });
    view.dispatch(setDiagnostics(view.state, []));
    diagnosticsRef.current = [];

    try {
      const res = await fetch(`${API_BASE}/verify-arduino`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus(`Verification failed (${res.status}).`);
        setCompilerOutput(text || "Server returned an empty response.");

        view.dispatch({ effects: setErrorLinesEffect.of([]) });
        view.dispatch(setDiagnostics(view.state, []));
        diagnosticsRef.current = [];
        return;
      }

      if (!data) {
        setStatus("Verification failed (invalid response).");
        setCompilerOutput(text || "Server returned an empty response.");

        view.dispatch({ effects: setErrorLinesEffect.of([]) });
        view.dispatch(setDiagnostics(view.state, []));
        diagnosticsRef.current = [];
        return;
      }

      if (data.ok) {
        setStatus("Done verifying.");
        if (data.notices?.length) setCompilerOutput(data.notices.join("\n\n"));

        view.dispatch(setDiagnostics(view.state, []));
        diagnosticsRef.current = [];
        view.dispatch({ effects: setErrorLinesEffect.of([]) });
        return;
      }

      const errors: VerifyError[] = data.errors || [];
      setLastErrors(errors);

      const diags = verifyErrorsToDiagnostics(view, errors);
      diagnosticsRef.current = diags;

      view.dispatch(setDiagnostics(view.state, diags));
      view.dispatch({ effects: setErrorLinesEffect.of(errors.map((e) => e.line)) });

      const outputText = errors
        .map((err) => `Sketch.ino:${err.line}:${err.column || 1}: error: ${err.message}`)
        .join("\n");

      setCompilerOutput(outputText);
      setStatus(`Found ${errors.length} error(s).`);
    } catch (err) {
      console.error(err);
      setStatus("Verification failed (server error).");
      setCompilerOutput("Server error.");

      view.dispatch({ effects: setErrorLinesEffect.of([]) });
      view.dispatch(setDiagnostics(view.state, []));
      diagnosticsRef.current = [];
    }
  };

  const explainErrorsWithAI = async () => {
    setStatus("Requesting suggestions...");
    setCompilerOutput("");
    setIsExplaining(true);

    try {
      await sendErrorToAI("project-coach", value, lastErrors, undefined, "bottom");
    } catch (err) {
      console.error("❌ AI error:", err);
      setCompilerOutput("Something went wrong while asking the AI helper.");
      setStatus("AI request failed.");
    } finally {
      setIsExplaining(false);
    }
  };

  // Expand
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

    window.localStorage.setItem(
      FILE_TOKEN_PREFIX + token,
      JSON.stringify({ name: "NewSketch.ino", text: DEFAULT_SKETCH })
    );

    window.open(`/editor/arduino?fileToken=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    setStatus("Created new sketch in a new tab.");
  };

  // ---------- Popover drag ----------
  function startPopoverDrag(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const p = popoversRef.current.find((x) => x.id === id);
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

      <ArduinoEditorTopBar
        fileName={fileName}
        isFileMode={isFileMode}
        hasFileHandle={!!fileHandle}
        isExplaining={isExplaining}
        isSaving={isSaving}
        readOnly={readOnly}
        canServer={!readOnly && !!projectSlug && !!lessonSlug && !isFileMode}
        onVerify={handleVerify}
        onCheckCode={explainErrorsWithAI}
        onExpand={handleExpand}
        onSaveNowToServer={saveNowToServer}
        onReloadFromServer={reloadFromServer}
        filesMenuOpen={filesMenuOpen}
        setFilesMenuOpen={setFilesMenuOpen}
        filesBtnRef={filesBtnRef}
        filesMenuRef={filesMenuRef}
        onOpenFile={handleOpen}
        onSaveFile={handleSave}
        onSaveAsFile={handleSaveAs}
        onCreateNewFile={handleCreateNew}
        safeNameFromPath={safeNameFromPath}
      />

      {/* Editor + footer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden", // prevents editor from painting over footer
            position: "relative",
            zIndex: 1,
            background: "#282c34",
          }}
        >
          <div className={styles.cmWrap}>
            <CodeMirror
              value={value}
              height="100%"
              theme={oneDark}
              readOnly={readOnly}
              style={{ height: "100%" }}
              extensions={[
                cpp(),
                verifyLinter,
                lintGutter(),
                clickToExplainErrors,
                errorLineHighlighter,
                autocompletion({ override: [arduinoCompletionSource] }),
              ]}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                autocompletion: true,
                foldGutter: false,
              }}
              onCreateEditor={(view) => {
                cmViewRef.current = view;
                setStatus("Ready.");
              }}
              onChange={(v) => onChange(v)}
            />
          </div>
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
            position: "relative",
            zIndex: 50,
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

        <ArduinoEditorFooter
          bottomHeight={bottomHeight}
          status={status}
          lastSaved={lastSaved}
          compilerOutput={compilerOutput}
          coachJson={coachJson}
          coachLive={coachLive}
          coachRaw={coachRaw}
          hasFooterContent={hasFooterContent}
        />
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
          <div style={{ marginTop: 8, lineHeight: 1.35 }} dangerouslySetInnerHTML={{ __html: formatAIText(p.content) }} />

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
