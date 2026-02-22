// This route creates a new admin invite code (type=CODE) that can be redeemed by anyone to create an admin account.
// It requires the user to be an existing admin (enforced by requireAdmin gate).
// The invite code is simply the ID of the AdminInvite row, and it has an expiration date.
// No email is associated with this type of invite since it's not sent to a specific person.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: gate.status });

  // Optional: allow rotating a previous active code if you want just one "current" code
  const existingActive = await prisma.adminInvite.findFirst({
    where: {
      type: "CODE",
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (existingActive) {
    await prisma.adminInvite.update({
      where: { id: existingActive.id },
      data: { revokedAt: new Date(), revokedByUserId: gate.dbUser!.id },
    });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const codeInvite = await prisma.adminInvite.create({
    data: {
      type: "CODE",
      email: null,
      expiresAt,
      createdByUserId: gate.dbUser!.id,
      replacesInviteId: existingActive?.id ?? null,
    },
    select: { id: true, expiresAt: true },
  });

  // The "code" is the invite id
  return NextResponse.json(
    { ok: true, code: codeInvite.id, expiresAt: codeInvite.expiresAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}