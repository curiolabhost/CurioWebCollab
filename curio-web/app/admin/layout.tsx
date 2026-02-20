// app/admin/layout.tsx
import * as React from "react";
import { redirect } from "next/navigation";

import AdminShellClient from "./AdminShellClient";
import { requireAdmin } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    redirect("/dashboard");
  }

  return (
    <React.Suspense fallback={null}>
      <AdminShellClient>{children}</AdminShellClient>
    </React.Suspense>
  );
}
