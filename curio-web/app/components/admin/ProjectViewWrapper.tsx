// app/components/admin/ProjectViewWrapper.tsx
"use client";

import React, { useEffect } from "react";
import { useStudentResponses } from "@/app/contexts/StudentResponseContext";
import { AdminStudentSidebar } from "@/app/components/admin/AdminStudentSidebar";

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

  // Admin view - show content with sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      
      {/* Admin sidebar - fixed width */}
      <div className="w-96 flex-shrink-0">
        <AdminStudentSidebar />
      </div>
    </div>
  );
}
