import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // ✅

export async function POST(req: Request) {
  try {
    const { userId } = await auth(); // ✅
    if (!userId) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json();
    const { projectSlug, lessonSlug, stepKey, status } = body || {};

    if (!projectSlug || !lessonSlug || !stepKey || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ensure the foreign-key parent exists (User row keyed by Clerk userId)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, role: "STUDENT" },
    });

    const saved = await prisma.lessonProgress.upsert({
      where: {
        userId_projectSlug_lessonSlug_stepKey: {
          userId,
          projectSlug,
          lessonSlug,
          stepKey,
        },
      },
      update: { status },
      create: { userId, projectSlug, lessonSlug, stepKey, status },
    });

    // ✅ include userId so you can verify instantly in the response
    return NextResponse.json({ ok: true, userId, saved });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth(); // ✅
    if (!userId) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectSlug = url.searchParams.get("projectSlug");
    const lessonSlug = url.searchParams.get("lessonSlug");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json(
        { error: "Missing projectSlug/lessonSlug" },
        { status: 400 }
      );
    }

    const rows = await prisma.lessonProgress.findMany({
      where: { userId, projectSlug, lessonSlug },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, userId, rows });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
