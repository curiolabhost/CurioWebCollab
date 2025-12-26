"use client";

import { useEffect, useState } from "react";
import { LoginPage } from "../components/LoginPage";
import { HomePage } from "../components/HomePage";

interface User {
  email: string;
  name: string;
}

type View = "home" | "login" | "dashboard";

export default function AccountSetupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("home");

  useEffect(() => {
    // If you have a saved user, show "dashboard" INSIDE this route
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setCurrentView("dashboard");
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem("currentUser");
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setCurrentView("dashboard"); // stay on /account-setup
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    setCurrentView("home"); // back to home view
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // HOME VIEW
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <HomePage
          onNavigateToLogin={() => setCurrentView("login")}
          // if user exists, go to dashboard view (NOT /projects)
          onNavigateToDashboard={() =>
            user ? setCurrentView("dashboard") : setCurrentView("login")
          }
        />
      </div>
    );
  }

  // LOGIN VIEW
  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  // DASHBOARD VIEW (inside /account-setup)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView("home")}
            className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            ← Back to Home
          </button>

          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Log out
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-gray-600">
            This is your dashboard area (still on <span className="font-mono">/account-setup</span>).
          </p>

          <div className="mt-6">
            <div className="text-gray-900 font-medium mb-2">Next steps</div>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Add your “Project menu” here</li>
              <li>Or link to lessons later once you decide routes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
