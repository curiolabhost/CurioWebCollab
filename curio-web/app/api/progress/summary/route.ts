// app/api/progress/summary/route.ts
// GET: summary of progress for a project (e.g. count of done steps per lessonSlug)
// This is used to power the progress summary on the project dashboard, and can be used elsewhere as needed. It accepts a projectSlug and list of lessonSlugs, and returns a count of "done" steps for each lessonSlug for the current user.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";
import { ensureDbUser } from "@/lib/authz"; // <-- ADD

export async function GET(req: Request) {
  // This both enforces auth AND syncs email/first/last into your DB User row
  const dbUser = await ensureDbUser(); // <-- ADD
  if (!dbUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 }); // <-- ADD

  const userId = dbUser.id;

  const url = new URL(req.url);
  const projectSlug = url.searchParams.get("projectSlug") || "";
  const lessonSlugsRaw = url.searchParams.get("lessonSlugs") || "";
  const lessonSlugs = lessonSlugsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!projectSlug || lessonSlugs.length === 0) {
    return NextResponse.json({ doneByLessonSlug: {} });
  }

  // Count "done" steps per lessonSlug
  const rows = await db.lessonProgress.findMany({
    where: {
      userId,
      projectSlug,
      lessonSlug: { in: lessonSlugs },
      status: "done",
    },
    select: { lessonSlug: true },
  });

  const doneByLessonSlug: Record<string, number> = {};
  for (const slug of lessonSlugs) doneByLessonSlug[slug] = 0;
  for (const r of rows) doneByLessonSlug[r.lessonSlug] = (doneByLessonSlug[r.lessonSlug] ?? 0) + 1;

  return NextResponse.json({ doneByLessonSlug });
}
