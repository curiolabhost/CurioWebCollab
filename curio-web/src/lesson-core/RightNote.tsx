"use client";

import * as React from "react";

export type RightNoteProps = {
  /**
   * REQUIRED so each lesson/page has its own notes.
   * Example: `${trackPrefix}` (e.g., "curio:status-board:code-beg:coding")
   */
  scopeKey: string;

  className?: string;
  defaultNotesTitle?: string; // default "My Notes"
};

function safeGetLocalStorage(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeSetLocalStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export default function RightNote({
  scopeKey,
  className,
  defaultNotesTitle = "My Notes",
}: RightNoteProps) {
  // Scoped keys so notes are NOT shared between lessons/pages
  const notesStorageKey = React.useMemo(() => `curio:notes:${scopeKey}`, [scopeKey]);
  const titleStorageKey = React.useMemo(() => `curio:notes:title:${scopeKey}`, [scopeKey]);

  // Title (editable + persisted)
  const [title, setTitle] = React.useState(defaultNotesTitle);

  // Notes body (caret-safe uncontrolled contentEditable)
  const notesRef = React.useRef<HTMLDivElement | null>(null);
  const saveTimer = React.useRef<number | null>(null);
  const [hasNotes, setHasNotes] = React.useState(false);

  // Load persisted title + notes whenever scope changes
  React.useEffect(() => {
    const savedTitle = safeGetLocalStorage(titleStorageKey);
    setTitle(savedTitle || defaultNotesTitle);

    const savedNotes = safeGetLocalStorage(notesStorageKey);
    if (notesRef.current) notesRef.current.textContent = savedNotes || "";
    setHasNotes(!!savedNotes?.trim());
  }, [titleStorageKey, notesStorageKey, defaultNotesTitle]);

  // Persist title
  React.useEffect(() => {
    safeSetLocalStorage(titleStorageKey, title);
  }, [title, titleStorageKey]);

  // Debounced persist notes
  const scheduleSaveNotes = React.useCallback(
    (value: string) => {
      if (typeof window === "undefined") return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);

      saveTimer.current = window.setTimeout(() => {
        safeSetLocalStorage(notesStorageKey, value);
      }, 150);
    },
    [notesStorageKey]
  );

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  return (
    <aside
      className={[
        "shrink-0",
        "bg-white border-l border-gray-200",
        "flex flex-col",
        "min-w-0 h-full",
        className || "",
      ].join(" ")}
    >
      {/* Header: ALWAYS visible, NO button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="text-sm font-semibold text-indigo-900">
          <span
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setTitle(e.currentTarget.textContent || "")}
            className="outline-none border-b border-transparent focus:border-gray-400"
          >
            {title}
          </span>
        </div>
      </div>

      {/* Notes body: ALWAYS editable */}
      <div className="p-4 min-h-0 overflow-y-auto">
        <div className="relative">
          {!hasNotes && (
            <div className="pointer-events-none absolute left-0 top-0 text-sm text-gray-400">
              Type notes here
            </div>
          )}

          <div
            ref={notesRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const text = e.currentTarget.textContent || "";
              setHasNotes(!!text.trim());
              scheduleSaveNotes(text);
            }}
            className={[
              "min-h-[240px] w-full",
              "rounded-lg",
              "bg-white",
              "text-sm text-gray-900",
              "leading-relaxed",
              "outline-none",
              "whitespace-pre-wrap",
            ].join(" ")}
          />
        </div>
      </div>
    </aside>
  );
}
