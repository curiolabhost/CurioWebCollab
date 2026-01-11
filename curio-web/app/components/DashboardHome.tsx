// app/components/DashboardHome.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Play,
  Menu,
  X,
  User as UserIcon,
  Settings,
  LogOut,
  FileText,
  BarChart,
  MessageSquare,
  Compass,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";

import type { Project } from "@/app/data/projects";
import { PROJECTS } from "@/app/data/projects";

/** Dashboard-only model (per-user state) */
type ProjectSchedule = {
  daysPerWeek: number;
  hoursPerDay: number;
  targetDate?: Date;
};

type CompletedProject = {
  project: Project;
  totalHours: number;
  startedDate: Date;
  completedDate: Date;
};

type StoredCompletedProject = {
  slug: string;
  totalHours: number;
  startedDateISO: string;
  completedDateISO: string;
};

type ActivePtr = { slug: string; lessonSlug: string };
type NavState = { lesson: number; stepIndex: number };

const COMPLETED_PROJECTS_KEY = "curio:dashboard:completedProjects";
const STARTED_AT_KEY = (slug: string) => `curio:${slug}:startedAt`;

function startOfWeekKey(d = new Date()) {
  // Monday-based week
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day + 6) % 7; // Mon=0, Tue=1 ... Sun=6
  date.setDate(date.getDate() - diffToMonday);
  date.setHours(0, 0, 0, 0);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * Project.hours is like "8-10 hours" or "15-20 hours".
 * Beginner = min
 * Advanced = max (if Advanced exists)
 * Intermediate = average of ends (if Advanced exists), otherwise max
 * If no range, use the single number.
 */
function parseHoursToNumber(
  hoursText: string,
  opts?: { levelLabel?: string; difficulties?: string[] }
): number {
  if (!hoursText) return 10;

  const nums = hoursText.match(/\d+(\.\d+)?/g)?.map((n) => parseFloat(n)) ?? [];
  if (nums.length === 0) return 10;

  if (nums.length === 1) return nums[0];

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  const level = (opts?.levelLabel ?? "").toLowerCase();
  const diffs = opts?.difficulties ?? [];
  const hasAdvanced = diffs.includes("Advanced");

  if (level.includes("beg")) return min;
  if (level.includes("adv")) return max;

  if (hasAdvanced) return (min + max) / 2;
  return max;
}

function daysBetween(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay);
}

function labelizeLessonSlug(lessonSlug: string) {
  // "code-beg" -> "Code Beg", "levels/beginner" -> "Beginner"
  const last = (lessonSlug || "").split("/").pop() || "";
  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function prettyLevelFromLessonSlug(lessonSlug: string) {
  const last = (lessonSlug || "").split("/").pop() || "";
  const parts = last.split(/[-_]/g).filter(Boolean);
  const suffix = (parts[parts.length - 1] || "").toLowerCase();

  if (suffix === "beg" || suffix === "beginner") return "Beginner";
  if (suffix === "adv" || suffix === "advanced") return "Advanced";
  if (suffix === "int" || suffix === "intermediate") return "Intermediate";

  // fallback to original formatting
  return labelizeLessonSlug(lessonSlug);
}

function levelSuffixFromLessonSlug(lessonSlug: string | null | undefined) {
  const last = (lessonSlug || "").split("/").pop() || "";
  const parts = last.split(/[-_]/g).filter(Boolean);
  const suffix = (parts[parts.length - 1] || "").toLowerCase();

  if (suffix === "beg" || suffix === "beginner") return "beg";
  if (suffix === "int" || suffix === "intermediate") return "int";
  if (suffix === "adv" || suffix === "advanced") return "adv";
  return null;
}



export function DashboardHome() {
  const router = useRouter();
  const projects = PROJECTS;

  const availableProjects = projects.filter((p) => p.available);
  const unavailableProjects = projects.filter((p) => !p.available);

  // --- REAL current project pointer + real progress ---
  const [activePtr, setActivePtr] = useState<ActivePtr | null>(null);
  const [activeProgress, setActiveProgress] = useState<number>(0);
  const [activeNav, setActiveNav] = useState<NavState | null>(null);

  const [activeTotalSteps, setActiveTotalSteps] = useState<number>(0);
  const [activeDoneCount, setActiveDoneCount] = useState<number>(0);

  // Track totals (Coding + Circuits)
  //const CODING_SLUG = "code-beg";
  //const CIRCUITS_SLUG = "circuit-beg";

  const [codeTotalSteps, setCodeTotalSteps] = useState<number>(0);
  const [codeDoneCount, setCodeDoneCount] = useState<number>(0);
  const [circuitTotalSteps, setCircuitTotalSteps] = useState<number>(0);
  const [circuitDoneCount, setCircuitDoneCount] = useState<number>(0);

  // --- UI state ---
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "completed">("current");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Weekly pacing baseline
  const [weekStartDoneStepsAll, setWeekStartDoneStepsAll] = useState<number>(0);
  const [weekKey, setWeekKey] = useState<string>(() => startOfWeekKey());

  // Completed projects (local storage)
  const [completedList, setCompletedList] = useState<CompletedProject[]>([]);

  // --- Per-project schedule stored locally ---
  const [schedule, setSchedule] = useState<ProjectSchedule>({ daysPerWeek: 3, hoursPerDay: 2 });
  const [tempSchedule, setTempSchedule] = useState<ProjectSchedule>({
    daysPerWeek: 3,
    hoursPerDay: 2,
  });

  // Load completed projects once
  useEffect(() => {
    const stored = readJson<StoredCompletedProject[]>(COMPLETED_PROJECTS_KEY) ?? [];
    const rebuilt: CompletedProject[] = [];

    for (const item of stored) {
      const proj = PROJECTS.find((p) => p.slug === item.slug);
      if (!proj) continue;

      const started = new Date(item.startedDateISO);
      const completed = new Date(item.completedDateISO);
      if (!Number.isFinite(started.getTime()) || !Number.isFinite(completed.getTime())) continue;

      rebuilt.push({
        project: proj,
        totalHours: Number.isFinite(item.totalHours) ? item.totalHours : 0,
        startedDate: started,
        completedDate: completed,
      });
    }

    setCompletedList(rebuilt);
  }, []);

  // Helper to persist completed list
  function persistCompleted(next: CompletedProject[]) {
    setCompletedList(next);

    const stored: StoredCompletedProject[] = next.map((c) => ({
      slug: c.project.slug,
      totalHours: c.totalHours,
      startedDateISO: c.startedDate.toISOString(),
      completedDateISO: c.completedDate.toISOString(),
    }));

    writeJson(COMPLETED_PROJECTS_KEY, stored);
  }

  // Load pointer + progress + nav on mount, and refresh on custom events/storage
  useEffect(() => {
    function refreshActive() {
      let ptr: { slug: string; lessonSlug: string } | null = null;

      try {
        const raw = localStorage.getItem("curio:activeLesson");
        ptr = raw ? JSON.parse(raw) : null;
      } catch {
        ptr = null;
      }

      setActivePtr(ptr);

      if (!ptr?.slug || !ptr?.lessonSlug) {
        setActiveProgress(0);
        setActiveNav(null);
        setActiveTotalSteps(0);
        setActiveDoneCount(0);
        setCodeTotalSteps(0);
        setCodeDoneCount(0);
        setCircuitTotalSteps(0);
        setCircuitDoneCount(0);
        return;
      }

      const progressKey = `curio:${ptr.slug}:${ptr.lessonSlug}:overallProgress`;

      try {
        const raw = localStorage.getItem(progressKey);
        const n = raw ? JSON.parse(raw) : 0;
        setActiveProgress(typeof n === "number" ? n : 0);
      } catch {
        setActiveProgress(0);
      }

      const navKey = `curio:${ptr.slug}:${ptr.lessonSlug}:nav`;

      try {
        const raw = localStorage.getItem(navKey);
        const nav = raw ? JSON.parse(raw) : null;

        const lessonNum = typeof nav?.lesson === "number" ? nav.lesson : parseInt(nav?.lesson, 10);
        const stepNum =
          typeof nav?.stepIndex === "number" ? nav.stepIndex : parseInt(nav?.stepIndex, 10);

        setActiveNav(
          Number.isFinite(lessonNum) && Number.isFinite(stepNum)
            ? { lesson: lessonNum, stepIndex: stepNum }
            : null
        );
      } catch {
        setActiveNav(null);
      }

      // Totals/done for the currently active lessonSlug (used for "Continue" context)
      const totalStepsKey = `curio:${ptr.slug}:${ptr.lessonSlug}:totalStepsAllLessons`;
      try {
        const raw = localStorage.getItem(totalStepsKey);
        const n = raw ? JSON.parse(raw) : 0;
        setActiveTotalSteps(typeof n === "number" && Number.isFinite(n) ? n : 0);
      } catch {
        setActiveTotalSteps(0);
      }

      const doneSetKey = `curio:${ptr.slug}:${ptr.lessonSlug}:doneSet`;
      try {
        const raw = localStorage.getItem(doneSetKey);
        const arr = raw ? JSON.parse(raw) : [];
        setActiveDoneCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setActiveDoneCount(0);
      }

      // Totals/done for BOTH tracks (used for overall progress + time estimates)
function readTotalsFor(lessonSlug: string): { total: number; done: number } {
  if (!ptr) return { total: 0, done: 0 };

  const totalKey = `curio:${ptr.slug}:${lessonSlug}:totalStepsAllLessons`;
  const doneKey  = `curio:${ptr.slug}:${lessonSlug}:doneSet`;

  let total = 0;
  let done = 0;

  try {
    const raw = localStorage.getItem(totalKey);
    const n = raw ? JSON.parse(raw) : 0;
    total = typeof n === "number" && Number.isFinite(n) ? n : 0;
  } catch {
    total = 0;
  }

  try {
    const raw = localStorage.getItem(doneKey);
    const arr = raw ? JSON.parse(raw) : [];
    done = Array.isArray(arr) ? arr.length : 0;
  } catch {
    done = 0;
  }

  return { total, done };
}


            const level = levelSuffixFromLessonSlug(ptr.lessonSlug);

            // same level as whatever the active card is showing
            const codingSlug = level ? `code-${level}` : "code-beg";
            const circuitsSlug = level ? `circuit-${level}` : "circuit-beg";

            const coding = readTotalsFor(codingSlug);
            const circuits = readTotalsFor(circuitsSlug);


      setCodeTotalSteps(coding.total);
      setCodeDoneCount(coding.done);

      setCircuitTotalSteps(circuits.total);
      setCircuitDoneCount(circuits.done);
    }

    refreshActive();

    const onActive = () => refreshActive();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "curio:activeLesson" ||
        (e.key &&
          (e.key.endsWith(":overallProgress") ||
            e.key.endsWith(":nav") ||
            e.key.endsWith(":totalStepsAllLessons") ||
            e.key.endsWith(":doneSet")))
      ) {
        refreshActive();
      }
    };

    window.addEventListener("curio:activeLesson", onActive as any);
    window.addEventListener("curio:progress", onActive as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("curio:activeLesson", onActive as any);
      window.removeEventListener("curio:progress", onActive as any);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!activePtr?.slug) return;

    const key = `curio:dashboard:schedule:${activePtr.slug}`;
    const saved = readJson<ProjectSchedule>(key);

    if (saved?.daysPerWeek && saved?.hoursPerDay) {
      setSchedule(saved);
      setTempSchedule(saved);
    }
  }, [activePtr?.slug]);

  // Use pretty label for display
  const currentLevelDisplay = useMemo(() => {
    return activePtr?.lessonSlug ? prettyLevelFromLessonSlug(activePtr.lessonSlug) : "";
  }, [activePtr]);

  // Keep raw slug label for parseHoursToNumber (beg/adv/int detection)
  const currentLevelLabelForHours = useMemo(() => {
    return activePtr?.lessonSlug ? labelizeLessonSlug(activePtr.lessonSlug) : "";
  }, [activePtr]);

  // Overall progress across Coding + Circuits (falls back to activeProgress if we don't have totals yet)
  const totalStepsAll = useMemo(() => {
    return Math.max(0, codeTotalSteps + circuitTotalSteps);
  }, [codeTotalSteps, circuitTotalSteps]);

  const doneStepsAll = useMemo(() => {
    return Math.max(0, codeDoneCount + circuitDoneCount);
  }, [codeDoneCount, circuitDoneCount]);

  const isActiveComplete = useMemo(() => {
  return !!activePtr?.slug && totalStepsAll > 0 && doneStepsAll >= totalStepsAll;
}, [activePtr?.slug, totalStepsAll, doneStepsAll]);




const currentProject = useMemo(() => {
  if (!activePtr?.slug) return null;

  // If this project is currently complete, don't show it in Current tab
  if (totalStepsAll > 0 && doneStepsAll >= totalStepsAll) return null;

  return PROJECTS.find((p) => p.slug === activePtr.slug) ?? null;
}, [activePtr, totalStepsAll, doneStepsAll]);

  // Week baseline init (local)
  useEffect(() => {
    if (!activePtr?.slug) return;

    const wk = startOfWeekKey(); // changes automatically when a new week begins
    setWeekKey(wk);

    const storageKey = `curio:${activePtr.slug}:week:${wk}:doneStart`;

    const stored = readJson<number>(storageKey);
    if (typeof stored === "number" && Number.isFinite(stored)) {
      setWeekStartDoneStepsAll(stored);
    } else {
      writeJson(storageKey, doneStepsAll);
      setWeekStartDoneStepsAll(doneStepsAll);
    }
  }, [activePtr?.slug, doneStepsAll]);

  const progressPercent = useMemo(() => {
    if (totalStepsAll > 0) {
      return Math.min(100, Math.max(0, Math.round((doneStepsAll / totalStepsAll) * 100)));
    }
    return Math.min(100, Math.max(0, Math.round(activeProgress)));
  }, [totalStepsAll, doneStepsAll, activeProgress]);

  // Total hours chosen based on range + level label + whether project has Advanced
  const estimatedHoursNumber = useMemo(() => {
    const hoursText = currentProject?.hours ?? "";
    const diffs = currentProject?.difficulties ?? [];
    return Math.max(
      1,
      parseHoursToNumber(hoursText, {
        levelLabel: currentLevelLabelForHours,
        difficulties: diffs as any,
      })
    );
  }, [currentProject, currentLevelLabelForHours]);

  // Step-based time remaining (preferred when we have step counts)
  const stepsRemainingAll = useMemo(() => {
    if (totalStepsAll <= 0) return 0;
    return Math.max(0, totalStepsAll - doneStepsAll);
  }, [totalStepsAll, doneStepsAll]);

  const hoursPerStep = useMemo(() => {
    if (totalStepsAll <= 0) return 0;
    return estimatedHoursNumber / totalStepsAll;
  }, [estimatedHoursNumber, totalStepsAll]);

  const codeStepsRemaining = useMemo(() => {
    return codeTotalSteps > 0 ? Math.max(0, codeTotalSteps - codeDoneCount) : 0;
  }, [codeTotalSteps, codeDoneCount]);

  const circuitStepsRemaining = useMemo(() => {
    return circuitTotalSteps > 0 ? Math.max(0, circuitTotalSteps - circuitDoneCount) : 0;
  }, [circuitTotalSteps, circuitDoneCount]);

  const hoursRemaining = useMemo(() => {
    if (hoursPerStep <= 0) {
      return Math.max(0, estimatedHoursNumber - Math.round((estimatedHoursNumber * progressPercent) / 100));
    }
    return stepsRemainingAll * hoursPerStep;
  }, [hoursPerStep, stepsRemainingAll, estimatedHoursNumber, progressPercent]);

  const codeHoursRemaining = useMemo(() => {
    if (hoursPerStep <= 0) return 0;
    return codeStepsRemaining * hoursPerStep;
  }, [codeStepsRemaining, hoursPerStep]);

  const circuitHoursRemaining = useMemo(() => {
    if (hoursPerStep <= 0) return 0;
    return circuitStepsRemaining * hoursPerStep;
  }, [circuitStepsRemaining, hoursPerStep]);

  // Approx hours completed for display
  const hoursCompletedApprox = useMemo(() => {
    if (totalStepsAll > 0 && hoursPerStep > 0) {
      return Math.round(Math.max(0, estimatedHoursNumber - hoursRemaining));
    }
    return Math.round((estimatedHoursNumber * progressPercent) / 100);
  }, [totalStepsAll, hoursPerStep, estimatedHoursNumber, hoursRemaining, progressPercent]);

  // Ensure "startedAt" exists once a project becomes active
  useEffect(() => {
    if (!activePtr?.slug) return;

    const key = STARTED_AT_KEY(activePtr.slug);
    const existing = readJson<string>(key);
    if (!existing) {
      writeJson(key, new Date().toISOString());
    }
  }, [activePtr?.slug]);

  // Auto-move project to Completed when (done/total)=1, AND total>0
useEffect(() => {
  if (!activePtr?.slug) return;
  if (!currentProject) return;

  const slug = activePtr.slug;
  const inCompleted = completedList.some((c) => c.project.slug === slug);

  // If not complete anymore, REMOVE from completed
  if (!isActiveComplete) {
    if (inCompleted) {
      persistCompleted(completedList.filter((c) => c.project.slug !== slug));
    }
    return;
  }

  // If complete, ADD to completed (if missing)
  if (!inCompleted) {
    const startedISO = readJson<string>(STARTED_AT_KEY(slug));
    const startedDate = startedISO ? new Date(startedISO) : new Date();

    const nextEntry: CompletedProject = {
      project: currentProject,
      totalHours: Math.max(0, hoursCompletedApprox),
      startedDate: Number.isFinite(startedDate.getTime()) ? startedDate : new Date(),
      completedDate: new Date(),
    };

    persistCompleted([nextEntry, ...completedList]);
  }

  // Optional: clear pointer so it doesn't show as "current"
  try {
    localStorage.removeItem("curio:activeLesson");
    window.dispatchEvent(new Event("curio:activeLesson"));
  } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activePtr?.slug, isActiveComplete, currentProject, hoursCompletedApprox, completedList]);


  const calculateCompletionDate = () => {
    const remainingHours = Math.max(0, hoursRemaining);
    const hoursPerWeek = Math.max(0.5, schedule.daysPerWeek * schedule.hoursPerDay);
    const weeksNeeded = Math.ceil(remainingHours / hoursPerWeek);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + weeksNeeded * 7);
    return completionDate.toLocaleDateString();
  };

  const calculateStepsDue = () => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    const hoursPerWeek = Math.max(0, schedule.daysPerWeek * schedule.hoursPerDay);

    const stepsTargetThisWeek =
      hoursPerStep > 0 ? Math.max(0, Math.round(hoursPerWeek / hoursPerStep)) : 0;

    const stepsDoneThisWeek = Math.max(0, doneStepsAll - weekStartDoneStepsAll);

    const remainingTarget = Math.max(0, stepsTargetThisWeek - stepsDoneThisWeek);

    const stepsDue = Math.min(stepsRemainingAll, remainingTarget);

    return {
      stepsDue,
      stepsTargetThisWeek,
      stepsDoneThisWeek,
      dueDate: endOfWeek.toLocaleDateString(),
      weekKey,
    };
  };

  const handleSaveSchedule = () => {
    if (activePtr?.slug) {
      writeJson(`curio:dashboard:schedule:${activePtr.slug}`, tempSchedule);
      setSchedule(tempSchedule);
    }
    setShowScheduleModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/account-setup/login");
  };

  const handleContinue = () => {
    if (!activePtr?.slug || !activePtr?.lessonSlug) return;
    router.push(`/projects/${activePtr.slug}/lessons/${activePtr.lessonSlug}`);
  };

  const lastWatchedText = useMemo(() => {
    if (!activeNav) return "—";
    return `Lesson ${activeNav.lesson}, Step ${activeNav.stepIndex + 1}`;
  }, [activeNav]);

  const upNextText = useMemo(() => {
    if (!activeNav) return "—";
    return `Lesson ${activeNav.lesson}, Step ${activeNav.stepIndex + 2}`;
  }, [activeNav]);

  const dueInfo = useMemo(() => calculateStepsDue(), [
    schedule.daysPerWeek,
    schedule.hoursPerDay,
    hoursPerStep,
    doneStepsAll,
    weekStartDoneStepsAll,
    stepsRemainingAll,
    weekKey,
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <div
        className={[
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50",
          "transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab("current");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-sky-50 text-sky-600 rounded-lg"
            >
              <FolderOpen className="w-5 h-5" />
              <span>My Projects</span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <Compass className="w-5 h-5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <BarChart className="w-5 h-5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-sky-600 hover:text-sky-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>

              <h1 className="text-lg font-semibold text-gray-900">STEM Project Lab</h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">

              {/* Admin panel button */} // possibly add a check for isAdmin here later
              <button
                onClick={() => router.push('/admin')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
                <span>Admin Panel</span>
              </button>

              <span className="text-gray-600">Welcome, Student!</span>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center hover:bg-sky-200 transition-colors"
                  aria-label="Open profile menu"
                >
                  <span className="text-sky-700 font-medium">S</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                      <span>User Information</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <BarChart className="w-5 h-5 text-gray-600" />
                      <span>My Progress</span>
                    </button>
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close profile menu when clicking anywhere else */}
          {profileMenuOpen && (
            <button
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setProfileMenuOpen(false)}
              aria-hidden
            />
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={() => setActiveTab("current")}
              className={[
                "pb-2 border-b-2 transition-colors",
                activeTab === "current"
                  ? "border-sky-700 text-sky-800"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <h2 className="text-xl font-semibold">Your Current Project</h2>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={[
                "pb-2 border-b-2 transition-colors",
                activeTab === "completed"
                  ? "border-sky-700 text-sky-800"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <h2 className="text-xl font-semibold">Completed Projects</h2>
            </button>
          </div>

          {/* CURRENT TAB */}
          {activeTab === "current" ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              {!currentProject ? (
                <div className="text-gray-700">
                  No active project yet. Open a project and start a lesson — then come back here.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left Side */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Learning</h3>

                    <div
                      className="relative mb-4 rounded-xl overflow-hidden group cursor-pointer"
                      onClick={handleContinue}
                      role="button"
                      aria-label="Continue current lesson"
                    >
                      <img
                        src={currentProject.image}
                        alt={currentProject.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-sky-600 ml-1" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-sky-50 rounded-lg p-4">
                        <div className="text-sm text-sky-600 mb-1">Current Level</div>
                        <div className="text-gray-900 font-medium">{currentLevelDisplay || "—"}</div>
                      </div>

                      <div className="bg-sky-50 rounded-lg p-4">
                        <div className="text-sm text-sky-600 mb-1">Last Seen</div>
                        <div className="text-gray-900 font-medium">{lastWatchedText}</div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                        <div className="text-sm text-orange-700">
                          <strong>{dueInfo.stepsDue} steps due</strong> by {dueInfo.dueDate}
                        </div>
                        <div className="text-xs text-orange-700/80 mt-1">
                          This week target: {dueInfo.stepsTargetThisWeek} • Done: {dueInfo.stepsDoneThisWeek} • Week:{" "}
                          {dueInfo.weekKey}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div>
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {currentProject.title}
                        </h3>
                        <p className="text-gray-600">{currentProject.description}</p>
                      </div>

                      <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm whitespace-nowrap">
                        {currentProject.category}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Overall Progress</span>
                        <span className="text-sm">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-sky-800 to-sky-600 h-3 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-sky-600" />
                          <span className="text-sm text-gray-600">Estimated Time</span>
                        </div>

                        <div className="text-xl">
                          {hoursCompletedApprox}h{" "}
                          <span className="text-gray-500">/ ~{estimatedHoursNumber}h</span>
                        </div>

                        {totalStepsAll > 0 ? (
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div>
                              ~{Math.ceil(hoursRemaining)}h left ({stepsRemainingAll} steps)
                            </div>
                            <div className="text-gray-500">
                              Coding: ~{Math.ceil(codeHoursRemaining)}h left ({codeStepsRemaining} steps)
                            </div>
                            <div className="text-gray-500">
                              Circuits: ~{Math.ceil(circuitHoursRemaining)}h left ({circuitStepsRemaining} steps)
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-sky-600" />
                          <span className="text-sm text-gray-600">Study Schedule</span>
                        </div>
                        <div className="text-xl">{schedule.daysPerWeek} days/week</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-sky-600" />
                          <span className="text-sm text-gray-600">Est. Finish</span>
                        </div>
                        <div className="text-sm">{calculateCompletionDate()}</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-sky-600" />
                          <span className="text-sm text-gray-600">Daily Hours</span>
                        </div>
                        <div className="text-xl">{schedule.hoursPerDay}h/day</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTempSchedule(schedule);
                        setShowScheduleModal(true);
                      }}
                      className="w-full px-4 py-2 bg-sky-300 text-white rounded-lg hover:bg-sky-700 transition-colors"
                    >
                      Edit Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* COMPLETED TAB */
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="space-y-4">
                {completedList.length === 0 ? (
                  <div className="text-gray-600">No completed projects yet.</div>
                ) : (
                  completedList.map((completed: CompletedProject, index: number) => {
                    const daysTaken = daysBetween(completed.startedDate, completed.completedDate);

                    return (
                      <div
                        key={`${completed.project.id}-${index}`}
                        className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 border border-gray-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer"
                      >
                        <img
                          src={completed.project.image}
                          alt={completed.project.title}
                          className="w-full md:w-32 h-48 md:h-32 object-cover rounded-lg"
                        />

                        <div className="flex-1 w-full">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {completed.project.title}
                            </h3>

                            <div className="flex flex-wrap gap-2 justify-end">
                              {(completed.project.difficulties ?? []).map((level) => (
                                <span
                                  key={level}
                                  className={[
                                    "px-3 py-1 rounded-full text-sm whitespace-nowrap",
                                    level === "Beginner"
                                      ? "bg-green-100 text-green-700"
                                      : level === "Intermediate"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700",
                                  ].join(" ")}
                                >
                                  {level}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-4">{completed.project.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Time Spent</div>
                              <div className="text-sm">{completed.totalHours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Duration</div>
                              <div className="text-sm">{daysTaken} days</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Started</div>
                              <div className="text-sm">{completed.startedDate.toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Completed</div>
                              <div className="text-sm">{completed.completedDate.toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Available Projects */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <h3 className="flex-1 text-gray-900 font-semibold">{project.title}</h3>

                    <div className="flex flex-wrap gap-1 justify-end">
                      {(project.difficulties ?? []).map((level) => (
                        <span
                          key={level}
                          className={[
                            "px-2 py-1 rounded text-xs whitespace-nowrap",
                            level === "Beginner"
                              ? "bg-green-100 text-green-700"
                              : level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700",
                          ].join(" ")}
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{project.hours}</span>
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors inline-flex items-center"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects Coming Soon</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unavailableProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <h3 className="flex-1 text-gray-900 font-semibold">{project.title}</h3>

                    <div className="flex flex-wrap gap-1 justify-end">
                      {(project.difficulties ?? []).map((level) => (
                        <span
                          key={level}
                          className={[
                            "px-2 py-1 rounded text-xs whitespace-nowrap",
                            level === "Beginner"
                              ? "bg-green-100 text-green-700"
                              : level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700",
                          ].join(" ")}
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{project.hours}</span>
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors inline-flex items-center"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Project Schedule</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Days per week</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={tempSchedule.daysPerWeek}
                  onChange={(e) =>
                    setTempSchedule({
                      ...tempSchedule,
                      daysPerWeek: parseInt(e.target.value || "1", 10),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Hours per day</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={tempSchedule.hoursPerDay}
                  onChange={(e) =>
                    setTempSchedule({
                      ...tempSchedule,
                      hoursPerDay: parseFloat(e.target.value || "1"),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}