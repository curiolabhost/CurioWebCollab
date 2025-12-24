// local storage of user identity is handled here


"use client";

import { useEffect } from "react";
import { LoginPage } from "../components/LoginPage";

export default function AccountSetupPage() {
  useEffect(() => {
    // If already logged in, go straight to projects
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      //window.location.href = "/projects";
    }
  }, []);

  const handleLogin = (user: { email: string; name: string }) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    //window.location.href = "/projects";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoginPage onLogin={handleLogin} />
    </div>
  );
}
