/**
 * Fetches user identity (email, firstName, lastName) from Clerk Backend API.
 * Uses @clerk/backend createClerkClient for reliable server-side fetching of arbitrary users.
 */
import { createClerkClient } from "@clerk/backend";

export type ClerkIdentity = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

function isClerkNotFound(err: any) {
  return err && typeof err === "object" && "status" in err && (err as any).status === 404;
}

/**
 * Fetch identity from Clerk. Returns null if user not found or API fails.
 */
export async function fetchClerkIdentity(clerkUserId: string): Promise<ClerkIdentity | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey?.trim()) {
    console.error("Clerk backfill: CLERK_SECRET_KEY not set (cannot fetch user identity).");
    return null;
  }

  try {
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(clerkUserId);

    const primaryEmail =
      user.primaryEmailAddressId
        ? user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
        : null;

    const fallbackEmail = user.emailAddresses?.[0]?.emailAddress ?? null;
    const email = (primaryEmail ?? fallbackEmail)?.trim() || null;

    const firstName = (user.firstName ?? "").trim() || null;
    const lastName = (user.lastName ?? "").trim() || null;

    return { email, firstName, lastName };
  } catch (e: any) {
    if (isClerkNotFound(e)) return null;
    console.error("Clerk backfill fetch failed for", clerkUserId, e?.status, e?.message);
    return null;
  }
}