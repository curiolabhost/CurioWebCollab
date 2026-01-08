// app/projects/electric-status-board/components/ArduinoEditor.jsx
import React from "react";
import Editor from "@monaco-editor/react";

const STORAGE_KEY = "esb:arduino:sketch";

const DEFAULT_SKETCH = `/* Electric Board Code Editor */
void setup() {
  // put your setup code here, to run once:
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

const ARDUINO_FUNCS = [
  "pinMode", "digitalWrite", "digitalRead",
  "analogWrite", "analogRead",
  "delay", "millis", "micros",
  "Serial.begin", "Serial.print", "Serial.println",
  "setup", "loop"
];

export default function ArduinoEditor({ height = "100%", width = "100%", apiBaseUrl = "http://localhost:4000" }) {
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("Ready.");
  const [lastSaved, setLastSaved] = React.useState(null);
  const [lastErrors, setLastErrors] = React.useState([]);
  const [compilerOutput, setCompilerOutput] = React.useState("");
  const [aiHelpMap, setAiHelpMap] = React.useState({});
  const [popoverContent, setPopoverContent] = React.useState("");
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });
  const [popoverVisible, setPopoverVisible] = React.useState(false);

  const [bottomHeight, setBottomHeight] = React.useState(90);
  const [isResizing, setIsResizing] = React.useState(false);
  const dragStartYRef = React.useRef(0);
  const dragStartHeightRef = React.useRef(0);

  const editorRef = React.useRef(null);
  const monacoRef = React.useRef(null);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    setValue(saved ?? DEFAULT_SKETCH);
  }, []);

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

  function getCodeContext(code, lineNumber, radius = 3) {
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

  const beforeMount = (monaco) => {
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

  //Send the line-by-line errors to the AI
  const sendErrorToAI = async (fullCode, errorMessage, lineNumber) => {
    if (!fullCode) {
      setPopoverContent("Cannot explain: code is empty.");
      return;
    }

    setPopoverContent("Loading explanation...");
    setStatus("Requesting AI explanation...");

    try {
      const res = await fetch(`${apiBaseUrl}/ai/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "arduino-verify",
          code: fullCode,
          errors: [{ line: lineNumber, message: errorMessage }], // only the clicked error
          sentences: 3,
          verbosity: "brief",
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const popoverRef = { current: "" };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop(); // keep incomplete

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
  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme("arduino-dark");

    // Click handler for error lines
    editor.onMouseDown((e) => {
      if (!e.target.position) return;

      const POPOVER_OFFSET = 12;
      const line = e.target.position.lineNumber;
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ resource: model.uri, owner: "verify" });
      const marker = markers.find(m => line >= m.startLineNumber && line <= m.endLineNumber);

      if (!marker) {
        setPopoverVisible(false);
        return;
      }

      const editorDom = editor.getDomNode();
      if (!editorDom) return;

      const editorRect = editorDom.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      // Calculate vertical position relative to editor + scrolling
      let top = e.event.posy - editorRect.top + editorDom.scrollTop;
      // Calculate horizontal position to the right of the editor
      let left = editorRect.width + POPOVER_OFFSET;

      // Clamp left so the popover never goes off-screen
      const POPUP_WIDTH = 300; // your popover maxWidth
      const maxLeft = window.innerWidth - POPUP_WIDTH - 10; // 10px margin
      if (left + editorRect.left + scrollX > maxLeft) {
        left = maxLeft - editorRect.left - scrollX;
      }

      setPopoverPosition({ top, left });
      setPopoverContent(marker.message || "Loading explanation...");
      setPopoverVisible(true);

      // Send snippet to AI
      const snippet = getCodeContext(editor.getValue(), marker.startLineNumber, 4);
      sendErrorToAI(snippet, marker.message, marker.startLineNumber);
    });
  };

  // Resizable bottom bar handlers
  function handleDragStart(e) {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = bottomHeight;
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  }

  function handleDragMove(e) {
    const deltaY = dragStartYRef.current - e.clientY;
    let newHeight = dragStartHeightRef.current + deltaY;
    const MIN = 40, MAX = 500;
    if (newHeight < MIN) newHeight = MIN;
    if (newHeight > MAX) newHeight = MAX;
    setBottomHeight(newHeight);
  }

  function handleDragEnd() {
    setIsResizing(false);
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }

  const hasFooterContent = !!compilerOutput;

  // ==== Toolbar functions ====
  const handleVerify = async () => {
    if (!editorRef.current || !monacoRef.current) return;
    setStatus("Verifying sketch...");
    setCompilerOutput("");
    setLastErrors([]);
    setAiHelpMap({});
    // server call
    try {
      const res = await fetch(`${apiBaseUrl}/verify-arduino`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Done verifying.");
        if (data.notices?.length) setCompilerOutput(data.notices.join("\n\n"));
        return;
      }
      const errors = data.errors || [];
      setLastErrors(errors);

      const markers = monacoRef.current.editor.setModelMarkers(
        editorRef.current.getModel(),
        "verify",
        errors.map(err => ({
          startLineNumber: err.line,
          startColumn: err.column || 1,
          endLineNumber: err.line,
          endColumn: (err.column || 1) + 1,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error,
          aiKey: `${err.line}:${err.column || 1}`,
        }))
      );

      //Error Highlighting
      monacoRef.current.editor.setModelMarkers(
        editorRef.current.getModel(),
        "verify",
        errors.map(err => ({
          startLineNumber: err.line,
          startColumn: err.column || 1,
          endLineNumber: err.line,
          endColumn: (err.column || 1) + 1,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error,
          aiKey: `${err.line}:${err.column || 1}`,
          tags: [monacoRef.current.MarkerTag.Unnecessary], 
        }))
      )
      editorRef.current.deltaDecorations([], errors.map(err => ({
        range: new monacoRef.current.Range(err.line, 1, err.line, 1000),
        options: { 
          isWholeLine: true, 
          className: 'errorLineHighlight', 
          glyphMarginClassName: 'errorGlyph'
        }
      })));

      let outputText = errors.map(err => `Sketch.ino:${err.line}:${err.column || 1}: error: ${err.message}`).join("\n");
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
    setCompilerOutput(""); // clear previous output
    setIsExplaining(true);

    try {
      console.log("🧠 explainErrorsWithAI called", {
        apiBaseUrl,
        lastErrors,
      })
      const res = await fetch(`${apiBaseUrl}/ai/help`, {
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

      if (!res.ok || !res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split SSE frames
        const events = buffer.split("\n\n");
        buffer = events.pop(); // keep incomplete frame

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventType = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
          }

          if (eventType === "token") {
            const { token } = JSON.parse(data);
            setCompilerOutput(prev => prev + token);
          }

          if (eventType === "done") {
            setStatus("AI explanation complete.");
          }

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

  const handleUpload = () => {
    setStatus("Uploading (simulated)...");
    setTimeout(() => setStatus("Upload complete (simulated)."), 600);
  };

  const handleReset = () => {
    setValue(DEFAULT_SKETCH);
    setCompilerOutput("");
    setAiHelpMap({});
    setLastErrors([]);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, DEFAULT_SKETCH);
    } catch (e) { console.error(e); }
    setStatus("Sketch reset to default.");
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), "verify", []);
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
        overflow: "visible",
        border: "1px solid #1f2937",
        background: "#020617",
        position: "relative",
        userSelect: isResizing ? "none" : "auto",
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
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 12,
          color: "#e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "999px", background: "#10b981" }} />
          <span>ElectricBoard.ino</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={handleVerify} style={toolbarButtonStyle}>Verify</button>
          <button
            type="button"
            onClick={explainErrorsWithAI}
            style={{
              ...toolbarButtonStyle,
              opacity: lastErrors.length === 0 ? 0.5 : 1,
              cursor: lastErrors.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={lastErrors.length === 0}
          >
            Explain Error
          </button>
          <button type="button" onClick={handleUpload} style={toolbarButtonStyle}>Upload</button>
          <button type="button" onClick={handleReset} style={{ ...toolbarButtonStyle, opacity: 0.8 }}>Reset</button>
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
              fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
        <div onMouseDown={handleDragStart} style={{ height: 6, cursor: "row-resize", background: "#020617", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937" }}>
          <div style={{ width: 40, height: 2, margin: "2px auto", borderRadius: 999, background: "#4b5563" }} />
        </div>

        {/* Bottom bar */}
        <div style={{ height: bottomHeight, minHeight: 40, maxHeight: "60vh", borderTop: "1px solid #1f2937", background: "#020617", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 11, color: "#9ca3af", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "2px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span>{status}</span>
            <span>
              Board: Arduino Uno • Port: Not connected
              {lastSaved && <span style={{ marginLeft: 12 }}>| Last saved: {lastSaved.toLocaleTimeString()}</span>}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: hasFooterContent ? "auto" : "hidden", padding: hasFooterContent ? "4px 10px 6px" : "0 10px 4px" }}>
            {compilerOutput && (
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 11, color: "#fca5a5", lineHeight: 1.3 }}>
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
          onClick={() => setPopoverVisible(false)} // close on click
        >
          {popoverContent}
        </div>
      )}
    </div>
  );
}

const toolbarButtonStyle = {
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 4,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
};
