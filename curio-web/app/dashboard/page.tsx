// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHome } from "@/app/components/DashboardHome";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) router.replace("/account-setup/login");
  }, [router]);

  return <DashboardHome />;
}
