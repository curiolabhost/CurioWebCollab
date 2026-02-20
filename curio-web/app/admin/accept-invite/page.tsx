// app/admin/accept-invite/page.tsx

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AcceptInvitePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";

  const [msg, setMsg] = React.useState("Verifying invite…");

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setMsg("Missing invite token.");
        return;
      }

      const res = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json().catch(() => null);
      if (cancelled) return;

      if (res.ok && json?.ok) {
        setMsg("Invite accepted! Redirecting…");
        setTimeout(() => router.replace("/admin"), 400);
      } else {
        setMsg(json?.error ?? "Failed to accept invite.");
      }
      if (res.status === 401) {
        const back = encodeURIComponent(window.location.href);
        router.push(`/sign-in?redirect_url=${back}`);
        return;
        }

    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Accept Admin Invite</h1>
      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
