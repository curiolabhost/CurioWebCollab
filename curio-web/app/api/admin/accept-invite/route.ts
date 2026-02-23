// Accept Admin Invite (token OR manual code)
// app/api/admin/accept-invite/route.ts
// - token: /accept-admin-invite?token=... (link-based)
// - code: manual code stored in AdminInvite.code
// Security: signed-in Clerk account must contain invite.email

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function normalizeEmail(s: string | null | undefined) {
  return String(s ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { token?: string; code?: string } | null;
  const token = String(body?.token ?? "").trim();
  const code = String(body?.code ?? "").trim();

  if (!token && !code) {
    return NextResponse.json({ ok: false, error: "Missing token or code" }, { status: 400 });
  }

  const cu = await currentUser();
  if (!cu) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  // Collect ALL emails on the signed-in account (stronger than picking [0])
  const emails =
    cu.emailAddresses?.map((e) => normalizeEmail(e.emailAddress))?.filter(Boolean) ?? [];
  const uniqueEmails = Array.from(new Set(emails));

  if (!uniqueEmails.length) {
    return NextResponse.json(
      { ok: false, error: "Your Clerk account has no email address." },
      { status: 400 }
    );
  }

  const tokenHash = token ? sha256(token) : null;
  const submittedCode = code ? code.toUpperCase() : null;

  const result = await prisma.$transaction(async (tx) => {
    let invite = null as any;

    // Prefer token flow if provided
    if (token) {
      invite = await tx.adminInvite.findUnique({ where: { tokenHash: tokenHash! } });
      if (!invite) {
        // legacy token flow (id used as token)
        invite = await tx.adminInvite.findUnique({ where: { id: token } });
      }
    }

    // If no token match and code provided, try code
    if (!invite && submittedCode) {
      invite = await tx.adminInvite.findUnique({ where: { code: submittedCode } });
    }

    if (!invite) return { ok: false as const, status: 404, error: "Invite not found" };
    if (invite.usedAt) return { ok: false as const, status: 409, error: "Invite already used" };
    if (invite.revokedAt) return { ok: false as const, status: 410, error: "Invite was revoked" };
    if (invite.expiresAt.getTime() < Date.now())
      return { ok: false as const, status: 410, error: "Invite expired" };

    const inviteEmail = normalizeEmail(invite.email);
    if (!inviteEmail) return { ok: false as const, status: 400, error: "Invite missing email" };

    // SECURITY: invite email must match one of the signed-in user's emails
    if (!uniqueEmails.includes(inviteEmail)) {
      return {
        ok: false as const,
        status: 403,
        error: "Invite email does not match your signed-in email.",
      };
    }

    const firstName = cu.firstName ?? null;
    const lastName = cu.lastName ?? null;

    await tx.user.upsert({
      where: { id: userId },
      update: { email: inviteEmail, firstName, lastName, role: "ADMIN" },
      create: { id: userId, email: inviteEmail, firstName, lastName, role: "ADMIN" },
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