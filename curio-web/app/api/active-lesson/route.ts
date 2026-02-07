import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const projectSlug = String(body?.projectSlug || "");
    const lessonSlug = String(body?.lessonSlug || "");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ error: "Missing projectSlug/lessonSlug" }, { status: 400 });
    }

    // Ensure parent exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, role: "STUDENT" },
    });

    // One row per user
    const saved = await prisma.activeLesson.upsert({
      where: { userId },
      update: { projectSlug, lessonSlug },
      create: { userId, projectSlug, lessonSlug },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const row = await prisma.activeLesson.findUnique({
      where: { userId },
      select: { projectSlug: true, lessonSlug: true, updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      active: row
        ? { ...row, updatedAt: row.updatedAt.toISOString() }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
