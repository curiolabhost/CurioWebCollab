// app/admin/students/[id]/projects/[projectId]/page.tsx
// This page allows admins to view a student's progress in a specific project. It fetches the student's current lesson, step, and responses for that project, and renders the appropriate lesson component based on the projectSlug and lessonSlug. It also includes an admin sidebar that shows all responses for the current lesson and step, and allows admins to see details of each response. The header includes the student's name, avatar, current lesson/step, and a back button to return to the student overview.
// This is the MIRROR of the student-facing project view page, but with additional admin-only info and controls. The URL is /admin/students/[id]/projects/[projectId].

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminViewProvider, type AdminViewState } from "@/app/contexts/AdminViewContext";
import { StudentResponseProvider, useStudentResponses } from "@/app/contexts/StudentResponseContext";
import { ProjectViewWrapper } from "@/app/components/admin/ProjectViewWrapper";
import LessonHeaderControls from "@/app/projects/[slug]/lessons/[lessonSlug]/LessonHeaderControls";

import ElectricStatusBoardBeginner from "@/src/projects/electric-status-board/lessons/codeBeg";
import ElectricStatusBoardIntermediate from "@/src/projects/electric-status-board/lessons/codeInt";
import ElectricStatusBoardAdvanced from "@/src/projects/electric-status-board/lessons/codeAdv";

type ApiPayload = {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    createdAt: string;
    grade: string | null;
    school: string | null;
  };
  project: {
    slug: string;
    title: string;
  };
  view: {
    studentId: string;
    projectSlug: string;
    currentLessonSlug: string | null;
    lessonIndex: number | null;
    stepIndex: number | null;
    blanks: any | null;
    doneStepKeys: string[];
    circuitState: { wokwiUrl: string | null; diagramJson: any } | null;
    notebookState: { title: string; pagesJson: any } | null;
    arduinoCode?: string | null;
  };
};

/** Map API payload.view to AdminViewState for AdminViewProvider */
function mapPayloadToAdminState(payload: ApiPayload): AdminViewState {
  const { view, student, project } = payload;
  return {
    studentId: student.id,
    projectSlug: project.slug,
    currentLessonSlug: view.currentLessonSlug ?? null,
    lessonIndex: view.lessonIndex ?? null,
    stepIndex: view.stepIndex ?? null,
    blanks: view.blanks && typeof view.blanks === "object" ? view.blanks : null,
    doneStepKeys: Array.isArray(view.doneStepKeys) ? view.doneStepKeys : [],
    circuitState: view.circuitState ?? null,
    notebookState: view.notebookState ?? null,
    arduinoCode: typeof view.arduinoCode === "string" ? view.arduinoCode : null,
  };
}

function LessonRenderer({
  projectSlug,
  lessonSlugOverride,
}: {
  projectSlug: string;
  lessonSlugOverride?: string | null;
}) {
  if (projectSlug === "electric-status-board") {
    // If the student is in a specific lessonSlug, we try to map it to the right component.
    // Adjust these strings to match your actual lessonSlug conventions.
    const ls = lessonSlugOverride ?? "code-beginner";

    if (ls === "code-intermediate") return <ElectricStatusBoardIntermediate slug={projectSlug} lessonSlug={ls} />;
    if (ls === "code-advanced") return <ElectricStatusBoardAdvanced slug={projectSlug} lessonSlug={ls} />;

    // default beginner
    return <ElectricStatusBoardBeginner slug={projectSlug} lessonSlug="code-beginner" />;
  }

  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900 font-medium mb-2">Project lesson not configured</p>
        <p className="text-sm text-yellow-800">Add the lesson component for "{projectSlug}" to LessonRenderer.</p>
      </div>
    </div>
  );
}

function AdminProjectInner({ payload }: { payload: ApiPayload }) {
  const router = useRouter();
  const { setStudentData } = useStudentResponses();

  // Map API payload -> context shape your wrapper expects
  useEffect(() => {
    setStudentData({
      studentId: payload.student.id,
      projectSlug: payload.project.slug,
      projectName: payload.project.title,
      // responses can be empty for now until you log them to DB
      responses: [],
      doneStepKeys: payload.view.doneStepKeys,
      view: {
        studentId: payload.student.id,
        projectSlug: payload.project.slug,
        projectTitle: payload.project.title,
        currentLessonSlug: payload.view.currentLessonSlug,
        lessonIndex: payload.view.lessonIndex,
        stepIndex: payload.view.stepIndex,
        blanks: payload.view.blanks,
        doneStepKeys: payload.view.doneStepKeys,
        circuitState: payload.view.circuitState,
        notebookState: payload.view.notebookState,
      },
    });

    return () => setStudentData(null);
  }, [payload, setStudentData]);

  const subtitle = useMemo(() => {
    const lesson = payload.view.currentLessonSlug ?? "—";
    const step = payload.view.stepIndex !== null ? `step ${payload.view.stepIndex + 1}` : "";
    return `Viewing as admin · ${payload.student.name}${lesson !== "—" ? ` · ${lesson}` : ""}${step ? ` · ${step}` : ""}`;
  }, [payload]);

  const adminState = useMemo(() => mapPayloadToAdminState(payload), [payload]);
  const lessonSlugForKeys = payload.view.currentLessonSlug ?? "code-beginner";

  return (
    <AdminViewProvider state={adminState}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => router.push(`/admin/students/${payload.student.id}`)}
            className="flex items-center gap-2 mb-3 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Student</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{payload.project.title}</h1>
              <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <LessonHeaderControls
                viewModeKey={`curio:${payload.project.slug}:${lessonSlugForKeys}:viewMode`}
                notesVisibleKey={`curio:${payload.project.slug}:${lessonSlugForKeys}:notesVisible`}
              />
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{payload.student.avatar}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Content with Admin Sidebar */}
        <div className="flex-1 overflow-hidden">
        <ProjectViewWrapper
          isAdminView
          student={{
            id: payload.student.id,
            name: payload.student.name,
            email: payload.student.email,
            avatar: payload.student.avatar,
          }}
          project={{
            slug: payload.project.slug,
            title: payload.project.title,
          }}
          onLessonChange={(lessonSlug, stepIndex, codeBlockIndex) => {
            console.log(`Admin viewing: ${lessonSlug} step=${stepIndex} block=${codeBlockIndex ?? "—"}`);
          }}
        >
          <LessonRenderer projectSlug={payload.project.slug} lessonSlugOverride={payload.view.currentLessonSlug} />
        </ProjectViewWrapper>
        </div>
      </div>
    </AdminViewProvider>
  );
}

export default function AdminProjectViewPage() {
  const params = useParams<{ id: string; projectId: string }>();
  const router = useRouter();

  const studentId = params.id;         // string Clerk userId
  const projectSlug = params.projectId; // slug

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/students/${studentId}/projects/${projectSlug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load admin project view (${res.status})`);

        const json = (await res.json()) as ApiPayload;
        if (!cancelled) setPayload(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (studentId && projectSlug) load();
    return () => {
      cancelled = true;
    };
  }, [studentId, projectSlug]);

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push(`/admin/students/${studentId}`)}
          className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Student</span>
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">Loading project…</div>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push(`/admin/students/${studentId}`)}
          className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Student</span>
        </button>
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <p className="text-sm font-semibold text-red-700">Couldn’t load project view</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found.</p>
          <button onClick={() => router.push(`/admin/students/${studentId}`)} className="mt-4 text-sky-600 hover:text-sky-700">
            Return to Student Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <StudentResponseProvider>
      <AdminProjectInner payload={payload} />
    </StudentResponseProvider>
  );
}
