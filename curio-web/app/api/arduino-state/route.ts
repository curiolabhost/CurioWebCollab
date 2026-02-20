// app/api/arduino-state/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

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

/**
 * We want Arduino editor state shared between Coding/Circuits for the SAME level.
 * Examples:
 *  - code-beg + circuit-beg   => editor-beg
 *  - code-int + circuit-int   => editor-int
 *  - code-adv + circuit-adv   => editor-adv
 */
function toSharedLessonSlug(lessonSlug: string) {
  const m = String(lessonSlug || "").match(/^(code|circuit)-(.+)$/);
  const level = m?.[2] || lessonSlug || "";
  return level ? `editor-${level}` : "";
}

function isUnauthError(e: any) {
  const msg = String(e?.message ?? e ?? "").toLowerCase();
  return msg.includes("unauth");
}

export async function GET(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const { projectSlug, lessonSlug } = getKey(req);
    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ ok: false, error: "missing projectSlug/lessonSlug" }, { status: 400 });
    }

    const sharedLessonSlug = toSharedLessonSlug(lessonSlug);
    if (!sharedLessonSlug) {
      return NextResponse.json({ ok: false, error: "invalid lessonSlug" }, { status: 400 });
    }

    const row = await db.lessonState.findUnique({
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug: sharedLessonSlug },
      },
      select: { blanks: true, updatedAt: true },
    });

    const blanks = (row?.blanks as any) ?? {};
    const arduino: ArduinoState | null = blanks?.arduino ?? null;

    return NextResponse.json({ ok: true, arduino }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    if (isUnauthError(e)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    console.error("GET /api/arduino-state error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const body = await req.json().catch(() => null);
    const projectSlug = String(body?.projectSlug || "");
    const lessonSlug = String(body?.lessonSlug || "");
    const code = String(body?.code ?? "");

    if (!projectSlug || !lessonSlug) {
      return NextResponse.json({ ok: false, error: "missing projectSlug/lessonSlug" }, { status: 400 });
    }

    const sharedLessonSlug = toSharedLessonSlug(lessonSlug);
    if (!sharedLessonSlug) {
      return NextResponse.json({ ok: false, error: "invalid lessonSlug" }, { status: 400 });
    }

    // (optional) small guard so we don't store insane sizes
    if (code.length > 200_000) {
      return NextResponse.json({ ok: false, error: "code too large" }, { status: 413 });
    }

    const existing = await db.lessonState.findUnique({
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug: sharedLessonSlug },
      },
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
      where: {
        userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug: sharedLessonSlug },
      },
      create: { userId, projectSlug, lessonSlug: sharedLessonSlug, blanks: nextBlanks },
      update: { blanks: nextBlanks },
      select: { blanks: true, updatedAt: true },
    });

    return NextResponse.json(
      { ok: true, arduino: (row.blanks as any)?.arduino ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    if (isUnauthError(e)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    console.error("POST /api/arduino-state error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}