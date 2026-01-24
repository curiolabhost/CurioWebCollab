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
 * Also provides student progress data to the lesson component when in admin view.
 */
export function ProjectViewWrapper({ 
  children, 
  isAdminView = false,
  onLessonChange 
}: ProjectViewWrapperProps) {
  const { setCurrentLocation, studentData } = useStudentResponses();

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

  // Provide student progress data to lesson component in admin view
  useEffect(() => {
    if (isAdminView && studentData) {
      // Make student progress available to CodeLessonBase
      (window as any).__getStudentProgress = () => {
        return studentData.completedSteps || [];
      };
      
      {/*} console.log("Admin view: Providing student progress data", {
        studentId: studentData.studentId,
        completedSteps: studentData.completedSteps?.length || 0,
        steps: studentData.completedSteps
      });*/}
    }
    
    return () => {
      if ((window as any).__getStudentProgress) {
        delete (window as any).__getStudentProgress;
      }
    };
  }, [isAdminView, studentData]);

  if (!isAdminView) {
    // Student view - no sidebar
    return <>{children}</>;
  }

  // Admin view - show content with RESIZABLE sidebar using SplitView
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
