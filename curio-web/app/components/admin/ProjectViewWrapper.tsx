// app/components/admin/ProjectViewWrapper.tsx
// Wraps the project view in the admin interface. Provides a split view with the lesson content on the left and the AdminStudentSidebar on the right.
// Admin state flows from AdminViewProvider (payload.view) → CodeLessonBase reads via useAdminView().
// No window globals. Deterministic props/context flow.
"use client";

import React, { useEffect, useMemo } from "react";
import { useAdminView } from "@/app/contexts/AdminViewContext";
import { AdminStudentSidebar } from "./AdminStudentSidebar";
import SplitView from "@/src/lesson-core/SplitView";

type StudentShape = { id: string; name: string; email?: string | null; avatar?: string | null };
type ProjectShape = { slug: string; title: string };

type ProjectViewWrapperProps = {
  children: React.ReactNode;
  isAdminView?: boolean;
  student?: StudentShape;
  project?: ProjectShape;

  // ✅ add this
  onLessonChange?: (lessonSlug: string, stepIndex: number, codeBlockIndex?: number) => void;
};

export function ProjectViewWrapper({
  children,
  isAdminView = false,
  student,
  project,
  onLessonChange,
}: ProjectViewWrapperProps) {
  const { viewingLocation, adminViewState } = useAdminView() ?? {};

  const adminLocation = useMemo(
    () =>
      viewingLocation
        ? {
            lessonSlug: viewingLocation.lessonSlug,
            stepIndex: viewingLocation.stepIndex,
            codeBlockIndex: viewingLocation.codeBlockIndex,
          }
        : {
            lessonSlug: adminViewState?.currentLessonSlug ?? "code-beginner",
            stepIndex: adminViewState?.stepIndex ?? 0,
            codeBlockIndex: undefined as number | undefined,
          },
    [viewingLocation, adminViewState]
  );

  // ✅ fire callback when location changes (and only when the actual fields change)
  useEffect(() => {
    if (!isAdminView) return;
    onLessonChange?.(adminLocation.lessonSlug, adminLocation.stepIndex, adminLocation.codeBlockIndex);
  }, [isAdminView, onLessonChange, adminLocation.lessonSlug, adminLocation.stepIndex, adminLocation.codeBlockIndex]);

  const adminReadOnlyState = useMemo(
    () =>
      adminViewState
        ? {
            doneStepKeys: adminViewState.doneStepKeys ?? [],
            lessonBlanks: adminViewState.blanks ?? null,
          }
        : { doneStepKeys: [] as string[], lessonBlanks: null as unknown },
    [adminViewState]
  );

  if (!isAdminView) return <>{children}</>;

  // If you want the sidebar, student + project must exist.
  if (!student || !project) {
    return <>{children}</>;
  }

  return (
    <SplitView
      left={<div className="h-full min-h-0 min-w-0 overflow-hidden">{children}</div>}
      right={
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          <AdminStudentSidebar
            student={student}
            project={project}
            adminLocation={adminLocation}
            adminReadOnlyState={adminReadOnlyState}
            responses={[]}
          />
        </div>
      }
      initialLeftRatio={0.65}
      minLeftRatio={0.4}
      maxLeftRatio={0.99}
      minLeftPx={400}
      minRightPx={0}
      handleWidth={12}
      persistKey="admin-sidebar-split"
    />
  );
}