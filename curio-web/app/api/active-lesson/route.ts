// This route allows the frontend to save and retrieve the user's currently active lesson. It's used to restore their place when they return to the app.
// app/api/active-lesson/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

export async function POST(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const body = await req.json().catch(() => ({}));
    const projectSlug = String(body?.projectSlug || "");
    const lessonSlug = String(body?.lessonSlug || "");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ error: "Missing projectSlug/lessonSlug" }, { status: 400 });
    }

    // One row per user
    const saved = await prisma.activeLesson.upsert({
      where: { userId },
      update: { projectSlug, lessonSlug },
      create: { userId, projectSlug, lessonSlug },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e: any) {
    // If requireDbUser throws "Unauthenticated", treat as 401
    if (String(e?.message ?? "").toLowerCase().includes("unauth")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const row = await prisma.activeLesson.findUnique({
      where: { userId },
      select: { projectSlug: true, lessonSlug: true, updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      active: row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null,
    });
  } catch (e: any) {
    if (String(e?.message ?? "").toLowerCase().includes("unauth")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}