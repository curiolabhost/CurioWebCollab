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
        <div
            className={[
                "sticky top-0 z-10 border-b px-4 py-3 transition-colors",
                expanded
                ? "bg-white border-gray-200"
                : "bg-indigo-200 border-indigo-300",
            ].join(" ")}
            >
          <div className="flex items-center justify-between">
            <div
                className={[
                    "flex items-center gap-2 text-sm font-semibold",
                    expanded ? "text-gray-800" : "text-indigo-900",
                ].join(" ")}
>
              {/* Toggle arrow */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={[
                    "font-mono transition-colors",
                    expanded
                        ? "text-gray-500 hover:text-gray-800"
                        : "text-indigo-900/80 hover:text-indigo-800",
                    ].join(" ")}
                                    
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
      <div 
        className={[
            "p-4 min-h-0",
            expanded ? "overflow-y-auto pointer-events-auto" : "overflow-y-hidden pointer-events-none",
        ].join(" ")}
      >
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
            <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-20">
                <img
                src="/curio-owl-sleep.png"
                alt="Pluto sleeping"
                className="w-28 h-30 opacity-90"
                />

                <div className="text-medium text-indigo-600 leading-relaxed">
                <div className="font-medium text-gray-700 mb-1">
                    Pluto the Star has not woken up yet.
                </div>
                <div>
                    Look forward to our new AI helper.
                </div>
                </div>
            </div>
            )
        }
      </div>
    </aside>
  );
}
