// app/admin/layout.tsx
import * as React from "react";
import AdminShellClient from "./AdminShellClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <AdminShellClient>{children}</AdminShellClient>
    </React.Suspense>
  );
}
