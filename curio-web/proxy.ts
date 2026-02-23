import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { assertNoTestKeysInProduction } from "@/lib/clerkEnvGuard";

assertNoTestKeysInProduction();

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/account-setup(.*)",
  "/accept-admin-invite(.*)",
  "/api/admin/accept-invite(.*)",
]);

const proxy = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};