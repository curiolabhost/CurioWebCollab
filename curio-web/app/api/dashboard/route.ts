// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

export const dynamic = "force-dynamic";

function isUnauthError(e: any) {
  const msg = String(e?.message ?? e ?? "").toLowerCase();
  return msg.includes("unauth");
}

export async function GET() {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

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

    // schedule
    const schedules = await db.projectSchedule.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      distinct: ["projectSlug"],
      select: { projectSlug: true, daysPerWeek: true, hoursPerDay: true },
    });

    const scheduleByProject: Record<string, { daysPerWeek: number; hoursPerDay: number }> = {};
    for (const s of schedules) {
      scheduleByProject[s.projectSlug] = { daysPerWeek: s.daysPerWeek, hoursPerDay: s.hoursPerDay };
    }

    return NextResponse.json(
      {
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
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e: any) {
    if (isUnauthError(e)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("GET /api/dashboard error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}