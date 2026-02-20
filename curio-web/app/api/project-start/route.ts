import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

function isUnauthError(e: any) {
  const msg = String(e?.message ?? e ?? "").toLowerCase();
  return msg.includes("unauth");
}

export async function POST(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const body = await req.json().catch(() => ({}));
    const projectSlug = String(body?.projectSlug || "");

    if (!projectSlug) {
      return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
    }

    // One row per (user, project). If already exists, don't overwrite startedAt.
    const saved = await prisma.projectStart.upsert({
      where: { userId_projectSlug: { userId, projectSlug } },
      update: {},
      create: { userId, projectSlug },
      select: { projectSlug: true, startedAt: true },
    });

    return NextResponse.json({
      ok: true,
      saved: {
        projectSlug: saved.projectSlug,
        startedAt: saved.startedAt.toISOString(),
      },
    });
  } catch (e: any) {
    if (isUnauthError(e)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.error("POST /api/project-start error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}