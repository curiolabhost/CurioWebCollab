"use client";

import * as React from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";

type ArduinoEditorProps = {
  height?: string | number;
  width?: string | number;
  apiBaseUrl?: string;
};

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

export default function ArduinoEditor({
  height = "100%",
  width = "100%",
  apiBaseUrl = "http://localhost:4000",
}: ArduinoEditorProps) {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("Ready.");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [lastErrors, setLastErrors] = React.useState<any[]>([]);
  const [compilerOutput, setCompilerOutput] = React.useState("");
  const [aiHelpMap, setAiHelpMap] = React.useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = React.useState(false);

  const [popoverVisible, setPopoverVisible] = React.useState(false);
  const [popoverContent, setPopoverContent] = React.useState("");
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });

  const [bottomHeight, setBottomHeight] = React.useState(90);
  const [isResizing, setIsResizing] = React.useState(false);

  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);

  const dragStartYRef = React.useRef(0);
  const dragStartHeightRef = React.useRef(0);

  /* ------------------------------------------------------------
     Load saved sketch
  ------------------------------------------------------------ */
  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setValue(saved ?? DEFAULT_SKETCH);
  }, []);

  /* ------------------------------------------------------------
     Editor change handler (autosave)
  ------------------------------------------------------------ */
  const onChange = (v?: string) => {
    const text = v ?? "";
    setValue(text);
    setStatus("Editing...");

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, text);
        setLastSaved(new Date());
        setStatus("Saved.");
      } catch {
        setStatus("Save failed.");
      }
    });
  };

  /* ------------------------------------------------------------
     Monaco setup
  ------------------------------------------------------------ */
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("arduino-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "#82a8ab" },
        { token: "keyword", foreground: "#a1cd75" },
        { token: "keyword.arduino", foreground: "#ce9261", fontStyle: "bold" },
        { token: "type", foreground: "#4EC9B0" },
        { token: "string", foreground: "#CE9178" },
        { token: "number", foreground: "#B5CEA8" },
        { token: "function", foreground: "#ce9261" },
      ],
      colors: {
        "editor.background": "#020617",
        "editor.lineHighlightBackground": "#020617",
        "editorLineNumber.foreground": "#6b7280",
        "editorCursor.foreground": "#ffffff",
        "editor.selectionBackground": "#264F78",
      },
    });

    monaco.languages.setMonarchTokensProvider("cpp", {
      tokenizer: {
        root: [
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                "@keywords": "keyword",
                "@default": "identifier",
              },
            },
          ],
          [/\d+/, "number"],
          [/".*?"/, "string"],
          [/\/\/.*$/, "comment"],
        ],
      },
      keywords: ARDUINO_FUNCS,
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

  const onMount: OnMount = (editor, monaco) => {
    monaco.editor.setTheme("arduino-dark");
    editorRef.current = editor;
    monacoRef.current = monaco;
    setStatus("Ready.");
  };

  /* ------------------------------------------------------------
     Toolbar actions
  ------------------------------------------------------------ */
  const handleVerify = async () => {
    setStatus("Verifying...");
    setCompilerOutput("");
    setLastErrors([]);
    setAiHelpMap({});

    try {
      const res = await fetch(`${apiBaseUrl}/verify-arduino`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("Verification passed.");
        return;
      }

      setLastErrors(data.errors || []);
      setCompilerOutput(
        (data.errors || [])
          .map((e: any) => `Line ${e.line}: ${e.message}`)
          .join("\n")
      );
      setStatus("Errors found.");
    } catch {
      setCompilerOutput("Server error.");
      setStatus("Verification failed.");
    }
  };

  const explainErrorsWithAI = async () => {
    if (!lastErrors.length) return;
    setIsExplaining(true);
    setStatus("Asking AI...");

    try {
      const res = await fetch(`${apiBaseUrl}/ai/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value, errors: lastErrors }),
      });
      const data = await res.json();
      setCompilerOutput(data.explanation ?? "No explanation.");
      setStatus("AI explanation ready.");
    } catch {
      setCompilerOutput("AI error.");
      setStatus("AI failed.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleReset = () => {
    setValue(DEFAULT_SKETCH);
    setCompilerOutput("");
    setLastErrors([]);
    window.localStorage.setItem(STORAGE_KEY, DEFAULT_SKETCH);
    setStatus("Reset.");
  };

  /* ------------------------------------------------------------
     Bottom resize handlers
  ------------------------------------------------------------ */
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = bottomHeight;

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    const delta = dragStartYRef.current - e.clientY;
    const next = Math.min(500, Math.max(40, dragStartHeightRef.current + delta));
    setBottomHeight(next);
  };

  const handleDragEnd = () => {
    setIsResizing(false);
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  };

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 8,
        overflow: "hidden",
        userSelect: isResizing ? "none" : "auto",
      }}
    >
      {/* Toolbar */}
      <div style={{ padding: "6px 10px", display: "flex", gap: 8 }}>
        <button onClick={handleVerify}>Verify</button>
        <button onClick={explainErrorsWithAI} disabled={!lastErrors.length}>
          Explain Error
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        <Editor
          value={value}
          onChange={onChange}
          beforeMount={beforeMount}
          onMount={onMount}
          language="cpp"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleDragStart}
        style={{ height: 6, cursor: "row-resize", background: "#020617" }}
      />

      {/* Output */}
      <div style={{ height: bottomHeight, padding: 8, color: "#fca5a5" }}>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{compilerOutput}</pre>
      </div>
    </div>
  );
}
