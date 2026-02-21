// app/api/admin/students/[id]/route.ts
// GET: student details + all projects with progress (for projects with any progress, show level-specific steps done + total)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { levelFromLessonSlug, getTotalsForProjectLevel } from "@/src/lesson-core/projectStepRegistry";

/** Normalize DB lessonSlug to canonical form (code-beg, circuit-beg, etc.). */
function toCanonicalLessonSlug(lessonSlug: string): string {
  const last = (lessonSlug || "").split("/").pop() || "";
  const lower = last.toLowerCase();
  if (lower.startsWith("code-") || lower.startsWith("circuit-")) return lower;
  return lessonSlug.toLowerCase();
}

function prettySlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const a = (firstName?.[0] ?? "").toUpperCase();
  const b = (lastName?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}`;
  return (email?.[0] ?? "U").toUpperCase();
}

type ProjectDto = {
  slug: string;
  name: string;
  status: "completed" | "in_progress";
  lastActiveAt: string | null; // ISO
  stepsDone: number;
  totalSteps: number;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: "forbidden" }, { status: gate.status });

  const { id } = await ctx.params;
  const userId = id;

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true, 
    profile: { select: { grade: true, school: true } },
    activeLesson: { select: { projectSlug: true, lessonSlug: true, updatedAt: true } },
    projectStarts: { select: { projectSlug: true, startedAt: true }, orderBy: { startedAt: "desc" } },
    completions: { select: { projectSlug: true, completedAt: true } },
  },
});


  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Projects list = distinct projectSlugs the student has started
  const startedSlugs = Array.from(new Set(user.projectStarts.map((p) => p.projectSlug)));

  // If the student has an activeLesson on a project they haven’t “started” yet, include it too.
  if (user.activeLesson?.projectSlug && !startedSlugs.includes(user.activeLesson.projectSlug)) {
    startedSlugs.unshift(user.activeLesson.projectSlug);
  }

  const doneByProjectLesson =
    startedSlugs.length > 0
      ? await prisma.lessonProgress.groupBy({
          by: ["projectSlug", "lessonSlug"],
          where: { userId, projectSlug: { in: startedSlugs }, status: "done" },
          _count: { _all: true },
        })
      : [];

  const doneByLessonLookup = new Map<string, number>();
  for (const row of doneByProjectLesson) {
    const canonical = toCanonicalLessonSlug(row.lessonSlug);
    const key = `${row.projectSlug}|${canonical}`;
    const existing = doneByLessonLookup.get(key) ?? 0;
    doneByLessonLookup.set(key, existing + row._count._all);
  }

  // Last activity per project: max(updatedAt) from LessonProgress (fallback to activeLesson.updatedAt)
  const lastActiveRows = startedSlugs.length
    ? await prisma.lessonProgress.groupBy({
        by: ["projectSlug"],
        where: { userId, projectSlug: { in: startedSlugs } },
        _max: { updatedAt: true },
      })
    : [];

  const lastActiveByProject = new Map<string, string | null>();
  for (const row of lastActiveRows) {
    lastActiveByProject.set(row.projectSlug, row._max.updatedAt ? row._max.updatedAt.toISOString() : null);
  }

  const completedSet = new Set(user.completions.map((c) => c.projectSlug));

  const projects: ProjectDto[] = startedSlugs.map((slug) => {
    const lpMax = lastActiveByProject.get(slug) ?? null;
    const activeFallback =
      user.activeLesson?.projectSlug === slug ? user.activeLesson.updatedAt.toISOString() : null;

    const level =
      user.activeLesson?.projectSlug === slug
        ? levelFromLessonSlug(user.activeLesson.lessonSlug)
        : "beg";
    const codingSlug = `code-${level}`;
    const circuitsSlug = `circuit-${level}`;
    const codeDone = doneByLessonLookup.get(`${slug}|${codingSlug}`) ?? 0;
    const circuitDone = doneByLessonLookup.get(`${slug}|${circuitsSlug}`) ?? 0;
    const levelStepsDone = codeDone + circuitDone;
    // Use level total (matches dashboard: code-beg + circuit-beg for beginner = 41 steps)
    const totalSteps = getTotalsForProjectLevel(slug, level as any).total;

    const stepsDone = levelStepsDone;

    return {
      slug,
      name: prettySlug(slug),
      status: completedSet.has(slug) ? "completed" : "in_progress",
      lastActiveAt: lpMax ?? activeFallback,
      stepsDone,
      totalSteps,
    };
  });

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || user.email || "Student";

  return NextResponse.json({
    student: {
      id: user.id,
      name: displayName,
      email: user.email ?? "",
      avatar: initials(user.firstName, user.lastName, user.email),
      createdAt: user.createdAt.toISOString(), 
      grade: user.profile?.grade ?? null,
      school: user.profile?.school ?? null,
      activeProjectSlug: user.activeLesson?.projectSlug ?? null,
      activeLessonSlug: user.activeLesson?.lessonSlug ?? null,
      lastActiveAt: user.activeLesson?.updatedAt ? user.activeLesson.updatedAt.toISOString() : null,
      projectsStarted: startedSlugs.length,
      projectsCompleted: completedSet.size,
      projects,
    },
  });
}
