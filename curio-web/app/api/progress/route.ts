import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ensureDbUser } from "@/lib/authz";

type ProgressStatus = "done" | "todo";

export async function POST(req: Request) {
  try {
    const dbUser = await ensureDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const userId = dbUser.id;

    const body = await req.json();
    const { projectSlug, lessonSlug, stepKey, status } = body || {};

    if (!projectSlug || !lessonSlug || !stepKey || status == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Normalize status (accept DONE/TODO/etc but store lowercase)
    const rawStatus = String(status || "").toLowerCase();
    if (rawStatus !== "done" && rawStatus !== "todo") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const normalizedStatus = rawStatus as ProgressStatus;

    const saved = await prisma.lessonProgress.upsert({
      where: {
        userId_projectSlug_lessonSlug_stepKey: {
          userId,
          projectSlug,
          lessonSlug,
          stepKey,
        },
      },
      update: { status: normalizedStatus },
      create: {
        userId,
        projectSlug,
        lessonSlug,
        stepKey,
        status: normalizedStatus,
      },
    });

    return NextResponse.json({ ok: true, userId, saved });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
