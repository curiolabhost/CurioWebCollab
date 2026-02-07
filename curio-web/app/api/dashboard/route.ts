// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 2) active pointer (one row per user)
  const active = await db.activeLesson.findUnique({
    where: { userId },
    select: { projectSlug: true, lessonSlug: true, updatedAt: true },
  });

  // 3) last-seen (newest location row for this user)
  const lastSeen = await db.lessonLocation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      projectSlug: true,
      lessonSlug: true,
      lessonIndex: true,
      stepIndex: true,
      updatedAt: true,
    },
  });

  // 4) startedAt per project
  const starts = await db.projectStart.findMany({
    where: { userId },
    select: { projectSlug: true, startedAt: true },
  });

  const startedAtByProject: Record<string, string> = {};
  for (const s of starts) startedAtByProject[s.projectSlug] = s.startedAt.toISOString();

  // 5) completion events
  const completions = await db.projectCompletion.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    select: { projectSlug: true, completedAt: true, totalStepsAtCompletion: true },
  });

  // (Schedule is part of "dashboard should be backed" too)
  const schedules = await db.projectSchedule.findMany({
    where: { userId },
    select: { projectSlug: true, daysPerWeek: true, hoursPerDay: true, updatedAt: true },
  });

  const scheduleByProject: Record<string, { daysPerWeek: number; hoursPerDay: number }> = {};
  for (const s of schedules) {
    scheduleByProject[s.projectSlug] = { daysPerWeek: s.daysPerWeek, hoursPerDay: s.hoursPerDay };
  }

  return NextResponse.json({
    active: active
      ? {
          projectSlug: active.projectSlug,
          lessonSlug: active.lessonSlug,
          updatedAt: active.updatedAt.toISOString(),
        }
      : null,

    lastSeen: lastSeen
      ? {
          projectSlug: lastSeen.projectSlug,
          lessonSlug: lastSeen.lessonSlug,
          lessonIndex: lastSeen.lessonIndex,
          stepIndex: lastSeen.stepIndex,
          updatedAt: lastSeen.updatedAt.toISOString(),
        }
      : null,

    startedAtByProject,

    completions: completions.map((c) => ({
      projectSlug: c.projectSlug,
      completedAt: c.completedAt.toISOString(),
      totalStepsAtCompletion: c.totalStepsAtCompletion,
    })),

    scheduleByProject,
  });
}
