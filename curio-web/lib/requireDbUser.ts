// src/lib/requireDbUser.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RequireDbUserResult = {
  dbUser: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: "ADMIN" | "STUDENT";
    linkedClerkUserId: string | null;
  };
  dbUserId: string;
  clerkUserId: string;
};

async function getClerkIdentity(clerkUserId: string) {
  // Support both callable and object forms across Clerk versions.
  const clerk: any =
    typeof (clerkClient as any) === "function" ? await (clerkClient as any)() : (clerkClient as any);

  const u = await clerk.users.getUser(clerkUserId);

  const email =
    u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ??
    u.emailAddresses?.[0]?.emailAddress ??
    null;

  const firstName = u.firstName ?? null;
  const lastName = u.lastName ?? null;

  return { email, firstName, lastName };
}

export async function requireDbUser(): Promise<RequireDbUserResult> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthenticated");

  // 1) normal case: DB row id matches Clerk id
  // 2) linked case: legacy DB row has linkedClerkUserId = Clerk id
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: clerkUserId }, { linkedClerkUserId: clerkUserId }],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      linkedClerkUserId: true,
    },
  });

  // If no row exists at all, create one (this is the *only* time we create)
  if (!dbUser) {
    const ident = await getClerkIdentity(clerkUserId);

    dbUser = await prisma.user.create({
      data: {
        id: clerkUserId,
        email: ident.email ?? undefined,
        firstName: ident.firstName,
        lastName: ident.lastName,
        role: "STUDENT",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        linkedClerkUserId: true,
      },
    });
  } else {
    // Optional: backfill identity fields if missing (do NOT change dbUser.id)
    const hasEmail = !!(dbUser.email && String(dbUser.email).trim());
    const hasName = !!(
      (dbUser.firstName && String(dbUser.firstName).trim()) ||
      (dbUser.lastName && String(dbUser.lastName).trim())
    );

    if (!hasEmail || !hasName) {
      const ident = await getClerkIdentity(clerkUserId);

      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: !hasEmail ? ident.email ?? undefined : undefined,
          firstName: !dbUser.firstName ? ident.firstName : undefined,
          lastName: !dbUser.lastName ? ident.lastName : undefined,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          linkedClerkUserId: true,
        },
      });
    }
  }

  return { dbUser, dbUserId: dbUser.id, clerkUserId };
}