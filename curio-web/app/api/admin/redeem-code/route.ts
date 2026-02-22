// This route allows a user to redeem an admin invite code (type=CODE) to become an admin.

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = String(body?.code ?? "").trim();
  if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

  const cu = await currentUser();
  if (!cu) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const firstName = cu.firstName ?? null;
  const lastName = cu.lastName ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.adminInvite.findUnique({ where: { id: code } });

    if (!invite) return { ok: false as const, status: 404, error: "Invalid code" };
    if (invite.type !== "CODE") return { ok: false as const, status: 400, error: "Not an admin code" };
    if (invite.usedAt) return { ok: false as const, status: 409, error: "Code already used" };
    if (invite.revokedAt) return { ok: false as const, status: 410, error: "Code was revoked" };
    if (invite.expiresAt.getTime() < Date.now())
      return { ok: false as const, status: 410, error: "Code expired" };

    // Promote user to ADMIN
    await tx.user.upsert({
      where: { id: userId },
      update: { role: "ADMIN", firstName, lastName },
      create: { id: userId, role: "ADMIN", firstName, lastName },
    });

    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return { ok: true as const, status: 200 };
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}