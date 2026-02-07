import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const projectSlug = String(body?.projectSlug || "");

    if (!projectSlug) {
      return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
    }

    // Ensure parent exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, role: "STUDENT" },
    });

    // One row per (user, project). If already exists, don't overwrite startedAt.
    const saved = await prisma.projectStart.upsert({
      where: { userId_projectSlug: { userId, projectSlug } },
      update: {},
      create: { userId, projectSlug },
      select: { projectSlug: true, startedAt: true },
    });

    return NextResponse.json({
      ok: true,
      saved: { projectSlug: saved.projectSlug, startedAt: saved.startedAt.toISOString() },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
