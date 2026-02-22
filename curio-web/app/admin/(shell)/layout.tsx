// app/admin/(shell)/layout.tsx
import * as React from "react";
import AdminShellClient from "./AdminShellClient";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}