"use client";

import * as React from "react";
import { Code2, CircuitBoard, BookOpen } from "lucide-react";
import { useAdminView } from "@/app/contexts/AdminViewContext";

type ViewMode = "lesson" | "code" | "circuit";

const VIEW_MODE_EVENT = "curio:viewMode";
const NOTES_VISIBLE_EVENT = "curio:notesVisible";

type LessonHeaderControlsProps = {
  viewModeKey: string;        // must match CodeLessonBase's `${storagePrefix}:viewMode`
  notesVisibleKey: string;   // `${storagePrefix}:notesVisible`
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

function safeSetNotesVisible(notesVisibleKey: string, visible: boolean) {
  try {
    window.localStorage.setItem(notesVisibleKey, visible ? "1" : "0");
    window.dispatchEvent(new Event(NOTES_VISIBLE_EVENT));
  } catch {}
}

function safeReadNotesVisible(notesVisibleKey: string, defaultValue = true): boolean {
  try {
    const raw = window.localStorage.getItem(notesVisibleKey);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {}
  return defaultValue;
}

export default function LessonHeaderControls({
  viewModeKey,
  notesVisibleKey,
}: LessonHeaderControlsProps) {
  const adminView = useAdminView();
  const isAdminView = !!adminView?.adminViewState;

  const [active, setActive] = React.useState<ViewMode>("lesson");
  const [notesVisible, setNotesVisible] = React.useState<boolean>(true);

  const viewMode = isAdminView ? (adminView!.adminViewMode ?? "lesson") : active;
  const setViewMode = isAdminView ? (adminView!.setAdminViewMode ?? (() => {})) : setActive;

  React.useEffect(() => {
    if (isAdminView) return;
    setActive(safeReadViewMode(viewModeKey));
    setNotesVisible(safeReadNotesVisible(notesVisibleKey, true));
  }, [viewModeKey, notesVisibleKey, isAdminView]);

  React.useEffect(() => {
    if (isAdminView) return;
    const onNotes = () => {
      setNotesVisible(safeReadNotesVisible(notesVisibleKey, true));
    };
    window.addEventListener(NOTES_VISIBLE_EVENT, onNotes);
    return () => window.removeEventListener(NOTES_VISIBLE_EVENT, onNotes);
  }, [notesVisibleKey, isAdminView]);

  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 10,
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

  const handleViewMode = (mode: ViewMode) => {
    if (isAdminView) {
      setViewMode(mode);
    } else {
      safeSetViewMode(viewModeKey, mode);
      setActive(mode);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Lesson */}
      <button
        type="button"
        onClick={() => handleViewMode("lesson")}
        style={{ ...baseBtn, ...(viewMode === "lesson" ? activeBtn : {}) }}
        title="Lesson"
      >
        <BookOpen size={16} />
        Lesson
      </button>

      {/* Notes toggle - hidden in admin view (notes are read-only hidden in CodeLessonBase) */}
      {!isAdminView && (
        <button
          type="button"
          onClick={() => {
            const next = !notesVisible;
            safeSetNotesVisible(notesVisibleKey, next);
            setNotesVisible(next);
          }}
          style={baseBtn}
          title={notesVisible ? "Hide Notes" : "Show Notes"}
        >
          {notesVisible ? "Hide Notes" : "Show Notes"}
        </button>
      )}

      {/* Code */}
      <button
        type="button"
        onClick={() => handleViewMode("code")}
        style={{ ...baseBtn, ...(viewMode === "code" ? activeBtn : {}) }}
        title="Code Editor"
      >
        <Code2 size={16} />
        Code Editor
      </button>

      {/* Circuit */}
      <button
        type="button"
        onClick={() => handleViewMode("circuit")}
        style={{ ...baseBtn, ...(viewMode === "circuit" ? activeBtn : {}) }}
        title="Circuit Editor"
      >
        <CircuitBoard size={16} />
        Circuit Editor
      </button>
    </div>
  );
}
