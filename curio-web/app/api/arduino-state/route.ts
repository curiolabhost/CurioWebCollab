// app/api/arduino-state/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ArduinoState = {
  code: string;
  updatedAt?: string;
};

function getKey(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get("projectSlug") || "";
  const lessonSlug = searchParams.get("lessonSlug") || "";
  return { projectSlug, lessonSlug };
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { projectSlug, lessonSlug } = getKey(req);
  if (!projectSlug || !lessonSlug) {
    return NextResponse.json({ ok: false, error: "missing projectSlug/lessonSlug" }, { status: 400 });
  }

  const row = await db.lessonState.findUnique({
    where: { userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug } },
    select: { blanks: true, updatedAt: true },
  });

  const blanks = (row?.blanks as any) ?? {};
  const arduino: ArduinoState | null = blanks?.arduino ?? null;

  return NextResponse.json(
    { ok: true, arduino },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const projectSlug = String(body?.projectSlug || "");
    const lessonSlug = String(body?.lessonSlug || "");
    const code = String(body?.code ?? "");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ ok: false, error: "missing projectSlug/lessonSlug" }, { status: 400 });
    }

    // (optional) small guard so we don't store insane sizes
    if (code.length > 200_000) {
      return NextResponse.json({ ok: false, error: "code too large" }, { status: 413 });
    }

    const existing = await db.lessonState.findUnique({
      where: { userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug } },
      select: { blanks: true },
    });

    const blanks = (existing?.blanks as any) ?? {};

    const nextBlanks = {
      ...blanks,
      arduino: {
        code,
        updatedAt: new Date().toISOString(),
      },
    };

    const row = await db.lessonState.upsert({
      where: { userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug } },
      create: { userId, projectSlug, lessonSlug, blanks: nextBlanks },
      update: { blanks: nextBlanks },
      select: { blanks: true, updatedAt: true },
    });

    return NextResponse.json(
      { ok: true, arduino: (row.blanks as any)?.arduino ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("POST /api/arduino-state error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
