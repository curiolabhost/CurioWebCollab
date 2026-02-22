// app/api/admin/invites/route.ts
// GET: list existing invites + associated metadata (creator, used or not, etc)
// POST: create new invite (ROTATE existing active invite if one exists, then create a new one)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

function normalizeEmail(s: string) {
  return String(s || "").trim().toLowerCase();
}

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || null;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: gate.status });

  const adminsRaw = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const invitesRaw = await prisma.adminInvite.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true, 
      createdByUserId: true,
      createdByUser: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const admins = adminsRaw.map((a) => ({
    id: a.id,
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    fullName: fullName(a.firstName, a.lastName),
    createdAt: a.createdAt,
  }));

  const invites = invitesRaw.map((inv) => ({
    id: inv.id,
    email: inv.email,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    usedAt: inv.usedAt,
    revokedAt: inv.revokedAt, 
    createdBy: inv.createdByUser
      ? {
          id: inv.createdByUser.id,
          email: inv.createdByUser.email,
          firstName: inv.createdByUser.firstName,
          lastName: inv.createdByUser.lastName,
          fullName: fullName(inv.createdByUser.firstName, inv.createdByUser.lastName),
        }
      : null,
  }));

  return NextResponse.json({ ok: true, admins, invites }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: gate.status });

  const body = (await req.json().catch(() => null)) as
    | { email?: string; subject?: string; message?: string }
    | null;

  const email = normalizeEmail(body?.email ?? "");
  const subject = String(body?.subject ?? "Your Curio admin invite").trim();
  const message = String(body?.message ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  // if there's an active invite, revoke it so we can recreate a new link immediately
  const existingActive = await prisma.adminInvite.findFirst({
    where: {
      email,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  let replacesInviteId: string | null = null;

  if (existingActive) {
    replacesInviteId = existingActive.id;
    await prisma.adminInvite.update({
      where: { id: existingActive.id },
      data: {
        revokedAt: new Date(),
        revokedByUserId: gate.dbUser!.id,
      },
    });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // New invite row (ID becomes the token in the URL)
  const newInvite = await prisma.adminInvite.create({
    data: {
      email,
      expiresAt,
      createdByUserId: gate.dbUser!.id,
      replacesInviteId,
    },
    select: { id: true, expiresAt: true },
  });

  const origin =
    (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") || new URL(req.url).origin;

  // token is the invite ID 
  const inviteUrl = `${origin}/accept-admin-invite?token=${encodeURIComponent(newInvite.id)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY env var" }, { status: 500 });
  }
  if (!from) {
    return NextResponse.json({ ok: false, error: "Missing EMAIL_FROM env var" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const fallbackText = [
    "You’ve been invited to become a Curio admin.",
    "",
    `Accept invite: ${inviteUrl}`,
    "",
    `This link expires on: ${newInvite.expiresAt.toISOString()}`,
  ].join("\n");

  const text =
    message.length > 0
      ? renderTemplate(message, {
          inviteUrl,
          expiresAt: newInvite.expiresAt.toISOString(),
          email,
        })
      : fallbackText;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject,
    text,
  });

  if (error) {
    // invite exists; email failed. still return the link so admin can copy it.
    return NextResponse.json(
      { ok: false, error: "Invite created, but email failed to send.", inviteUrl, expiresAt: newInvite.expiresAt },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { ok: true, sent: true, inviteUrl, expiresAt: newInvite.expiresAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}