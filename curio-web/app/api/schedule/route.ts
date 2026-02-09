import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma as db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const projectSlug = String(body?.projectSlug || "");
  const daysPerWeek = Number(body?.daysPerWeek);
  const hoursPerDay = Number(body?.hoursPerDay);

  if (!projectSlug) return NextResponse.json({ error: "projectSlug required" }, { status: 400 });
  if (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7)
    return NextResponse.json({ error: "daysPerWeek invalid" }, { status: 400 });
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0)
    return NextResponse.json({ error: "hoursPerDay invalid" }, { status: 400 });

  const row = await db.projectSchedule.upsert({
    where: { userId_projectSlug: { userId, projectSlug } },
    create: { userId, projectSlug, daysPerWeek, hoursPerDay },
    update: { daysPerWeek, hoursPerDay },
    select: { projectSlug: true, daysPerWeek: true, hoursPerDay: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, row });
}
