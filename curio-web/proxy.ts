// This middleware applies Clerk authentication to all routes except for the public ones defined in `isPublicRoute`.
// curio-web/proxy.ts


import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { assertNoTestKeysInProduction } from "@/lib/clerkEnvGuard";

assertNoTestKeysInProduction();

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/account-setup(.*)",

  // allow invite links to load (page will prompt sign-in)
  "/accept-admin-invite(.*)",

  // allow invite accept API to be called
  "/api/admin/accept-invite(.*)",
]);

const proxy = clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;
  auth.protect();
});

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};