// lib/authz.ts
import { auth } from "@clerk/nextjs/server";
import { requireDbUser } from "@/lib/requireDbUser";

export async function ensureDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const { dbUser } = await requireDbUser();
  return dbUser;
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, status: 401, dbUser: null };

  const { dbUser } = await requireDbUser();

  if (dbUser.role !== "ADMIN") return { ok: false as const, status: 403, dbUser };
  return { ok: true as const, status: 200, dbUser };
}