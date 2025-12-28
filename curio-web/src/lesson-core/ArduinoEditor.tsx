"use client";

import * as React from "react";
import Editor, { BeforeMount, OnMount } from "@monaco-editor/react";

type Props = {
  height?: string | number;
  width?: string | number;
  apiBaseUrl?: string;
  screenTitle?: string;
};

const STORAGE_KEY = "esb:arduino:sketch";

/* Default contents + gray header comment */
const DEFAULT_SKETCH = `/* Electric Board Code Editor */
void setup() {
  // put your setup code here, to run once:
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

export default function ArduinoEditor({
  height = "100%",
  width = "100%",
  apiBaseUrl = "http://localhost:4000",
  screenTitle = "Arduino",
}: Props) {
  const hasWindow = typeof window !== "undefined";
  const storage = React.useMemo(
    () => (hasWindow ? window.localStorage : null),
    [hasWindow]
  );

  const [value, setValue] = React.useState<string>(DEFAULT_SKETCH);
  const [status, setStatus] = React.useState<string>("Ready.");
  const [lastSaved, setLastSaved] = React.useState<number | null>(null);

  const [isCompiling, setIsCompiling] = React.useState(false);
  const [compilerOutput, setCompilerOutput] = React.useState<string>("");
  const [lastErrors, setLastErrors] = React.useState<string[]>([]);

  const [aiHelp, setAiHelp] = React.useState<string>("");
  const [isExplaining, setIsExplaining] = React.useState(false);

  const [showOutput, setShowOutput] = React.useState(true);

  // These refs help keep layout/scroll stable and allow future marker support if needed
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);

  // Load initial from localStorage once
  React.useEffect(() => {
    if (!storage) return;
    const saved = storage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) setValue(saved);
  }, [storage]);

  // Autosave (debounced)
  React.useEffect(() => {
    if (!storage) return;
    const t = window.setTimeout(() => {
      try {
        storage.setItem(STORAGE_KEY, value);
        setLastSaved(Date.now());
      } catch {
        // ignore
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [value, storage]);

  const clearOutput = () => {
    setCompilerOutput("");
    setLastErrors([]);
    setStatus("Ready.");
    setAiHelp("");
  };

  const resetToDefault = () => {
    if (hasWindow) {
      const ok = window.confirm("Reset editor to the default sketch?");
      if (!ok) return;
    }
    setValue(DEFAULT_SKETCH);
    setStatus("Reset to default.");
    setCompilerOutput("");
    setLastErrors([]);
    setAiHelp("");
  };

  const parseErrors = (raw: string): string[] => {
    const lines = (raw || "").split("\n").map((l) => l.trimEnd());
    // Arduino CLI errors often contain "error:" or "fatal error:"
    return lines.filter((l) => /\berror:|\bfatal error:/i.test(l));
  };

  const compile = async () => {
    if (!apiBaseUrl) return;

    setIsCompiling(true);
    setStatus("Compiling...");
    setAiHelp("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/arduino/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });

      const text = await res.text();
      setCompilerOutput(text);

      const errors = parseErrors(text);
      setLastErrors(errors);

      if (res.ok && errors.length === 0) {
        setStatus("✅ Verified. No compile errors.");
      } else {
        setStatus(
          `❌ Compile failed (${errors.length} error${errors.length === 1 ? "" : "s"}).`
        );
      }
    } catch (e: any) {
      const msg = String(e?.message || e || "Unknown error");
      setCompilerOutput(msg);
      setLastErrors([msg]);
      setStatus("❌ Compile request failed.");
    } finally {
      setIsCompiling(false);
      setShowOutput(true);
    }
  };

  const explainErrors = async () => {
    if (!apiBaseUrl) return;
    if (!compilerOutput.trim()) return;

    setIsExplaining(true);
    setAiHelp("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/arduino/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: value,
          compilerOutput,
        }),
      });

      if (!res.ok) throw new Error("Explain request failed");
      const data = await res.json();
      setAiHelp(String(data?.explanation || ""));
      setStatus("AI explanation ready.");
    } catch (e: any) {
      setAiHelp("I couldn't generate an explanation right now. Try compiling again.");
      setStatus("Explain failed.");
    } finally {
      setIsExplaining(false);
      setShowOutput(true);
    }
  };

  const saveNow = () => {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, value);
      setLastSaved(Date.now());
      setStatus("Saved.");
    } catch {
      setStatus("Save failed.");
    }
  };

  const prettyTime = (ts: number | null) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // ✅ Make Monaco background match your desired #020617 without changing wrapper CSS
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("curio-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#020617",
        "editorGutter.background": "#020617",
        "editorLineNumber.foreground": "#64748b",
        "editorCursor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#0b1220",
        "editor.selectionBackground": "#1e3a8a55",
      },
    });
  };

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    try {
      monaco.editor.setTheme("curio-dark");
    } catch {
      // ignore
    }
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
        overflow: "hidden",
        border: "1px solid #1f2937",
        background: "#020617",

        // IMPORTANT: ensure this component never becomes the page scroll container
        // The lesson page should control its own scroll; the editor + output handle theirs.
        minHeight: 0,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "#020617",
          borderBottom: "1px solid #1f2937",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 12,
          color: "#e5e7eb",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: isCompiling ? "#f59e0b" : "#10b981",
              }}
            />
            <span>{screenTitle}</span>
          </div>

          <span style={{ color: "#94a3b8", fontSize: 11 }}>
            {lastSaved ? `Saved ${prettyTime(lastSaved)}` : "Not saved yet"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={compile}
            style={toolbarButtonStyle}
            disabled={isCompiling}
          >
            {isCompiling ? "Verifying…" : "Verify"}
          </button>

          <button
            type="button"
            onClick={explainErrors}
            style={toolbarButtonStyle}
            disabled={isExplaining}
          >
            {isExplaining ? "Explaining…" : "AI Explain"}
          </button>

          <button type="button" onClick={saveNow} style={toolbarButtonStyle}>
            Save
          </button>

          <button type="button" onClick={resetToDefault} style={toolbarButtonStyle}>
            Reset
          </button>

          <button
            type="button"
            onClick={() => setShowOutput((v) => !v)}
            style={toolbarButtonStyle}
          >
            {showOutput ? "Hide Output" : "Show Output"}
          </button>
        </div>
      </div>

      {/* Editor + Output region (fixed column; internal scrolling only) */}
      <div
        style={{
          flex: 1,
          minHeight: 0, // CRITICAL for separate scrolling in flex layouts
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Editor (Monaco handles its own scroll) */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            width="100%"
            language="cpp"
            theme="curio-dark"
            value={value}
            onChange={(v) => setValue(v ?? "")}
            beforeMount={beforeMount}
            onMount={onMount}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,

              // Helps ensure Monaco scroll stays inside editor region
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
              },
            }}
          />
        </div>

        {/* Output panel (its own scroll; never forces editor to scroll) */}
        {showOutput ? (
          <div
            style={{
              borderTop: "1px solid #1f2937",
              background: "#0b1220",
              color: "#e5e7eb",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12,
              flexShrink: 0, // keep it pinned; do not let it shrink weirdly
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700 }}>Output</span>
                <span style={{ color: "#94a3b8" }}>{status}</span>
              </div>

              <button type="button" onClick={clearOutput} style={toolbarButtonStyle}>
                Clear
              </button>
            </div>

            <div style={{ padding: "10px 10px", maxHeight: 220, overflow: "auto" }}>
              {lastErrors.length ? (
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      color: "#fca5a5",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Errors ({lastErrors.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#fecaca" }}>
                    {lastErrors.slice(0, 10).map((e, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {compilerOutput.trim() ? (
                <>
                  <div
                    style={{
                      color: "#cbd5e1",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Compiler output
                  </div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {compilerOutput}
                  </pre>
                </>
              ) : (
                <div style={{ color: "#94a3b8" }}>
                  Run Verify to see compiler output here.
                </div>
              )}

              {aiHelp.trim() ? (
                <>
                  <div style={{ borderTop: "1px solid #1f2937", margin: "12px 0" }} />
                  <div
                    style={{
                      color: "#cbd5e1",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    AI explanation
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", color: "#e5e7eb" }}>{aiHelp}</div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const toolbarButtonStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  lineHeight: "16px",
};
