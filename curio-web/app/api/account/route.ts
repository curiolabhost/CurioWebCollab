// Account API Route - Get and Update User Profile

import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { requireDbUser } from "@/lib/requireDbUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { dbUserId } = await requireDbUser();

    const profile = await db.userProfile.findUnique({
      where: { userId: dbUserId },
      select: {
        age: true,
        grade: true,
        school: true,
        goals: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { ok: true, profile },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { dbUserId } = await requireDbUser();

    const body = await req.json().catch(() => null);

    const ageRaw = body?.age;
    const age =
      ageRaw === null || ageRaw === undefined || ageRaw === ""
        ? null
        : Number(ageRaw);

    if (age !== null && (!Number.isFinite(age) || age < 5 || age > 120)) {
      return NextResponse.json({ error: "age invalid" }, { status: 400 });
    }

    const grade = body?.grade === "" ? null : body?.grade ?? null;
    const school = body?.school === "" ? null : body?.school ?? null;
    const goals = body?.goals === "" ? null : body?.goals ?? null;

    const profile = await db.userProfile.upsert({
      where: { userId: dbUserId },
      create: {
        userId: dbUserId,
        age: age === null ? null : Math.round(age),
        grade,
        school,
        goals,
      },
      update: {
        age: age === null ? null : Math.round(age),
        grade,
        school,
        goals,
      },
      select: {
        age: true,
        grade: true,
        school: true,
        goals: true,
        updatedAt: true,
      },
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