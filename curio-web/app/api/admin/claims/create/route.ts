// This API route allows an admin to create a claim for a legacy user, which generates a unique token and stores a hash of it in the database. The admin can then share the claim URL with the user, who can use it to link their legacy account to a new identity.
// This is for the case where you have existing users in a legacy system and want to migrate them to the new system with Clerk authentication. The admin creates a claim for each legacy user, which generates a token. The user can then use that token to link their legacy account to a new Clerk account.
// api/admin/claims/create/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz"; // use your existing helper

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = await req.json().catch(() => ({}));
  const legacyUserId = String(body.legacyUserId || "");
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = body.firstName ? String(body.firstName).trim() : null;
  const lastName = body.lastName ? String(body.lastName).trim() : null;

  if (!legacyUserId) return NextResponse.json({ error: "legacyUserId required" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // ensure legacy user exists
  const legacy = await prisma.user.findUnique({ where: { id: legacyUserId } });
  if (!legacy) return NextResponse.json({ error: "legacy user not found" }, { status: 404 });

  // store identity immediately so admin UI shows it even before linking
  await prisma.user.update({
    where: { id: legacyUserId },
    data: { email, firstName, lastName },
  });

  // create token
  const token = crypto.randomBytes(24).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  // one claim per legacy user (your schema is 1:1)
  await prisma.accountClaim.upsert({
    where: { legacyUserId },
    create: { legacyUserId, email, tokenHash, expiresAt },
    update: { email, tokenHash, expiresAt, usedAt: null },
  });

  const claimUrl = `/claim?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ claimUrl, expiresAt });
}