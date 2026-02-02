"use client";

import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

type Segment =
  | { kind: "text"; text: string }
  | { kind: "edit"; id: string; text: string };

const EDIT_BLOCK_RE =
  /\/\/\s*##EDIT:([A-Z0-9_]+)##([\s\S]*?)\/\/\s*##END:\1##/g;

function splitEditBlocks(code: string): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = EDIT_BLOCK_RE.exec(code))) {
    const start = match.index;
    const end = EDIT_BLOCK_RE.lastIndex;

    if (start > lastIndex) {
      out.push({ kind: "text", text: code.slice(lastIndex, start) });
    }

    out.push({ kind: "edit", id: match[1], text: match[2] });

    lastIndex = end;
  }

  if (lastIndex < code.length) {
    out.push({ kind: "text", text: code.slice(lastIndex) });
  }

  return out;
}

function editPersistKey(globalKey: string, id: string) {
  return `curio:edit:v1:${globalKey || "global"}:${id}`;
}

type Props = {
  title: string;
  code: string; // full code text (with blanks already injected, if you do that)

  // persistence plumbing from your lesson system
  globalKey: string;
  mergedBlanks: Record<string, any>;
  setGlobalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  // styling hooks: pass your classes from GuidedCodeBlock.module.css
  styles: {
    codeCard: string;
    codeCardHeader: string;
    codeCardTitle: string;
    codeCardHeaderActions: string;
    copyBtn: string;
    btnIcon?: string;
    copyBtnText?: string;
    codeBox?: string;
    codePre?: string;
  };

  // optional
  onCopyToEditor?: (text: string) => void;
};

export default function EditableRegionCodeBlock({
  title,
  code,
  globalKey,
  mergedBlanks,
  setGlobalBlanks,
  styles,
  onCopyToEditor,
}: Props) {
  const segments = React.useMemo(() => splitEditBlocks(code), [code]);
  const hasEditable = React.useMemo(
    () => segments.some((s) => s.kind === "edit"),
    [segments]
  );

  // pick mode: show highlights + let user click a region
  const [pickMode, setPickMode] = React.useState(false);

  // which region are we editing right now?
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // draft code in the editor
  const [draft, setDraft] = React.useState("");

  // helper: saved code for any region id
  function getSaved(id: string): string {
    const key = editPersistKey(globalKey, id);
    const v = mergedBlanks?.[key];
    if (typeof v === "string") return v;
    if (v == null) return "";
    return String(v);
  }

function openEditor(id: string) {
  const key = editPersistKey(globalKey, id);
  const saved = mergedBlanks?.[key];

  setActiveEditId(id);
  if (typeof saved === "string" && saved.trim().length > 0) {
    setEditDraft(saved);
  } else {
    setEditDraft("");
  }
}

  function save() {
    if (!activeId || !setGlobalBlanks) return;

    const key = editPersistKey(globalKey, activeId);
    const next = String(draft || "");

    setGlobalBlanks((prev) => ({
      ...(prev || {}),
      [key]: next,
    }));

    // keep editor open or close it — I recommend close after save for V1
    setActiveId(null);
  }

  function revert(id: string) {
    if (!setGlobalBlanks) return;
    const key = editPersistKey(globalKey, id);

    setGlobalBlanks((prev) => {
      const next = { ...(prev || {}) };
      delete next[key];
      return next;
    });

    if (activeId === id) setActiveId(null);
  }

  async function copyAllVisible() {
    // copy what user currently sees (scaffold regions replaced by saved)
    let visible = "";
    for (const seg of segments) {
      if (seg.kind === "text") visible += seg.text;
      else {
        const saved = getSaved(seg.id);
        visible += saved.trim().length ? saved : seg.text;
      }
    }

    if (onCopyToEditor) return onCopyToEditor(visible);
    await navigator.clipboard.writeText(visible);
  }

  return (
    <div className={styles.codeCard}>
      <div className={styles.codeCardHeader}>
        <div className={styles.codeCardTitle}>{title}</div>

        <div className={styles.codeCardHeaderActions}>
          {hasEditable && activeId == null && (
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => setPickMode((v) => !v)}
              title="Rewrite a component from scratch"
            >
              <span className={styles.btnIcon}>✎</span>
              <span className={styles.copyBtnText}>Edit</span>
            </button>
          )}

          <button
            type="button"
            className={styles.copyBtn}
            onClick={copyAllVisible}
          >
            <span className={styles.btnIcon}>⧉</span>
            <span className={styles.copyBtnText}>Copy to Editor</span>
          </button>
        </div>
      </div>

      {/* code view */}
      <div className={styles.codeBox}>
        {pickMode && (
          <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.9 }}>
            Click a highlighted code section to rewrite it.
          </div>
        )}

        <pre className={styles.codePre}>
          <code>
            {segments.map((seg, idx) => {
              if (seg.kind === "text") {
                return <span key={idx}>{seg.text}</span>;
              }

              const saved = getSaved(seg.id);
              const hasCustom = saved.trim().length > 0;

              // if saved exists, show saved code INSTEAD of scaffold region
              const renderedText = hasCustom ? saved : seg.text;

              // clickable highlight ONLY when in pickMode and no saved version yet
              const clickable = pickMode && !hasCustom;

              return (
                <span
                  key={idx}
                  onClick={() => clickable && openEditor(seg.id, seg.text)}
                  title={
                    clickable
                      ? `Click to rewrite: ${seg.id}`
                      : hasCustom
                      ? `Custom version saved for: ${seg.id}`
                      : undefined
                  }
                  style={
                    clickable
                      ? {
                          background: "rgba(59,130,246,0.18)",
                          outline: "2px solid rgba(59,130,246,0.6)",
                          borderRadius: 6,
                          cursor: "pointer",
                        }
                      : hasCustom
                      ? {
                          background: "rgba(34,197,94,0.10)",
                          borderRadius: 6,
                        }
                      : undefined
                  }
                >
                  {renderedText}

                  {/* small inline revert option if custom */}
                  {hasCustom && (
                    <span style={{ marginLeft: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          revert(seg.id);
                        }}
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        title="Revert to scaffold"
                      >
                        Revert
                      </button>
                    </span>
                  )}
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {/* inline editor below */}
      {activeId && (
        <div style={{ marginTop: 12 }}>
          <div
            className={styles.codeCardHeader}
            style={{ borderRadius: 10, marginBottom: 8 }}
          >
            <div className={styles.codeCardTitle} style={{ fontSize: 14 }}>
              Rewrite: {activeId}
            </div>

            <div className={styles.codeCardHeaderActions}>
              <button type="button" className={styles.copyBtn} onClick={save}>
                <span className={styles.btnIcon}>💾</span>
                <span className={styles.copyBtnText}>Save</span>
              </button>

              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => setActiveId(null)}
                title="Close without saving"
              >
                <span className={styles.btnIcon}>✕</span>
                <span className={styles.copyBtnText}>Close</span>
              </button>
            </div>
          </div>

          <CodeMirror
            value={draft}
            extensions={[cpp()]}
            theme={oneDark}
            onChange={(v) => setDraft(v)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              bracketMatching: true,
              indentOnInput: true,
            }}
          />
        </div>
      )}
    </div>
  );
}
