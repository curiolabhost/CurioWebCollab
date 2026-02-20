// app/api/admin/invites/route.ts
// GET: list existing invites + associated metadata (creator, used or not, etc)
// POST: create new invite (generate token, store hash, send email)

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

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

  return NextResponse.json(
    { ok: true, admins, invites },
    { headers: { "Cache-Control": "no-store" } }
  );
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

  // OPTIONAL: prevent spamming multiple pending invites to same email
  // (keeps things cleaner in your table)
  const existingPending = await prisma.adminInvite.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (existingPending) {
    return NextResponse.json(
      { ok: false, error: "An active invite already exists for this email." },
      { status: 409 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.adminInvite.create({
    data: {
      email,
      tokenHash,
      expiresAt,
      createdByUserId: gate.dbUser!.id,
    },
  });

  const origin = new URL(req.url).origin;
  const inviteUrl = `${origin}/accept-admin-invite?token=${token}`;

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
    `This link expires on: ${expiresAt.toISOString()}`,
  ].join("\n");

  const text =
    message.length > 0
      ? renderTemplate(message, {
          inviteUrl,
          expiresAt: expiresAt.toISOString(),
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
    return NextResponse.json(
      { ok: false, error: "Invite created, but email failed to send.", inviteUrl },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { ok: true, sent: true, inviteUrl, expiresAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
