/**
 * Shared step-counting logic used by CodeLessonBase and admin project totals.
 * Matches CodeLessonBase: excludes optional lessons and optional steps.
 */

function isLessonEntryOptional(entry: any): boolean {
  return !!entry?.optional;
}

function isLessonEntryAdvanced(entry: any): boolean {
  return !!entry?.advanced;
}

function isStepOptional(step: any): boolean {
  return !!step?.optional;
}

function getStepsArray(entry: any): any[] {
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (Array.isArray(entry.steps)) return entry.steps;
  return [];
}

/**
 * Count steps in a lesson-steps object (same logic as CodeLessonBase.countCountedStepsForLesson).
 * Excludes optional lessons and optional steps.
 */
export function countCountedStepsInLessonSteps(lessonSteps: Record<number, any>): number {
  const keys = Object.keys(lessonSteps || {})
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let total = 0;
  for (const ln of keys) {
    const entry = (lessonSteps as any)[ln];
    if (isLessonEntryOptional(entry)) continue;
    const arr = getStepsArray(entry);
    for (let i = 0; i < arr.length; i++) {
      if (isStepOptional(arr[i])) continue;
      total++;
    }
  }
  return total;
}

/**
 * Same as countCountedStepsInLessonSteps but also EXCLUDES advanced lessons.
 * Matches CodeLessonBase.totalNormalStepsAllLessons — used when advancedUnlocked=false (dashboard default).
 */
export function countCountedStepsInLessonStepsExcludingAdvanced(
  lessonSteps: Record<number, any>
): number {
  const keys = Object.keys(lessonSteps || {})
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let total = 0;
  for (const ln of keys) {
    const entry = (lessonSteps as any)[ln];
    if (isLessonEntryOptional(entry)) continue;
    if (isLessonEntryAdvanced(entry)) continue; // exclude advanced (locked) lessons
    const arr = getStepsArray(entry);
    for (let i = 0; i < arr.length; i++) {
      if (isStepOptional(arr[i])) continue;
      total++;
    }
  }
  return total;
}
