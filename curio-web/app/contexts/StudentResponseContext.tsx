// app/contexts/StudentResponseContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ResponseType = "code" | "text" | "ai_chat" | "multiple_choice";

export type StudentResponse = {
  id: string;
  lessonId: number;
  stepId: number;
  codeBlockIndex?: number;
  responseType: ResponseType;
  timestamp: string;
  data: {
    // For code blanks
    blanks?: Record<string, string>;
    // For text responses
    text?: string;
    // For AI chat
    userMessage?: string;
    aiResponse?: string;
    // For multiple choice
    selectedOption?: string;
    options?: string[];
  };
};

export type StudentResponseData = {
  studentId: number;
  projectName: string;
  responses: StudentResponse[];
};

type StudentResponseContextType = {
  currentLessonId: number | null;
  currentStepId: number | null;
  currentCodeBlockIndex: number | null;
  setCurrentLocation: (lessonId: number, stepId: number, codeBlockIndex?: number) => void;
  getResponsesForCurrentLocation: () => StudentResponse[];
  studentData: StudentResponseData | null;
  setStudentData: (data: StudentResponseData | null) => void;
};

const StudentResponseContext = createContext<StudentResponseContextType | undefined>(undefined);

export function StudentResponseProvider({ children }: { children: React.ReactNode }) {
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [currentCodeBlockIndex, setCurrentCodeBlockIndex] = useState<number | null>(null);
  const [studentData, setStudentData] = useState<StudentResponseData | null>(null);

  const setCurrentLocation = (lessonId: number, stepId: number, codeBlockIndex?: number) => {
    setCurrentLessonId(lessonId);
    setCurrentStepId(stepId);
    setCurrentCodeBlockIndex(codeBlockIndex ?? null);
  };

  const getResponsesForCurrentLocation = (): StudentResponse[] => {
    if (!studentData || currentLessonId === null || currentStepId === null) {
      return [];
    }

    return studentData.responses.filter(response => {
      const lessonMatch = response.lessonId === currentLessonId;
      const stepMatch = response.stepId === currentStepId;
      const codeBlockMatch = currentCodeBlockIndex === null || 
                            response.codeBlockIndex === currentCodeBlockIndex;
      
      return lessonMatch && stepMatch && codeBlockMatch;
    });
  };

  const value: StudentResponseContextType = {
    currentLessonId,
    currentStepId,
    currentCodeBlockIndex,
    setCurrentLocation,
    getResponsesForCurrentLocation,
    studentData,
    setStudentData,
  };

  return (
    <StudentResponseContext.Provider value={value}>
      {children}
    </StudentResponseContext.Provider>
  );
}

export function useStudentResponses() {
  const context = useContext(StudentResponseContext);
  if (context === undefined) {
    throw new Error("useStudentResponses must be used within a StudentResponseProvider");
  }
  return context;
}
