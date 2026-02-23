// app/api/admin/invites/route.ts
// GET: list existing invites + associated metadata (creator, used or not, etc)
// POST: create new invite (ROTATE existing active invite if one exists, then create a new one)
// Every EMAIL invite gets both inviteUrl (token-based) and a manual code.

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

// 8-12 chars, uppercase letters + digits, avoid O/0/I/1
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * INVITE_TOKEN_KEY
 * - base64 encoded 32-byte key (AES-256-GCM)
 * - generate once: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
function getInviteKey(): Buffer {
  const b64 = process.env.INVITE_TOKEN_KEY;
  if (!b64) throw new Error("Missing INVITE_TOKEN_KEY env var");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("INVITE_TOKEN_KEY must be 32 bytes (base64-encoded)");
  return key;
}

// AES-256-GCM: returns "iv.tag.ciphertext" (all base64)
function encryptToken(plain: string): string {
  const key = getInviteKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}`;
}

function decryptToken(enc: string): string {
  const key = getInviteKey();
  const [ivB64, tagB64, ctB64] = enc.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Bad tokenEnc format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

function generateManualCode(): string {
  const len = 8 + Math.floor(Math.random() * 5); // 8-12
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

function normalizeEmail(s: string) {
  return String(s || "").trim().toLowerCase();
}

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || null;
}

function getOriginFromReq(reqUrl: string) {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") || new URL(reqUrl).origin;
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: gate.status });

  const origin = getOriginFromReq(req.url);

  const adminsRaw = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const invitesRaw = await prisma.adminInvite.findMany({
    where: {
      // Filter out legacy CODE invites (email null)
      email: { not: null },
    },
    select: {
      id: true,
      type: true,
      email: true,
      code: true,
      tokenHash: true,
      tokenEnc: true, // ✅ NEW (requires schema field)
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

  // Filter out rows with null email (legacy CODE invites that slipped through)
  const invitesFiltered = invitesRaw.filter((inv) => inv.email != null);

  const now = Date.now();

  const invites = invitesFiltered.map((inv) => {
    const isActive =
      !inv.usedAt &&
      !inv.revokedAt &&
      new Date(inv.expiresAt).getTime() > now;

    let inviteUrl: string | null = null;

    // Only show invite URL for active EMAIL invites.
    // Legacy: tokenHash null => token was inv.id
    // New: tokenEnc exists => decrypt to obtain token
    if (isActive && (inv.type ?? "EMAIL") === "EMAIL") {
      if (inv.tokenHash == null) {
        inviteUrl = `${origin}/accept-admin-invite?token=${encodeURIComponent(inv.id)}`;
      } else if (inv.tokenEnc) {
        try {
          const token = decryptToken(inv.tokenEnc);
          inviteUrl = `${origin}/accept-admin-invite?token=${encodeURIComponent(token)}`;
        } catch {
          // If decrypt fails, don't leak anything; just omit URL.
          inviteUrl = null;
        }
      }
    }

    return {
      id: inv.id,
      type: (inv.type ?? "EMAIL") as "EMAIL" | "CODE",
      email: inv.email,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      revokedAt: inv.revokedAt,
      inviteUrl,

      token: inv.tokenHash == null ? inv.id : null, // legacy-only
      code: inv.code ?? null,

      createdBy: inv.createdByUser
        ? {
            id: inv.createdByUser.id,
            email: inv.createdByUser.email,
            firstName: inv.createdByUser.firstName,
            lastName: inv.createdByUser.lastName,
            fullName: fullName(inv.createdByUser.firstName, inv.createdByUser.lastName),
          }
        : null,
    };
  });

  const admins = adminsRaw.map((a) => ({
    id: a.id,
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    fullName: fullName(a.firstName, a.lastName),
    createdAt: a.createdAt,
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

  // Generate token for link-based invite
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const tokenEnc = encryptToken(token); // ✅ store encrypted token so GET can show URL

  // Generate manual code (8-12 chars, retry on collision)
  let manualCode: string;
  for (let attempt = 0; attempt < 10; attempt++) {
    manualCode = generateManualCode();
    try {
      const newInvite = await prisma.adminInvite.create({
        data: {
          type: "EMAIL",
          email,
          tokenHash,
          tokenEnc, // ✅ NEW (requires schema field)
          code: manualCode,
          expiresAt,
          createdByUserId: gate.dbUser!.id,
          replacesInviteId,
        },
        select: { id: true, expiresAt: true },
      });

      const origin = getOriginFromReq(req.url);
      const inviteUrl = `${origin}/accept-admin-invite?token=${encodeURIComponent(token)}`;

      // Send email with both inviteUrl and code in template
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
        "You've been invited to become a Curio admin.",
        "",
        `Accept invite: ${inviteUrl}`,
        "",
        `Manual code (if link doesn't work): ${manualCode}`,
        "",
        `This link expires on: ${newInvite.expiresAt.toISOString()}`,
      ].join("\n");

      const templateVars: Record<string, string> = {
        inviteUrl,
        expiresAt: newInvite.expiresAt.toISOString(),
        email,
        code: manualCode,
      };

      const text = message.length > 0 ? renderTemplate(message, templateVars) : fallbackText;

      const { error } = await resend.emails.send({
        from,
        to: email,
        subject,
        text,
      });

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: "Invite created, but email failed to send.",
            inviteUrl,
            expiresAt: newInvite.expiresAt,
            code: manualCode,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { ok: true, sent: true, inviteUrl, expiresAt: newInvite.expiresAt, code: manualCode },
        { headers: { "Cache-Control": "no-store" } }
      );
    } catch (e: unknown) {
      const isUniqueViolation =
        e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
      if (!isUniqueViolation || attempt === 9) throw e;
    }
  }

  return NextResponse.json({ ok: false, error: "Failed to generate unique code" }, { status: 500 });
}