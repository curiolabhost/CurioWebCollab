// app/contexts/StudentResponseContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type ResponseType = "code" | "text" | "ai_chat" | "multiple_choice";

/** Optional: "responses" for your sidebar (can be empty until you implement logging) */
export type StudentResponse = {
  id: string;
  lessonSlug: string;          // CHANGED: was lessonId:number
  stepIndex: number;           // CHANGED: was stepId:number (DB stores stepIndex in LessonLocation)
  codeBlockIndex?: number;
  responseType: ResponseType;
  timestamp: string;
  data: {
    blanks?: Record<string, string>;
    text?: string;
    userMessage?: string;
    aiResponse?: string;
    selectedOption?: string;
    options?: string[];
  };
};

/** REAL DB-backed student view state (what admin needs to render the student's screen) */
export type StudentViewState = {
  studentId: string;           // CHANGED: Clerk userId
  projectSlug: string;
  projectTitle?: string;

  // where the student is
  currentLessonSlug: string | null;
  lessonIndex: number | null;
  stepIndex: number | null;

  // what the student has saved
  blanks: Record<string, any> | null; // LessonState.blanks JSON blob
  circuitState?: {
    wokwiUrl: string | null;
    diagramJson: any;
  } | null;
  notebookState?: {
    title: string;
    pagesJson: any;
  } | null;

  // progress keys the lesson engine can use
  doneStepKeys: string[]; // from LessonProgress.stepKey where status="done"
};

/** Sidebar-friendly wrapper (still supports responses, but no longer required) */
export type StudentResponseData = {
  studentId: string; // CHANGED
  projectSlug: string;
  projectName?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  doneStepKeys?: string[]; // CHANGED: from completedSteps
  responses?: StudentResponse[]; // optional
  view?: StudentViewState; // <-- this is the big addition
};

type StudentResponseContextType = {
  // Admin's current "cursor" in the UI (what location the admin is looking at)
  currentLessonSlug: string | null;
  currentStepIndex: number | null;
  currentCodeBlockIndex: number | null;

  setCurrentLocation: (lessonSlug: string, stepIndex: number, codeBlockIndex?: number) => void;

  // Back-compat: If you still have legacy code calling numeric lessonId/stepId
  setCurrentLocationLegacy: (lessonId: number, stepId: number, codeBlockIndex?: number) => void;

  // Data
  studentData: StudentResponseData | null;
  setStudentData: (data: StudentResponseData | null) => void;

  // Helpers for sidebar and lesson engine
  getResponsesForCurrentLocation: () => StudentResponse[];
  getDoneStepKeys: () => string[];
  getStudentBlanks: () => Record<string, any> | null;
};

const StudentResponseContext = createContext<StudentResponseContextType | undefined>(undefined);

export function StudentResponseProvider({ children }: { children: React.ReactNode }) {
  const [currentLessonSlug, setCurrentLessonSlug] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [currentCodeBlockIndex, setCurrentCodeBlockIndex] = useState<number | null>(null);

  const [studentData, setStudentData] = useState<StudentResponseData | null>(null);

  const setCurrentLocation = (lessonSlug: string, stepIndex: number, codeBlockIndex?: number) => {
    setCurrentLessonSlug(lessonSlug);
    setCurrentStepIndex(stepIndex);
    setCurrentCodeBlockIndex(codeBlockIndex ?? null);
  };

  // Legacy shim (keeps your old code from crashing if anything still calls it)
  const setCurrentLocationLegacy = (lessonId: number, stepId: number, codeBlockIndex?: number) => {
    // We don't truly know the mapping, so we store a stable placeholder slug.
    // Ideally remove this once everything calls slug-based location.
    setCurrentLocation(`lesson-${lessonId}`, stepId, codeBlockIndex);
  };

  const getResponsesForCurrentLocation = () => {
    const responses = studentData?.responses ?? [];
    if (!studentData || currentLessonSlug === null || currentStepIndex === null) return [];

    return responses.filter((r) => {
      const lessonMatch = r.lessonSlug === currentLessonSlug;
      const stepMatch = r.stepIndex === currentStepIndex;
      const codeBlockMatch = currentCodeBlockIndex === null || r.codeBlockIndex === currentCodeBlockIndex;
      return lessonMatch && stepMatch && codeBlockMatch;
    });
  };

  const getDoneStepKeys = () => {
    // Prefer "view.doneStepKeys" (real DB)
    const keys = studentData?.view?.doneStepKeys ?? studentData?.doneStepKeys ?? [];
    return Array.isArray(keys) ? keys : [];
  };

  const getStudentBlanks = () => {
    return studentData?.view?.blanks ?? null;
  };

  const value = useMemo<StudentResponseContextType>(
    () => ({
      currentLessonSlug,
      currentStepIndex,
      currentCodeBlockIndex,
      setCurrentLocation,
      setCurrentLocationLegacy,
      studentData,
      setStudentData,
      getResponsesForCurrentLocation,
      getDoneStepKeys,
      getStudentBlanks,
    }),
    [currentLessonSlug, currentStepIndex, currentCodeBlockIndex, studentData]
  );

  return <StudentResponseContext.Provider value={value}>{children}</StudentResponseContext.Provider>;
}

export function useStudentResponses() {
  const context = useContext(StudentResponseContext);
  if (!context) throw new Error("useStudentResponses must be used within a StudentResponseProvider");
  return context;
}
