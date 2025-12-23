// app/projects/electric-status-board/components/ArduinoEditor.jsx
import React from "react";
import Editor from "@monaco-editor/react";

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

export default function ArduinoEditor({ height = "100%", width = "100%", apiBaseUrl = "http://localhost:4000" }) {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("Ready.");
  const [lastSaved, setLastSaved] = React.useState(null);

  const [aiHelp, setAiHelp] = React.useState("");
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [lastErrors, setLastErrors] = React.useState([]);
  const [compilerOutput, setCompilerOutput] = React.useState("");

  const [bottomHeight, setBottomHeight] = React.useState(90); // default height in px
  const [isResizing, setIsResizing] = React.useState(false);
  const dragStartYRef = React.useRef(0);
  const dragStartHeightRef = React.useRef(0);

  const editorRef = React.useRef(null);
  const monacoRef = React.useRef(null);
  const rafRef = React.useRef(null);

  // Load once from localStorage so it persists across pages (code/circuit/learn)
  React.useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    setValue(saved ?? DEFAULT_SKETCH);
  }, []);

  // Debounced save to localStorage
  const onChange = (v) => {
    const text = v ?? "";
    setValue(text);
    setStatus("Editing...");

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, text);
        }
        setLastSaved(new Date());
        setStatus("Saved.");
      } catch (e) {
        console.error(e);
        setStatus("Save failed (storage).");
      }
    });
  };

  // Theme + Arduino-flavored completions and tokens
  const beforeMount = (monaco) => {
    monaco.editor.defineTheme("arduino-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment",          foreground: "#82a8abff" },
        { token: "keyword.control",  foreground: "#a1cd75ff" },
        { token: "keyword",          foreground: "#a1cd75ff" },
        { token: "keyword.arduino",  foreground: "#ce9261ff", fontStyle: "bold" },
        { token: "type",             foreground: "#4EC9B0" },
        { token: "number",           foreground: "#B5CEA8" },
        { token: "string",           foreground: "#CE9178" },
        { token: "string.escape",    foreground: "#D7BA7D" },
        { token: "constant",         foreground: "#DCDCAA" },
        { token: "preprocessor",     foreground: "#9CDCFE" },
        { token: "function",         foreground: "#ce9261ff" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editorLineNumber.foreground": "#6b7280",
        "editorCursor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#111827",
        "editor.selectionBackground": "#264F78",
        "editorIndentGuides": "#1f2933",
      },
    });

    // Arduino-ish tokenization layered on top of C++
    monaco.languages.setMonarchTokensProvider("cpp", {
      keywords: [
        "for", "while", "do", "switch", "case", "break", "continue",
        "if", "else", "return"
      ],

      arduinoKeywords: [
        "setup", "loop",
        "pinMode", "digitalWrite", "digitalRead",
        "analogWrite", "analogRead",
        "delay", "millis", "micros",
        "Serial", "Serial.begin", "Serial.print", "Serial.println",
      ],

      arduinoConstants: [
        "HIGH", "LOW",
        "INPUT", "OUTPUT", "INPUT_PULLUP",
      ],

      typeKeywords: [
        "void", "int", "long", "float", "double",
        "char", "bool", "boolean",
        "unsigned", "short", "byte", "word",
        "String", "static", "const",
      ],

      tokenizer: {
        root: [
          // Preprocessor directives
          [/^\s*#\s*\w+/, "preprocessor"],

          // Function calls (Arduino style)
          [/\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|millis|micros)\b(?=\s*\()/, "function"],

          // Identifiers + dotted identifiers
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

          // Numbers
          [/0b[01]+/, "number"],
          [/0x[\da-fA-F]+/, "number"],
          [/\d+(\.\d+)?([eE][\-+]?\d+)?/, "number"],

          // Strings
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
  };


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

  const onMount = (editor, monaco) => {
    monaco.editor.setTheme("arduino-dark");
    editorRef.current = editor;
    monacoRef.current = monaco;
    setStatus("Ready.");
  };

  // REAL Verify: call backend /verify-arduino (arduino-cli)

  // Non-actionable errors in this environment (ex: missing Arduino libraries on the server)
  const isNonActionableLibraryMissing = (text) => {
    const s = (text || "").toLowerCase();
    // Common patterns from gcc/arduino-cli when headers/libraries aren't installed
    return (
      (s.includes("no such file or directory") && s.includes(".h")) ||
      (s.includes("fatal error:") && s.includes(".h")) ||
      (s.includes("library") && s.includes("not found")) ||
      (s.includes("missing") && s.includes("library"))
    );
  };

  const LIBRARY_NOTICE =
    "This environment may not simulate installing Arduino libraries. If your only error is a missing .h library, you can ignore it for now.";

  const handleVerify = async () => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    const code = value;

    setStatus("Verifying sketch (arduino-cli)...");
    setAiHelp("");
    setLastErrors([]);
    setCompilerOutput("");
    monaco.editor.setModelMarkers(model, "verify", []);

    try {
      const res = await fetch(`${apiBaseUrl}/verify-arduino`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      const notices = Array.isArray(data.notices) ? data.notices : [];

      if (data.ok) {
        setStatus("Done verifying.");
        setLastErrors([]);

        if (notices.length) setCompilerOutput(notices.join("\n\n"));
        else setCompilerOutput("");
        return;
      }

      const errors = data.errors || [];
      setLastErrors(errors);      // Build Arduino-style console text for footer
      let outputText = "";

      // 1) Prefer backend notice(s) if provided
      if (notices.length) {
        outputText = notices.join("\n\n");
      }

      // 2) Otherwise, use stderr / structured errors
      if (!outputText) {
        if (data.rawStderr && data.rawStderr.trim()) {
          outputText = data.rawStderr.trim();
        } else if (errors.length) {
          outputText = errors
            .map(
              (err) =>
                `Sketch.ino:${err.line}:${err.column || 1}: error: ${err.message}`
            )
            .join("");
        }
      }

      // 3) Frontend safety: if output is just missing-library noise, show a friendly message
      if (!notices.length && isNonActionableLibraryMissing(outputText)) {
        outputText = LIBRARY_NOTICE;
      }

      setCompilerOutput(outputText);

      // If the only "error" is a missing library/header in this environment, do not scare the student with markers.
      if (isNonActionableLibraryMissing(data.rawStderr || "") && errors.length === 0) {
        monaco.editor.setModelMarkers(model, "verify", []);
        setLastErrors([]);
        setStatus("Done Verifying.");
        return;
      }

      const markers = errors.map((err) => ({
        startLineNumber: err.line,
        startColumn: err.column || 1,
        endLineNumber: err.line,
        endColumn: (err.column || 1) + 1,
        message: err.message,
        severity: monaco.MarkerSeverity.Error,
      }));

      monaco.editor.setModelMarkers(model, "verify", markers);
      setStatus(`Found ${errors.length} error(s).`);
    } catch (err) {
      console.error("Verify fetch error:", err);
      setStatus("Verification failed (server error).");
      setAiHelp("Something went wrong when checking your code.");
      setCompilerOutput("Verification failed due to a server error.");
    }
  };

  // AI Explain: full code + compiler errors
  const explainErrorsWithAI = async () => {
    if (!lastErrors || lastErrors.length === 0) {
      setAiHelp("No errors to explain. Run Verify first.");
      return;
    }

    setIsExplaining(true);
    setStatus("Asking AI to explain the errors with full context...");

    try {
      const code = value;

      const res = await fetch(`${apiBaseUrl}/ai/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "arduino-verify",
          code,
          errors: lastErrors,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setAiHelp(data.explanation);
        setStatus("AI explanation ready (see footer).");
      } else {
        setAiHelp("I couldn't generate a detailed explanation this time.");
        setStatus("AI explanation failed.");
      }
    } catch (err) {
      console.error("AI explain error:", err);
      setAiHelp("Something went wrong while asking the AI helper.");
      setStatus("AI request failed.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleUpload = () => {
    setStatus("Uploading (simulated)...");
    setTimeout(() => setStatus("Upload complete (simulated)."), 600);
  };

  const handleReset = () => {
    setValue(DEFAULT_SKETCH);
    setAiHelp("");
    setLastErrors([]);
    setCompilerOutput("");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, DEFAULT_SKETCH);
      }
    } catch (e) {
      console.error(e);
    }
    setStatus("Sketch reset to default.");
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelMarkers(
        editorRef.current.getModel(),
        "verify",
        []
      );
    }
  };

  // 🔹 Drag-to-resize handlers (between editor and footer)
  function handleDragStart(e) {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = bottomHeight;

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  }

  function handleDragMove(e) {
    const deltaY = dragStartYRef.current - e.clientY; // drag up -> increase height
    let newHeight = dragStartHeightRef.current + deltaY;

    const MIN = 40;  // minimal footer height
    const MAX = 500; // max footer height
    if (newHeight < MIN) newHeight = MIN;
    if (newHeight > MAX) newHeight = MAX;

    setBottomHeight(newHeight);
  }

  function handleDragEnd() {
    setIsResizing(false);
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }

  const hasFooterContent = !!compilerOutput || !!aiHelp;

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
        userSelect: isResizing ? "none" : "auto",
      }}
    >
      {/* Arduino-style top bar */}
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "999px",
              background: "#10b981",
            }}
          />
          <span>ElectricBoard.ino</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={handleVerify} style={toolbarButtonStyle}>
            Verify
          </button>
          <button
            type="button"
            onClick={explainErrorsWithAI}
            style={{
              ...toolbarButtonStyle,
              opacity: lastErrors.length === 0 ? 0.5 : 1,
              cursor: lastErrors.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={lastErrors.length === 0 || isExplaining}
          >
            {isExplaining ? "Explaining..." : "Explain Error"}
          </button>
          <button type="button" onClick={handleUpload} style={toolbarButtonStyle}>
            Upload
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{ ...toolbarButtonStyle, opacity: 0.8 }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main middle area: editor + resizable footer */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Editor */}
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

        {/* Drag handle between editor and footer */}
        <div
          onMouseDown={handleDragStart}
          style={{
            height: 6,
            cursor: "row-resize",
            background: "#020617",
            borderTop: "1px solid #1f2937",
            borderBottom: "1px solid #1f2937",
            display: "block",
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

        {/* Resizable footer: status + scrollable compiler + AI */}
        <div
          style={{
            height: bottomHeight,
            minHeight: 40,
            maxHeight: "60vh",
            borderTop: "1px solid #1f2937",
            background: "#020617",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 11,
            color: "#9ca3af",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top row: status + board info */}
          <div
            style={{
              padding: "2px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span>{status}</span>
            <span>
              Board: Arduino Uno • Port: Not connected
              {lastSaved && (
                <span style={{ marginLeft: 12 }}>
                  | Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </span>
          </div>

          {/* Scrollable content: compiler output + AI helper */}
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

            {aiHelp && (
              <div
                style={{
                  marginTop: compilerOutput ? 8 : 0,
                  borderTop: compilerOutput ? "1px solid #374151" : "none",
                  paddingTop: compilerOutput ? 6 : 0,
                  fontSize: 12,
                  color: "#d1d5db",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  AI Helper Explanation
                </div>
                {aiHelp}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

const toolbarButtonStyle = {
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
};
