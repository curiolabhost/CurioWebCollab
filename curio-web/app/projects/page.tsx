"use client";

import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();

  const goHome = () => {
    router.push("/account-setup?force=1");
  };

  const logoutAndGoHome = () => {
    localStorage.removeItem("currentUser");
    router.push("/account-setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={goHome}
          className="
            text-sky-600
            hover:text-sky-700
            font-medium
            transition-colors
          "
        >
          ← Back to Home
        </button>

        <button
          onClick={logoutAndGoHome}
          className="
            text-sm
            text-gray-600
            hover:text-gray-800
            transition
          "
        >
          Log out
        </button>
      </div>

      {/* Main content */}
      <main className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Projects
        </h1>
        <p className="text-gray-600">
          Choose a project to get started.
        </p>
      </main>
    </div>
  );
}
