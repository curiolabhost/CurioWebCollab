// app/components/admin/ProjectViewWrapper.tsx
"use client";

import React, { useEffect } from "react";
import { useStudentResponses } from "@/app/contexts/StudentResponseContext";
import { AdminStudentSidebar } from "./AdminStudentSidebar";
import SplitView from "@/src/lesson-core/SplitView";

type ProjectViewWrapperProps = {
  children: React.ReactNode;
  isAdminView?: boolean;
  onLessonChange?: (lessonId: number, stepId: number, codeBlockIndex?: number) => void;
};

/**
 * Wrapper component that conditionally displays the admin sidebar
 * next to the project content based on user role.
 * 
 * Usage:
 * - Wrap your project/lesson component with this wrapper
 * - Pass isAdminView={true} when viewing as admin
 * - The sidebar will automatically display student responses
 */
export function ProjectViewWrapper({ 
  children, 
  isAdminView = false,
  onLessonChange 
}: ProjectViewWrapperProps) {
  const { setCurrentLocation } = useStudentResponses();

  // Expose a function that lesson components can call to update location
  useEffect(() => {
    if (onLessonChange) {
      // Make the setCurrentLocation function available globally for lesson components to call
      (window as any).__adminSetLessonLocation = setCurrentLocation;
    }
    return () => {
      if ((window as any).__adminSetLessonLocation) {
        delete (window as any).__adminSetLessonLocation;
      }
    };
  }, [setCurrentLocation, onLessonChange]);

  if (!isAdminView) {
    // Student view - no sidebar
    return <>{children}</>;
  }

  // Admin view - resizable sidebar using splitView
  return (
    <SplitView
      left={
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          {children}
        </div>
      }
      right={
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          <AdminStudentSidebar />
        </div>
      }
      initialLeftRatio={0.65}        // Start with 65% for lesson, 35% for sidebar
      minLeftRatio={0.4}              // Allow shrinking to 40% lesson width
      maxLeftRatio={0.85}             // Allow expanding to 85% lesson width
      minLeftPx={400}                 // Minimum 400px for lesson content
      minRightPx={300}                // Minimum 300px for sidebar
      handleWidth={12}                // Drag handle width
      persistKey="admin-sidebar-split" // Save position in localStorage
    />
  );
}
