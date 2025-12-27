// app/account-setup/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "../../components/LoginPage";

export default function AccountSetupLoginPage() {
  const router = useRouter();

  return (
    <LoginPage
      onLogin={(user) => {
        // persist login for other pages (dashboard)
        localStorage.setItem("currentUser", JSON.stringify(user));

        // go to dashboard route
        router.push("/dashboard");
      }}
    />
  );
}
