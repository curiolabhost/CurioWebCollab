//account-setup/login/page.tsx
// what it does: This page is the login page for the account setup flow. It redirects to the Clerk sign-in page.

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/sign-in");
}
