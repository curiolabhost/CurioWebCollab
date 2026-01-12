// app/account-setup/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomePage } from "../components/HomePage";

interface User {
  email: string;
  name: string;
}

type View = "home" | "login";

export default function AccountSetupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("home");

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        JSON.parse(storedUser) as User;
        // If already logged in, go straight to the real dashboard route
        router.replace("/dashboard");
        return;
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading.</div>
      </div>
    );
  }

  // HOME VIEW
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <HomePage
          // go to the real login route so the URL becomes /account-setup/login
          onNavigateToLogin={() => router.push("/account-setup/login")}
          onNavigateToDashboard={() => {
            const stored = localStorage.getItem("currentUser");
            if (stored) router.push("/dashboard");
            else router.push("/account-setup/login"); // URL updates
          }}
        />
      </div>
    );
  }

  // LOGIN VIEW (kept for backward compatibility, but shouldn't be hit anymore)
  // If anything still toggles currentView to "login", route to the real login page.
  router.replace("/account-setup/login");
  return null;
}
