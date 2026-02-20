"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowRight, Search, Users, CheckCircle, Clock, AlertCircle, Link as LinkIcon, Copy } from "lucide-react";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;

  grade: string | null;
  school: string | null;

  currentProject: { slug: string; title: string } | null;
  currentLessonSlug: string | null;
  lastActiveAt: string | null;

  stepsDone: number;
  totalSteps?: number;

  progress?: number;

  // NEW
  needsIdentity: boolean;
};

type StudentStats = {
  total: number;
  onTrack: number;
  inProgress: number;
  needHelp: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function ProgressBar({ progress, metaText }: { progress: number; metaText?: string }) {
  const getColor = () => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" title={metaText || ""}>
        <div className={`h-2 ${getColor()} rounded-full transition-all duration-300`} style={{ width: `${clamp(progress, 0, 100)}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 min-w-[40px]">{clamp(progress, 0, 100)}%</span>
    </div>
  );
}

function computeStudentProjectPercent(s: StudentRow) {
  if (!s.currentProject?.slug) return { percent: 0, totalSteps: 0, stepsDone: s.stepsDone ?? 0 };

  const totalSteps = s.totalSteps ?? 0;
  const stepsDone = Math.max(0, Number(s.stepsDone ?? 0) || 0);

  if (totalSteps <= 0) return { percent: 0, totalSteps, stepsDone };

  const percent = Math.round((stepsDone / totalSteps) * 100);
  return { percent: clamp(percent, 0, 100), totalSteps, stepsDone };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ProfilePill({ grade, school }: { grade: string | null; school: string | null }) {
  const text = grade ? (school ? `${grade} • ${school}` : grade) : school ? school : "—";
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-purple-100 text-purple-800 truncate max-w-full" title={text}>
      {text}
    </span>
  );
}

export function StudentsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim modal state
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimStudent, setClaimStudent] = useState<StudentRow | null>(null);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimFirstName, setClaimFirstName] = useState("");
  const [claimLastName, setClaimLastName] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string>("");
  const [claimError, setClaimError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/students", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
        const data = (await res.json()) as { students: StudentRow[] };

        if (!cancelled) setStudents(Array.isArray(data.students) ? data.students : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load students");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const studentsWithComputedProgress = useMemo(() => {
    return students.map((s) => {
      const { percent, stepsDone, totalSteps } = computeStudentProjectPercent(s);
      return { ...s, __computed: { percent, stepsDone, totalSteps } };
    });
  }, [students]);

  const stats: StudentStats = useMemo(() => {
    const total = studentsWithComputedProgress.length;
    const onTrack = studentsWithComputedProgress.filter((s) => s.__computed.percent >= 70).length;
    const inProgress = studentsWithComputedProgress.filter((s) => s.__computed.percent >= 40 && s.__computed.percent < 70).length;
    const needHelp = studentsWithComputedProgress.filter((s) => s.__computed.percent < 40).length;
    return { total, onTrack, inProgress, needHelp };
  }, [studentsWithComputedProgress]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return studentsWithComputedProgress;

    return studentsWithComputedProgress.filter((s) => {
      const profile = `${s.grade ?? ""} ${s.school ?? ""}`.toLowerCase();
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        profile.includes(q) ||
        (s.currentProject?.title || "").toLowerCase().includes(q) ||
        (s.currentProject?.slug || "").toLowerCase().includes(q) ||
        (s.currentLessonSlug || "").toLowerCase().includes(q)
      );
    });
  }, [studentsWithComputedProgress, searchQuery]);

  const handleStudentClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`);
  };

  function openClaimModal(student: StudentRow) {
    setClaimStudent(student);
    setClaimEmail(student.email || "");
    setClaimFirstName("");
    setClaimLastName("");
    setClaimUrl("");
    setClaimError("");
    setClaimOpen(true);
  }

  async function createClaim() {
    if (!claimStudent) return;
    const email = claimEmail.trim().toLowerCase();
    if (!email) {
      setClaimError("Email is required.");
      return;
    }

    setClaimBusy(true);
    setClaimError("");
    setClaimUrl("");

    try {
      const res = await fetch("/api/admin/claims/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legacyUserId: claimStudent.id,
          email,
          firstName: claimFirstName.trim() || null,
          lastName: claimLastName.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);

      setClaimUrl(String(data.claimUrl || ""));
      // update local list so UI reflects email immediately
      setStudents((prev) =>
        prev.map((s) =>
          s.id === claimStudent.id
            ? {
                ...s,
                email,
                name: s.name === "Student" ? email : s.name,
                needsIdentity: false,
              }
            : s
        )
      );
    } catch (e: any) {
      setClaimError(e?.message || "Failed to create claim link.");
    } finally {
      setClaimBusy(false);
    }
  }

  async function copyClaimUrl() {
    if (!claimUrl) return;
    try {
      await navigator.clipboard.writeText(claimUrl);
    } catch {
      // ignore
    }
  }

  const statsCards = [
    { icon: Users, number: stats.total, label: "Total Students", color: "text-sky-600" },
    { icon: CheckCircle, number: stats.onTrack, label: "On Track", color: "text-green-600" },
    { icon: Clock, number: stats.inProgress, label: "In Progress", color: "text-amber-600" },
    { icon: AlertCircle, number: stats.needHelp, label: "Need Help", color: "text-red-600" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor student progress</p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => {
            // TODO: add CSV export
          }}
        >
          <Download className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Export</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 mb-6">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          className="flex-1 py-2.5 text-sm text-gray-900 outline-none"
          placeholder="Search students by name, email, grade/school, project, or lesson..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
              <Icon className={`w-6 h-6 ${card.color} mb-2`} />
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.number}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {loading && <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">Loading students…</div>}

      {!loading && error && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <p className="text-sm font-semibold text-red-700">Couldn’t load students</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Students Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</div>
              <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current project</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</div>
              <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const pct = student.__computed.percent;
                const done = student.__computed.stepsDone;
                const total = student.__computed.totalSteps;

                const meta =
                  student.currentProject?.slug && total > 0
                    ? `${done} / ${total} steps`
                    : student.currentProject?.slug
                    ? `${done} steps (total unknown for ${student.currentProject.slug})`
                    : "No active project";

                const rowTitle = [
                  student.currentLessonSlug ? `Lesson: ${student.currentLessonSlug}` : "",
                  student.lastActiveAt ? `Last active: ${fmtDate(student.lastActiveAt)}` : "",
                ]
                  .filter(Boolean)
                  .join(" • ");

                return (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student.id)}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    title={rowTitle}
                  >
                    {/* Name */}
                    <div className="col-span-2 flex items-center min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                        {student.needsIdentity && (
                          <p className="text-[11px] text-amber-700 truncate">Needs identity</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 flex items-center min-w-0">
                      <p className="text-xs text-gray-600 truncate max-w-[260px]">{student.email || "—"}</p>
                    </div>

                    {/* Profile */}
                    <div className="col-span-2 flex items-center min-w-0">
                      <ProfilePill grade={student.grade} school={student.school} />
                    </div>

                    {/* Current project */}
                    <div className="col-span-2 flex items-center min-w-0">
                      {student.currentProject ? (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{student.currentProject.title}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {student.currentLessonSlug ? student.currentLessonSlug : "—"}
                            {student.lastActiveAt ? ` • ${fmtDate(student.lastActiveAt)}` : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">—</p>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-span-2 flex items-center">
                      <ProgressBar progress={pct} metaText={meta} />
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {student.needsIdentity && (
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClaimModal(student);
                          }}
                          aria-label="Create claim link"
                          title="Create claim link"
                        >
                          <LinkIcon className="w-4 h-4 text-amber-700" />
                        </button>
                      )}

                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentClick(student.id);
                        }}
                        aria-label="View student"
                        title="View student"
                      >
                        <ArrowRight className="w-4 h-4 text-sky-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found matching your search.</p>
            </div>
          )}
        </>
      )}

      {/* Claim Modal */}
      {claimOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setClaimOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create claim link</h2>
                <p className="text-sm text-gray-500 mt-1">
                  This will (1) save identity into Prisma and (2) generate a link the student clicks once to link their LIVE account.
                </p>
              </div>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setClaimOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (required)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="student@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First name (optional)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={claimFirstName}
                  onChange={(e) => setClaimFirstName(e.target.value)}
                  placeholder="First"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last name (optional)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={claimLastName}
                  onChange={(e) => setClaimLastName(e.target.value)}
                  placeholder="Last"
                />
              </div>
            </div>

            {claimError && <p className="text-sm text-red-600 mt-3">{claimError}</p>}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
                onClick={createClaim}
                disabled={claimBusy}
              >
                {claimBusy ? "Creating…" : "Create link"}
              </button>

              {claimUrl && (
                <>
                  <code className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 flex-1 overflow-x-auto">
                    {claimUrl}
                  </code>
                  <button
                    type="button"
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    onClick={copyClaimUrl}
                    title="Copy link"
                    aria-label="Copy link"
                  >
                    <Copy className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Tip: After the student clicks the link and signs in, their legacy progress will be preserved (as long as your student routes resolve DB userId correctly).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}