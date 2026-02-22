// Accept Admin Invite
// app/api/admin/accept-invite/route.ts
// Verifies invite token (NOW: token = AdminInvite.id),
// checks signed-in user's emails match invite email,
// promotes user to ADMIN, stores email + first/last name, marks invite used.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function normalizeEmail(s: string | null) {
  return String(s || "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = String(body?.token ?? "").trim();
  if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

  const cu = await currentUser();
  if (!cu) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const emails =
    cu.emailAddresses?.map((e) => normalizeEmail(e.emailAddress))?.filter(Boolean) ?? [];
  const uniqueEmails = Array.from(new Set(emails));

  if (!uniqueEmails.length) {
    return NextResponse.json(
      { ok: false, error: "Your Clerk account has no email address." },
      { status: 400 }
    );
  }

  // token is the AdminInvite.id now (no hashing)
  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.adminInvite.findUnique({ where: { id: token } });

    if (!invite) return { ok: false as const, status: 404, error: "Invite not found" };
    if (invite.usedAt) return { ok: false as const, status: 409, error: "Invite already used" };
    if (invite.revokedAt) return { ok: false as const, status: 410, error: "Invite was revoked" };
    if (invite.expiresAt.getTime() < Date.now())
      return { ok: false as const, status: 410, error: "Invite expired" };

    const inviteEmail = normalizeEmail(invite.email);

    // Critical check: invite email must match one of the signed-in user's emails
    if (!uniqueEmails.includes(inviteEmail)) {
      return {
        ok: false as const,
        status: 403,
        error: "Invite email does not match your signed-in email.",
      };
    }

    // Save canonical email + names from Clerk, promote to ADMIN
    const firstName = cu.firstName ?? null;
    const lastName = cu.lastName ?? null;

    await tx.user.upsert({
      where: { id: userId }, // User.id is Clerk userId
      update: {
        email: inviteEmail,
        firstName,
        lastName,
        role: "ADMIN",
      },
      create: {
        id: userId,
        email: inviteEmail,
        firstName,
        lastName,
        role: "ADMIN",
      },
    });

    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return { ok: true as const, status: 200 };
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}