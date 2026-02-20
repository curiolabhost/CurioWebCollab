// app/admin/students/[id]/page.tsx
// This page shows details about a specific student, including their current progress, projects, and AI-generated insights. Admins can click into each project to see more detailed information about the student's work and progress on that project.

// app/admin/students/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Sparkles, ChevronRight, Eye, FileText, BarChart3 } from "lucide-react";

type ProjectDto = {
  slug: string;
  name: string;
  status: "completed" | "in_progress";
  lastActiveAt: string | null; // ISO
  stepsDone: number;
  totalSteps?: number | null;
};

type StudentDetailDto = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;

  grade: string | null;
  school: string | null;

  activeProjectSlug: string | null;
  activeLessonSlug: string | null;
  lastActiveAt: string | null;

  projectsStarted: number;
  projectsCompleted: number;

  projects: ProjectDto[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ProgressBar({
  progress,
  showLabel = false,
  size = "lg",
}: {
  progress: number;
  showLabel?: boolean;
  size?: "sm" | "lg";
}) {
  const height = size === "lg" ? "h-3" : "h-2";

  const getColor = () => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${height} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${clamp(progress, 0, 100)}%` }}
        />
      </div>
      {showLabel ? (
        <span className="text-sm font-semibold text-gray-700 min-w-[40px]">{clamp(progress, 0, 100)}%</span>
      ) : null}
    </div>
  );
}

/**
 * Uses API-provided stepsDone and totalSteps (level-specific: code-{level} + circuit-{level}).
 * Must match dashboard formula. Never fall back to full project total.
 */
function computeProjectPercent(p: ProjectDto) {
  const total = p.totalSteps ?? 0;
  if (total <= 0) return { percent: 0, meta: `${p.stepsDone} steps` };
  const percent = Math.round((p.stepsDone / total) * 100);
  return { percent: clamp(percent, 0, 100), meta: `${p.stepsDone} / ${total} steps` };
}

function ProjectDetailsTab({ student }: { student: StudentDetailDto }) {
  const router = useRouter();

  const handleViewAsAdmin = (projectSlug: string) => {
    router.push(`/admin/students/${student.id}/projects/${projectSlug}`);
  };

  return (
    <div className="space-y-4">
      {student.projects.map((project) => {
        const { percent, meta } = computeProjectPercent(project);

        return (
          <div key={project.slug} className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Project Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
                  <p className="text-sm text-gray-500">Last active: {fmtDate(project.lastActiveAt)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{meta}</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  project.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {project.status === "completed" ? "Completed" : "In Progress"}
              </span>
            </div>

            {/* Progress Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-sm font-semibold text-gray-900">{percent}%</span>
              </div>
              <ProgressBar progress={percent} size="lg" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleViewAsAdmin(project.slug)}
                className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View as Admin</span>
              </button>

              <button
                className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                onClick={() => {}}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Solutions</span>
              </button>

              <button
                className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                onClick={() => {}}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Analytics</span>
              </button>
            </div>

            {/* NOTE:
               You had "submissions/code preview" in mock data, but your DB schema doesn't store code submissions.
               If you add a Submissions model later, you can re-enable a real code preview here.
             */}
          </div>
        );
      })}
    </div>
  );
}

function AIAnalysisTab({ student }: { student: StudentDetailDto }) {
  // Using only REAL fields you have today (projects started/completed)
  const performanceLevel =
    student.projectsCompleted >= 2 ? "excellent" : student.projectsCompleted >= 1 ? "good" : "developing";

  const strengthLevel = student.projectsCompleted >= 2 ? "strong" : "growing";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-purple-50 rounded-xl border border-purple-200 p-5">
        <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-purple-900">AI-Powered Insights</h3>
          <p className="text-sm text-purple-700 mt-1">
            (Placeholder) Insights can be generated later from real progress + submissions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">📊 Overall Activity</h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {student.name} has started {student.projectsStarted} project{student.projectsStarted !== 1 ? "s" : ""} and
          completed {student.projectsCompleted} project{student.projectsCompleted !== 1 ? "s" : ""}. Current level looks{" "}
          {performanceLevel}, with {strengthLevel} momentum based on completed work.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">💡 Recommendations</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-sky-50 p-3 rounded-lg">
            <ChevronRight className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sky-900">Keep sessions consistent (2–3x/week) to maintain progress.</p>
          </div>
          <div className="flex items-start gap-2 bg-sky-50 p-3 rounded-lg">
            <ChevronRight className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sky-900">
              If they stall, check which lessons are incomplete and review the last active project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [activeTab, setActiveTab] = useState<"projects" | "ai-analysis">("projects");
  const [student, setStudent] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/students/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load student (${res.status})`);

        const data = (await res.json()) as { student: StudentDetailDto };
        if (!cancelled) setStudent(data.student ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load student");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const profileText = useMemo(() => {
    if (!student) return "—";
    const grade = student.grade ? student.grade : null;
    const school = student.school ? student.school : null;
    return grade ? (school ? `${grade} • ${school}` : grade) : school ? school : "—";
  }, [student]);

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Students</span>
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">Loading student…</div>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Students</span>
        </button>

        <div className="bg-white rounded-xl border border-red-200 p-6">
          <p className="text-sm font-semibold text-red-700">Couldn’t load student</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Back to Students</span>
        </button>

        <div className="text-center py-12">
          <p className="text-gray-500">Student not found.</p>
          <button onClick={() => router.push("/admin")} className="mt-4 text-sky-600 hover:text-sky-700">
            Return to Students List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-base font-medium">Back to Students</span>
      </button>

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-white">{student.avatar}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1 truncate">{student.name}</h1>
            <p className="text-sm text-gray-500 mb-1 truncate">{student.email || "—"}</p>

            <div className="text-[11px] text-gray-500 space-y-0.5 mb-2">
              <div className="truncate">
                <span className="font-medium text-gray-600">ID:</span> {student.id}
              </div>
              <div>
                <span className="font-medium text-gray-600">Created:</span> {fmtDate(student.createdAt)}
              </div>
            </div>


            <div className="inline-flex items-center gap-1.5 bg-purple-100 px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-xs font-medium text-purple-800">{profileText}</span>
            </div>

            <p className="text-[11px] text-gray-400 mt-2">
              Last active: {fmtDate(student.lastActiveAt)}{" "}
              {student.activeLessonSlug ? `• Current lesson: ${student.activeLessonSlug}` : ""}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{student.projectsStarted}</p>
            <p className="text-xs text-gray-500 mt-1">Projects Started</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{student.projectsCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          <div className="text-center">
            {/* “Overall Progress” is not a single DB field; keep it simple for now */}
            <p className="text-3xl font-bold text-gray-900">
              {student.projectsStarted > 0 ? Math.round((student.projectsCompleted / student.projectsStarted) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === "projects" ? "border-sky-600 text-sky-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className={`text-sm ${activeTab === "projects" ? "font-semibold" : "font-medium"}`}>Project Details</span>
        </button>

        <button
          onClick={() => setActiveTab("ai-analysis")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === "ai-analysis"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === "ai-analysis" ? "text-sky-600" : "text-gray-600"}`} />
          <span className={`text-sm ${activeTab === "ai-analysis" ? "font-semibold" : "font-medium"}`}>AI Analysis</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "projects" ? <ProjectDetailsTab student={student} /> : <AIAnalysisTab student={student} />}
    </div>
  );
}
