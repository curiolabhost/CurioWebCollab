"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function ClaimPage() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [status, setStatus] = useState<"idle" | "linking" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/claim?token=${token}`)}`);
      return;
    }

    async function run() {
      if (!token) {
        setStatus("error");
        setError("Missing token.");
        return;
      }
      setStatus("linking");

      const res = await fetch("/api/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "Failed to link account.");
        return;
      }

      setStatus("done");
      router.push("/dashboard");
    }

    run();
  }, [isLoaded, isSignedIn, token, router]);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Linking your account</h1>
      {status === "idle" || status === "linking" ? (
        <p>One moment…</p>
      ) : status === "done" ? (
        <p>Linked! Redirecting…</p>
      ) : (
        <p className="text-red-600">Error: {error}</p>
      )}
    </div>
  );
}