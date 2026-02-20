import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function isUnauthError(e: any) {
  const msg = String(e?.message ?? e ?? "").toLowerCase();
  return msg.includes("unauth");
}

type NotebookPayload = {
  title: string;
  pagesJson: any; // object
};

export async function GET() {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const row = await db.notebookState.findUnique({
      where: { userId },
      select: { title: true, pagesJson: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, notebook: row }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    if (isUnauthError(e)) return bad("unauthorized", 401);
    console.error("GET /api/notebook-state error:", e);
    return bad("Internal Server Error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();
    const userId = dbUserId;

    const body = (await req.json().catch(() => null)) as Partial<NotebookPayload> | null;
    if (!body) return bad("invalid json");

    const title = String(body.title ?? "Notebook").trim() || "Notebook";

    // pagesJson must be an object (not a string)
    const pagesJson = body.pagesJson ?? {};
    if (typeof pagesJson !== "object" || pagesJson === null) {
      return bad("pagesJson must be an object");
    }

    const row = await db.notebookState.upsert({
      where: { userId },
      create: { userId, title, pagesJson },
      update: { title, pagesJson },
      select: { title: true, pagesJson: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, notebook: row }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    if (isUnauthError(e)) return bad("unauthorized", 401);
    console.error("POST /api/notebook-state error:", e);
    return bad(String(e?.message ?? e), 500);
  }
}