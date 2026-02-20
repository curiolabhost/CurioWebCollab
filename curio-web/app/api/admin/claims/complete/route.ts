// This route is called when a user submits a claim token to link their legacy account to their new Clerk identity. It verifies the token, marks it as used, and links the accounts together.
// api/admin/claims/complete/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const tokenHash = sha256(token);

  const claim = await prisma.accountClaim.findUnique({ where: { tokenHash } });
  if (!claim) return NextResponse.json({ error: "invalid token" }, { status: 404 });
  if (claim.usedAt) return NextResponse.json({ error: "token already used" }, { status: 400 });
  if (claim.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "token expired" }, { status: 400 });

  // Link LIVE clerk userId to the legacy DB user row
  await prisma.user.update({
    where: { id: claim.legacyUserId },
    data: { linkedClerkUserId: clerkUserId },
  });

  await prisma.accountClaim.update({
    where: { id: claim.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}