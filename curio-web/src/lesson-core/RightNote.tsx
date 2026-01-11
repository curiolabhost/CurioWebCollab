"use client";

import * as React from "react";

export type LessonRightRailProps = {
  title?: string;
  showHeader?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export default function LessonRightRail({
  title = "",
  showHeader = true,
  children,
  className,
}: LessonRightRailProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [customTitle, setCustomTitle] = React.useState("My Notes");
  const [notes, setNotes] = React.useState("");

  return (
    <aside
      className={[
        "shrink-0",
        "bg-white border-l border-gray-200",
        "overflow-hidden",
        "flex",
        "flex-col",
        "min-w-0",
        "h-full",
        className || "",
      ].join(" ")}
    >
      {showHeader ? (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              {/* Toggle arrow */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-gray-500 hover:text-gray-800 font-mono"
                aria-label={expanded ? "Collapse My Notes" : "Expand My Notes"}
              >
                {expanded ? "<" : ">"}
              </button>

              {/* Title (pixel-perfect) */}
              {expanded ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setCustomTitle(e.currentTarget.textContent || "")}
                  className="outline-none border-b border-transparent focus:border-gray-400"
                >
                  {customTitle}
                </span>
              ) : (
                <span>{title}</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Body */}
      <div className="p-4 min-h-0 overflow-y-auto">
        {expanded ? (
<div className="relative">
  {notes.trim().length === 0 && (
    <div className="pointer-events-none absolute left-0 top-0 text-sm text-gray-400">
      Type notes here
    </div>
  )}

  <div
    contentEditable
    suppressContentEditableWarning
    onInput={(e) => setNotes(e.currentTarget.textContent || "")}
    className={[
      "min-h-[240px] w-full",
      "rounded-lg",
      "bg-white",
      "p-0",
      "text-sm text-gray-900",
      "leading-relaxed",
      "outline-none focus:border-gray-400",
      "whitespace-pre-wrap",
    ].join(" ")}
  />
</div>
        ) : (
          <div className="space-y-3">{children ?? null}</div>
        )}
      </div>
    </aside>
  );
}
