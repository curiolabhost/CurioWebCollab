// src/lesson-core/types/adminReadOnlyState.ts

export type AdminLessonLocation = {
  lessonSlug: string;
  stepIndex: number;
  codeBlockIndex?: number | null;
};

export type AdminReadOnlyState = {
  // completed steps (same shape you used before)
  doneStepKeys: string[];

  // blanks (the per-lesson JSON blob you store in LessonState.blanks)
  // keep as unknown so you don’t fight types early
  lessonBlanks: unknown;

  // optional: if you want to show extra state in admin sidebar
  viewState?: unknown;
};
