import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json({ ok: true, userId, dbUser });
}
