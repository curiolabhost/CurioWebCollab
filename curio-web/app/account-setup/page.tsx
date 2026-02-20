// account-setup/page.tsx
// This is the landing page for the account setup flow. It checks if the user is signed in and redirects to the dashboard if they are. If not, it shows a welcome page with a button to navigate to the login page.

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { HomePage } from "../components/HomePage";

export default function AccountSetupPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HomePage
        onNavigateToLogin={() => router.push("/account-setup/login")}
        onNavigateToDashboard={() => router.push("/dashboard")}
      />
    </div>
  );
}
