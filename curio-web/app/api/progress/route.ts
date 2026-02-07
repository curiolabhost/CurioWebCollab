import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMP user for testing (until Clerk/Auth is added)
const TEMP_USER_ID = "dev-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectSlug, lessonSlug, stepKey, status } = body || {};

    if (!projectSlug || !lessonSlug || !stepKey || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    //  Ensure the foreign-key parent exists
    await prisma.user.upsert({
      where: { id: TEMP_USER_ID },
      update: {},
      create: { id: TEMP_USER_ID, role: "STUDENT" },
    });

    const saved = await prisma.lessonProgress.upsert({
      where: {
        userId_projectSlug_lessonSlug_stepKey: {
          userId: TEMP_USER_ID,
          projectSlug,
          lessonSlug,
          stepKey,
        },
      },
      update: { status },
      create: { userId: TEMP_USER_ID, projectSlug, lessonSlug, stepKey, status },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e: any) {
    // helpful debug in terminal
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectSlug = url.searchParams.get("projectSlug");
    const lessonSlug = url.searchParams.get("lessonSlug");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ error: "Missing projectSlug/lessonSlug" }, { status: 400 });
    }

    // Ensure user exists (optional, but keeps things consistent)
    await prisma.user.upsert({
      where: { id: TEMP_USER_ID },
      update: {},
      create: { id: TEMP_USER_ID, role: "STUDENT" },
    });

    const rows = await prisma.lessonProgress.findMany({
      where: { userId: TEMP_USER_ID, projectSlug, lessonSlug },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
