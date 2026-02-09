import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return bad("unauthorized", 401);

  const url = new URL(req.url);
  const projectSlug = url.searchParams.get("projectSlug") || "";
  const lessonSlug = url.searchParams.get("lessonSlug") || "";

  if (!projectSlug || !lessonSlug) return bad("missing projectSlug/lessonSlug");

  const row = await db.circuitState.findUnique({
    where: { userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug } },
    select: { wokwiUrl: true, diagramJson: true, updatedAt: true },
  });

  return NextResponse.json(
    { ok: true, circuit: row },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return bad("unauthorized", 401);

  const body = await req.json().catch(() => null);

  const projectSlug = String(body?.projectSlug || "");
  const lessonSlug = String(body?.lessonSlug || "");
  if (!projectSlug || !lessonSlug) return bad("missing projectSlug/lessonSlug");

  const wokwiUrlRaw = body?.wokwiUrl;
  const wokwiUrl =
    wokwiUrlRaw === null || wokwiUrlRaw === undefined || String(wokwiUrlRaw).trim() === ""
      ? null
      : String(wokwiUrlRaw).trim();

  // diagramJson: accept either object or stringified JSON
  let diagramJson: any = null;
  const diagramRaw = body?.diagramJson;

  if (diagramRaw === null || diagramRaw === undefined || diagramRaw === "") {
    diagramJson = null;
  } else if (typeof diagramRaw === "string") {
    try {
      diagramJson = JSON.parse(diagramRaw);
    } catch {
      return bad("diagramJson is not valid JSON");
    }
  } else {
    diagramJson = diagramRaw; // already object
  }

  const row = await db.circuitState.upsert({
    where: { userId_projectSlug_lessonSlug: { userId, projectSlug, lessonSlug } },
    create: { userId, projectSlug, lessonSlug, wokwiUrl, diagramJson },
    update: { wokwiUrl, diagramJson },
    select: { wokwiUrl: true, diagramJson: true, updatedAt: true },
  });

  return NextResponse.json(
    { ok: true, circuit: row },
    { headers: { "Cache-Control": "no-store" } }
  );
}
