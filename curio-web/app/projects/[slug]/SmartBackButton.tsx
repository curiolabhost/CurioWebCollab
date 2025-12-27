"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

export default function SmartBackButton({ label = "Back" }: { label?: string }) {
  const [href, setHref] = useState("/account-setup");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) setHref("/dashboard");
      else setHref("/account-setup");
    } catch {
      setHref("/account-setup");
    }
  }, []);

  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ChevronLeft className="w-5 h-5" />
      {label}
    </Link>
  );
}
