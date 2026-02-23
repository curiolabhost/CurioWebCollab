// Redeem admin invite code - the code is AdminInvite.code (manual code on EMAIL invites).
// Signed-in user must have email matching invite.email.
// Marks invite used, promotes user to ADMIN.

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(s: string | null | undefined) {
  return String(s ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const submittedCode = String(body?.code ?? "").trim();
  if (!submittedCode) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

  const submittedCodeNormalized = submittedCode.toUpperCase();

  const cu = await currentUser();
  if (!cu) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const userEmail = normalizeEmail(
    cu.emailAddresses?.[0]?.emailAddress ?? cu.primaryEmailAddress?.emailAddress ?? ""
  );
  if (!userEmail) {
    return NextResponse.json({ ok: false, error: "Your account has no email address" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.adminInvite.findUnique({
      where: { code: submittedCodeNormalized },
    });

    if (!invite) return { ok: false as const, status: 404, error: "Invalid code" };
    if (invite.usedAt) return { ok: false as const, status: 409, error: "Code already used" };
    if (invite.revokedAt) return { ok: false as const, status: 410, error: "Code was revoked" };
    if (invite.expiresAt.getTime() < Date.now())
      return { ok: false as const, status: 410, error: "Code expired" };

    const inviteEmail = normalizeEmail(invite.email);
    if (!inviteEmail) return { ok: false as const, status: 400, error: "Invalid invite" };

    // SECURITY: signed-in user's email must match invite email
    if (userEmail !== inviteEmail) {
      return { ok: false as const, status: 403, error: "This code is for a different email address" };
    }

    const firstName = cu.firstName ?? null;
    const lastName = cu.lastName ?? null;

    await tx.user.upsert({
      where: { id: userId },
      update: { role: "ADMIN", email: inviteEmail, firstName, lastName },
      create: { id: userId, role: "ADMIN", email: inviteEmail, firstName, lastName },
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
