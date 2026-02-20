// app/api/admin/students/route.ts
// GET: list of all students with progress summary (for projects with any progress, show level-specific steps done + total)

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { getTotalStepsForLevel, levelFromLessonSlug } from "@/src/lesson-core/projectStepRegistry";

/** Normalize DB lessonSlug to canonical form (code-beg, circuit-beg, etc.) for lookup. */
function toCanonicalLessonSlug(lessonSlug: string): string {
  const last = (lessonSlug || "").split("/").pop() || "";
  const lower = last.toLowerCase();
  if (lower.startsWith("code-") || lower.startsWith("circuit-")) return lower;
  return lessonSlug.toLowerCase();
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const a = (firstName?.[0] ?? "").toUpperCase();
  const b = (lastName?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}`;
  return (email?.[0] ?? "U").toUpperCase();
}

function prettySlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchClerkIdentity(userId: string): Promise<{
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}> {
  try {
    // Support both callable and object forms across Clerk versions.
    const clerk: any =
      typeof (clerkClient as any) === "function" ? await (clerkClient as any)() : (clerkClient as any);

    const u = await clerk.users.getUser(userId);

    const email =
      u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u.emailAddresses?.[0]?.emailAddress ??
      null;

    return {
      email,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
    };
  } catch (err: any) {
    // Legacy/test IDs often aren't real Clerk IDs -> expect 404 here; don't spam logs.
    return { email: null, firstName: null, lastName: null };
  }
}

export async function GET() {
  // Enforce admin auth
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? "unauthorized" : "forbidden" },
      { status: gate.status }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      // If you want ALL students (even brand new with no progress), remove this OR block.
      OR: [{ projectStarts: { some: {} } }, { activeLesson: { isNot: null } }],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,

      profile: { select: { grade: true, school: true } },

      activeLesson: {
        select: { projectSlug: true, lessonSlug: true, updatedAt: true },
      },

      projectStarts: {
        orderBy: { startedAt: "desc" },
        select: { projectSlug: true, startedAt: true },
      },

      completions: {
        select: { projectSlug: true, completedAt: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Optional: backfill identity from Clerk ONLY for real Clerk IDs.
  // This avoids 404 spam for legacy/test ids and keeps the endpoint fast.
  const needsBackfill = users.filter((u) => {
    if (!u.id.startsWith("user_")) return false; // skip legacy/test ids
    const fn = (u.firstName ?? "").trim();
    const ln = (u.lastName ?? "").trim();
    const em = (u.email ?? "").trim();
    return ((!fn && !ln) || !em);
  });

  for (const u of needsBackfill) {
    const ident = await fetchClerkIdentity(u.id);
    if (ident.email || ident.firstName || ident.lastName) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          email: ident.email ?? undefined, // don't overwrite with null
          firstName: ident.firstName ?? null,
          lastName: ident.lastName ?? null,
        },
      });

      // Update response objects so the list reflects changes immediately
      const target = users.find((x) => x.id === u.id);
      if (target) {
        target.email = ident.email ?? target.email;
        target.firstName = ident.firstName;
        target.lastName = ident.lastName;
      }
    }
  }

  const currentProjectByUserId: Record<string, string | null> = {};
  for (const u of users) {
    currentProjectByUserId[u.id] = u.activeLesson?.projectSlug ?? u.projectStarts?.[0]?.projectSlug ?? null;
  }

  const userIds = users.map((u) => u.id);
  const projectSlugs = Array.from(new Set(Object.values(currentProjectByUserId).filter((s): s is string => !!s)));

  const doneByUserProjectLesson =
    projectSlugs.length > 0
      ? await prisma.lessonProgress.groupBy({
          by: ["userId", "projectSlug", "lessonSlug"],
          where: {
            userId: { in: userIds },
            projectSlug: { in: projectSlugs },
            status: "done",
          },
          _count: { _all: true },
        })
      : [];

  // Aggregate by userId|projectSlug|canonicalLessonSlug (e.g. code-beg, circuit-beg)
  // so we match regardless of DB format (code-beg vs electric-status-board/code-beg)
  const doneByLessonLookup = new Map<string, number>();
  for (const row of doneByUserProjectLesson) {
    const canonical = toCanonicalLessonSlug(row.lessonSlug);
    const key = `${row.userId}|${row.projectSlug}|${canonical}`;
    const existing = doneByLessonLookup.get(key) ?? 0;
    doneByLessonLookup.set(key, existing + row._count._all);
  }

  const students = users.map((u) => {
    const currentProjectSlug = currentProjectByUserId[u.id];

    // (Legacy placeholder — you can delete this later)
    const startedCount = u.projectStarts.length;
    const completedCount = u.completions.length;
    const progress = startedCount === 0 ? 0 : Math.min(100, Math.round((completedCount / startedCount) * 100));

    // Dashboard formula: level-specific total (code-{level} + circuit-{level}) = ~41 for beg.
    // Always use getTotalStepsForLevel when we have a project so admin matches dashboard.
    const level = levelFromLessonSlug(u.activeLesson?.lessonSlug);
    const codingSlug = `code-${level}`;
    const circuitsSlug = `circuit-${level}`;

    const codeDone = currentProjectSlug ? doneByLessonLookup.get(`${u.id}|${currentProjectSlug}|${codingSlug}`) ?? 0 : 0;
    const circuitDone = currentProjectSlug
      ? doneByLessonLookup.get(`${u.id}|${currentProjectSlug}|${circuitsSlug}`) ?? 0
      : 0;

    const stepsDone = codeDone + circuitDone;

    // Use level total (matches dashboard: code-beg + circuit-beg for beginner = 41 steps)
    const totalStepsFinal = currentProjectSlug ? getTotalStepsForLevel(currentProjectSlug, level) : 0;

    const grade = u.profile?.grade ?? null;
    const school = u.profile?.school ?? null;

    const lastActiveAt = u.activeLesson?.updatedAt ?? null;
    const currentLessonSlug = u.activeLesson?.lessonSlug ?? null;

    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    const displayName = fullName || u.email || "Student";

    // NEW: needsIdentity robust check (requires either a real email or any name)
    const email = (u.email ?? "").trim();
    const hasRealEmail = email.length > 3 && email.includes("@");
    const hasName = !!((u.firstName ?? "").trim() || (u.lastName ?? "").trim());
    const needsIdentity = !hasRealEmail && !hasName;

    return {
      id: u.id,
      name: displayName,
      email: u.email || "",
      avatar: initials(u.firstName, u.lastName, u.email),

      grade,
      school,

      currentProject: currentProjectSlug ? { slug: currentProjectSlug, title: prettySlug(currentProjectSlug) } : null,

      currentLessonSlug,
      lastActiveAt,

      stepsDone,
      totalSteps: totalStepsFinal,

      // keep for now
      progress,

      // NEW
      needsIdentity,
    };
  });

  return NextResponse.json({ students });
}