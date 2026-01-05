"use client";

import * as React from "react";
import { Code2, CircuitBoard, BookOpen } from "lucide-react";

type ViewMode = "lesson" | "code" | "circuit";

const VIEW_MODE_EVENT = "curio:viewMode";

type LessonHeaderControlsProps = {
  viewModeKey: string; // must match CodeLessonBase's `${storagePrefix}:viewMode`
};

function safeSetViewMode(viewModeKey: string, mode: ViewMode) {
  try {
    window.localStorage.setItem(viewModeKey, mode);
    window.dispatchEvent(new Event(VIEW_MODE_EVENT));
  } catch {}
}

function safeReadViewMode(viewModeKey: string): ViewMode {
  try {
    const raw = window.localStorage.getItem(viewModeKey);
    if (raw === "lesson" || raw === "code" || raw === "circuit") return raw;
  } catch {}
  return "lesson";
}

export default function LessonHeaderControls({ viewModeKey }: LessonHeaderControlsProps) {
  const [active, setActive] = React.useState<ViewMode>("lesson");

  React.useEffect(() => {
    setActive(safeReadViewMode(viewModeKey));
  }, [viewModeKey]);

  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 10,

    // longhand border only (no shorthand "border")
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e7eb",

    background: "white",
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    cursor: "pointer",
  };

  const activeBtn: React.CSSProperties = {
    borderColor: "#c7d2fe",
    background: "#eef2ff",
    color: "#3730a3",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        onClick={() => {
          safeSetViewMode(viewModeKey,"lesson");
          setActive("lesson");
        }}
        style={{ ...baseBtn, ...(active === "lesson" ? activeBtn : {}) }}
        title="Lesson"
      >
        <BookOpen size={16} />
        Lesson
      </button>

      <button
        type="button"
        onClick={() => {
          safeSetViewMode(viewModeKey,"code");
          setActive("code");
        }}
        style={{ ...baseBtn, ...(active === "code" ? activeBtn : {}) }}
        title="Code Editor"
      >
        <Code2 size={16} />
        Code Editor
      </button>

      <button
        type="button"
        onClick={() => {
          safeSetViewMode(viewModeKey,"circuit");
          setActive("circuit");
        }}
        style={{ ...baseBtn, ...(active === "circuit" ? activeBtn : {}) }}
        title="Circuit Editor"
      >
        <CircuitBoard size={16} />
        Circuit Editor
      </button>
    </div>
  );
}
