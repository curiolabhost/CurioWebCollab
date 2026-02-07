// app/api/progress/summary/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
