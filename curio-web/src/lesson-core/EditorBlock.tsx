"use client";

import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";


import styles from "./GuidedCodeBlock.module.css";

type Props = {
  editorId: string;
  globalKey: string;

  mergedBlanks: Record<string, any>;
  setGlobalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  rows?: number; // kept for compatibility; we map this to a height
  placeholder?: string;
};

const DEBOUNCE_MS = 200;

function editorPersistKey(globalKey: string, editorId: string) {
  return `curio:editor:v1:${globalKey || "global"}:${editorId || "editor"}`;
}

// rough height mapping (monospace-ish)
function rowsToPx(rows: number) {
  const r = Math.max(4, Number.isFinite(rows) ? rows : 8);
  return Math.round(r * 18 + 28); // lineHeight*rows + padding
}

export default function InlineEditorToken({
  editorId,
  globalKey,
  mergedBlanks,
  setGlobalBlanks,
  rows = 8,
  placeholder = "Type code here…",
}: Props) {
  const persistKey = React.useMemo(() => editorPersistKey(globalKey, editorId), [globalKey, editorId]);

  const initial = React.useMemo(() => {
    const v = mergedBlanks?.[persistKey];
    if (typeof v === "string") return v;
    if (v == null) return "";
    return String(v);
  }, [mergedBlanks, persistKey]);

  const [draft, setDraft] = React.useState<string>(initial);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  // sync on navigation/restore
  React.useEffect(() => {
    const v = mergedBlanks?.[persistKey];
    const next = typeof v === "string" ? v : v == null ? "" : String(v);
    setDraft((prev) => (prev === next ? prev : next));
  }, [mergedBlanks, persistKey]);

  const pendingRef = React.useRef<string | null>(null);
  const timerRef = React.useRef<any>(null);

  function schedulePersist(nextText: string) {
    if (!setGlobalBlanks) return;
    if (typeof window === "undefined") return;

    pendingRef.current = nextText;

    if (timerRef.current) return;
    timerRef.current = window.setTimeout(() => {
      const toWrite = pendingRef.current;
      pendingRef.current = null;

      if (timerRef.current && typeof window !== "undefined") window.clearTimeout(timerRef.current);
      timerRef.current = null;

      if (toWrite == null) return;

      setGlobalBlanks((prev) => ({
        ...(prev || {}),
        [persistKey]: toWrite,
      }));
    }, DEBOUNCE_MS);
  }

  function flushNow() {
    if (!setGlobalBlanks) return;

    if (timerRef.current && typeof window !== "undefined") {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const toWrite = pendingRef.current;
    pendingRef.current = null;

    if (toWrite == null) return;

    setGlobalBlanks((prev) => ({
      ...(prev || {}),
      [persistKey]: toWrite,
    }));
  }

  React.useEffect(() => {
    return () => flushNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heightPx = rowsToPx(rows);

  return (
    <div className={styles.inlineEditorWrap}>
      <CodeMirror
        value={draft}
        height={`${heightPx}px`}
        extensions={[cpp()]} // Arduino ≈ C/C++
        theme="dark"
        placeholder={placeholder}
        onChange={(val) => {
          setDraft(val);
          schedulePersist(val);
        }}
        onBlur={() => flushNow()}
        className={styles.inlineCodeMirror}
            basicSetup={{
            lineNumbers: false,
            highlightActiveLine: false,
            foldGutter: false,
            indentOnInput: true,
            bracketMatching: true,
            }}

      />
    </div>
  );
}
