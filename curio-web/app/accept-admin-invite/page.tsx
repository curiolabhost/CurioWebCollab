// app/admin/accept-admin-invite/page.tsx
// app/admin/accept-invite/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AcceptInvitePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";

  const [msg, setMsg] = React.useState("Verifying invite…");
  const [detail, setDetail] = React.useState<string | null>(null);

  const didRunRef = React.useRef(false);

  React.useEffect(() => {
    if (didRunRef.current) return; // prevents double-run in dev strict mode
    didRunRef.current = true;

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

      // Handle unauthorized FIRST
      if (res.status === 401) {
        if (cancelled) return;
        setMsg("Please sign in to accept this invite.");
        const back = encodeURIComponent(window.location.href);
        router.replace(`/sign-in?redirect_url=${back}`);
        return;
      }

      const json = await res.json().catch(() => null);
      if (cancelled) return;

      if (res.ok && json?.ok) {
        setMsg("Invite accepted! Redirecting…");
        setDetail(null);
        setTimeout(() => router.replace("/admin"), 400);
        return;
      }

      setMsg("Failed to accept invite.");
      setDetail(json?.error ?? "Please request a new invite link.");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Accept Admin Invite</h1>

      <div
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <div style={{ fontWeight: 700 }}>{msg}</div>
        {detail && <div style={{ marginTop: 8, color: "#6b7280" }}>{detail}</div>}
      </div>
    </div>
  );
}
