"use client";

import React, { createContext, useContext, useCallback, useState, useMemo, useEffect } from "react";

/** Student's saved state from /api/admin/students/[id]/projects/[projectId] */
export type AdminViewState = {
  studentId: string;
  projectSlug: string;
  currentLessonSlug: string | null;
  lessonIndex: number | null;
  stepIndex: number | null;
  blanks: Record<string, any> | null;
  doneStepKeys: string[];
  circuitState: { wokwiUrl: string | null; diagramJson: any } | null;
  notebookState: { title: string; pagesJson: any } | null;
  arduinoCode?: string | null;
};

/** Where the admin is currently viewing (can differ when admin navigates) */
export type AdminViewingLocation = {
  lessonSlug: string;
  stepIndex: number;
  codeBlockIndex?: number;
};

export type AdminViewMode = "lesson" | "code" | "circuit";

type AdminViewContextType = {
  /** Full student state from API. Null = not admin view. */
  adminViewState: AdminViewState | null;

  /** Where admin is looking (for sidebar). Updates when admin navigates. */
  viewingLocation: AdminViewingLocation | null;

  /** Call when lesson/step changes (e.g. from CodeLessonBase navigation) */
  setViewingLocation: (lessonSlug: string, stepIndex: number, codeBlockIndex?: number) => void;

  /** Admin view mode: lesson, code (Arduino), or circuit. Used to switch editor panes. */
  adminViewMode: AdminViewMode;
  setAdminViewMode: (mode: AdminViewMode) => void;
};

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export function AdminViewProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state: AdminViewState | null;
}) {
  const initialLocation: AdminViewingLocation | null = useMemo(() => {
    if (!state?.currentLessonSlug) return null;
    const stepIndex = state.stepIndex ?? 0;
    return {
      lessonSlug: state.currentLessonSlug,
      stepIndex: Number.isFinite(stepIndex) ? stepIndex : 0,
    };
  }, [state?.currentLessonSlug, state?.stepIndex]);

  const [viewingLocation, setViewingLocationState] = useState<AdminViewingLocation | null>(
    initialLocation
  );
  const [adminViewMode, setAdminViewMode] = useState<AdminViewMode>("lesson");

  useEffect(() => {
    if (state && initialLocation) {
      setViewingLocationState((prev) => (prev ? prev : initialLocation));
    }
  }, [state, initialLocation]);

  const setViewingLocation = useCallback(
    (lessonSlug: string, stepIndex: number, codeBlockIndex?: number) => {
      setViewingLocationState({
        lessonSlug,
        stepIndex,
        codeBlockIndex,
      });
    },
    []
  );

  const value = useMemo<AdminViewContextType>(
    () => ({
      adminViewState: state,
      viewingLocation: state ? viewingLocation ?? initialLocation : null,
      setViewingLocation,
      adminViewMode,
      setAdminViewMode,
    }),
    [state, viewingLocation, initialLocation, setViewingLocation, adminViewMode]
  );

  return (
    <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>
  );
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  return context;
}
