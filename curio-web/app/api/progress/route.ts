import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TEMP USER until auth is added
const TEMP_USER_ID = "dev-user";

export async function POST(req: Request) {
  const body = await req.json();
  const { projectSlug, lessonSlug, stepKey, status } = body || {};

  if (!projectSlug || !lessonSlug || !stepKey || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

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
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectSlug = url.searchParams.get("projectSlug");
  const lessonSlug = url.searchParams.get("lessonSlug");

  if (!projectSlug || !lessonSlug) {
    return NextResponse.json({ error: "Missing projectSlug/lessonSlug" }, { status: 400 });
  }

  const rows = await prisma.lessonProgress.findMany({
    where: { userId: TEMP_USER_ID, projectSlug, lessonSlug },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, rows });
}
