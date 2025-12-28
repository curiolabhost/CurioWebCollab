"use client";

import * as React from "react";
import { Code2, CircuitBoard, BookOpen } from "lucide-react";

type ViewMode = "lesson" | "code" | "circuit";

const VIEW_MODE_KEY = "esb:viewMode";
const VIEW_MODE_EVENT = "curio:viewMode";

function safeSetViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
    // same-tab update (storage event won't fire in same tab)
    window.dispatchEvent(new Event(VIEW_MODE_EVENT));
  } catch {}
}

function safeReadViewMode(): ViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_KEY);
    if (raw === "lesson" || raw === "code" || raw === "circuit") return raw;
  } catch {}
  return "lesson";
}

export default function LessonHeaderControls() {
  const [active, setActive] = React.useState<ViewMode>("lesson");

  React.useEffect(() => {
    setActive(safeReadViewMode());
  }, []);

  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 10,

    // ✅ longhand border only (no shorthand "border")
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
          safeSetViewMode("lesson");
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
          safeSetViewMode("code");
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
          safeSetViewMode("circuit");
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
