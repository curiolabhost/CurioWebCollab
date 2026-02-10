import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

type NotebookPayload = {
  title: string;
  pagesJson: any; // object
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return bad("unauthorized", 401);

  const row = await db.notebookState.findUnique({
    where: { userId },
    select: { title: true, pagesJson: true, updatedAt: true },
  });

  return NextResponse.json(
    { ok: true, notebook: row },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return bad("unauthorized", 401);

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

  return NextResponse.json(
    { ok: true, notebook: row },
    { headers: { "Cache-Control": "no-store" } }
  );
}
