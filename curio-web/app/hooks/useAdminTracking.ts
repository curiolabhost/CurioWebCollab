// app/hooks/useAdminTracking.ts
"use client";

import { useEffect } from "react";

/**
 * Hook that lesson components can use to notify the admin sidebar
 * about the current lesson location (lesson, step, code block).
 * 
 * This hook is safe to use in both student and admin views.
 * It will only function when the admin sidebar is present.
 * 
 * Usage in lesson components:
 * ```tsx
 * function MyLessonStep() {
 *   useAdminTracking(2, 1, 0); // Lesson 2, Step 1, Code Block 0
 *   
 *   return <div>Lesson content...</div>;
 * }
 * ```
 */
export function useAdminTracking(
  lessonId: number,
  stepId: number,
  codeBlockIndex?: number
) {
  useEffect(() => {
    // Check if admin tracking function is available (only when admin sidebar is present)
    const adminSetLocation = (window as any).__adminSetLessonLocation;
    
    if (typeof adminSetLocation === "function") {
      adminSetLocation(lessonId, stepId, codeBlockIndex);
    }
  }, [lessonId, stepId, codeBlockIndex]);
}
