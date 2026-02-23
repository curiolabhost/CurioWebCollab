// app/api/me/is-admin/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: userId }, { linkedClerkUserId: userId }],
    },
    select: { role: true },
  });

  return NextResponse.json(
    { ok: true, isAdmin: dbUser?.role === "ADMIN" },
    { headers: { "Cache-Control": "no-store" } }
  );
}