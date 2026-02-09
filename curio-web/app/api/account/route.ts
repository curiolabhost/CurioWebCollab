import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { age: true, grade: true, school: true, goals: true, updatedAt: true },
  });

  return NextResponse.json(
    { ok: true, profile },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);

    const ageRaw = body?.age;
    const age = ageRaw === null || ageRaw === undefined || ageRaw === "" ? null : Number(ageRaw);

    if (age !== null && (!Number.isFinite(age) || age < 5 || age > 120)) {
      return NextResponse.json({ error: "age invalid" }, { status: 400 });
    }

    const grade = body?.grade === "" ? null : (body?.grade ?? null);
    const school = body?.school === "" ? null : (body?.school ?? null);
    const goals = body?.goals === "" ? null : (body?.goals ?? null);

    const profile = await db.userProfile.upsert({
      where: { userId },
      create: { userId, age: age === null ? null : Math.round(age), grade, school, goals },
      update: { age: age === null ? null : Math.round(age), grade, school, goals },
      select: { age: true, grade: true, school: true, goals: true, updatedAt: true },
    });

    return NextResponse.json(
      { ok: true, profile },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("POST /api/account error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

