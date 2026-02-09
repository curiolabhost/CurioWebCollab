import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
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

    const row = await prisma.lessonState.findUnique({
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug },
      },
      select: { blanks: true },
    });

    const blanks =
      row?.blanks && typeof row.blanks === "object" ? (row.blanks as any) : {};

    return NextResponse.json({ ok: true, userId, blanks });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
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

    const body = await req.json().catch(() => ({}));
    const patch =
      body?.patch && typeof body.patch === "object" ? (body.patch as any) : null;

    if (!patch) {
      return NextResponse.json({ error: "Missing patch" }, { status: 400 });
    }

    // Ensure the foreign-key parent exists (User row keyed by Clerk userId)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, role: "STUDENT" },
    });

    // Load existing
    const existing = await prisma.lessonState.findUnique({
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug },
      },
      select: { blanks: true },
    });

    const existingBlanks =
      existing?.blanks && typeof existing.blanks === "object"
        ? (existing.blanks as Record<string, any>)
        : {};

    // CORE RULE: merge + delete null keys
    const merged: Record<string, any> = { ...existingBlanks, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v === null) delete merged[k];
    }

    const saved = await prisma.lessonState.upsert({
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug },
      },
      update: { blanks: merged },
      create: { userId, projectSlug, lessonSlug, blanks: merged },
      select: { blanks: true },
    });

    return NextResponse.json({ ok: true, userId, blanks: saved.blanks });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
