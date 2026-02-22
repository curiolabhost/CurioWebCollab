// app/admin/layout.tsx
import * as React from "react";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    redirect("/dashboard");
  }

  // IMPORTANT: no AdminShellClient here anymore.
  // Shell vs noshell is handled by route groups below.
  return <React.Suspense fallback={null}>{children}</React.Suspense>;
}