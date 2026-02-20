export function assertNoTestKeysInProduction() {
  if (process.env.NODE_ENV !== "production") return;

  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";

  if (!pk || !sk) {
    throw new Error("Missing Clerk keys in production.");
  }

  if (pk.startsWith("pk_test_") || sk.startsWith("sk_test_")) {
    throw new Error("Production is using Clerk TEST keys.");
  }

  // extra safety: ensure they match
  const pkIsLive = pk.startsWith("pk_live_");
  const skIsLive = sk.startsWith("sk_live_");
  if (!pkIsLive || !skIsLive) {
    throw new Error("Production Clerk keys are not live keys.");
  }
}