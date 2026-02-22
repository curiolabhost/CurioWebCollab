// app/admin/settings/admins/page.tsx
"use client";
import * as React from "react";

type AdminRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  createdAt: string;
};

type InviteCreator = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
};

type InviteRow = {
  id: string;                 // DB row id
  email: string | null;
  type: "EMAIL" | "CODE";
  token: string | null;       // for EMAIL invites
  code: string | null;        // for CODE invites
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdBy: InviteCreator | null;
};

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function statusForInvite(inv: InviteRow) {
  if (inv.usedAt) return { label: "Accepted", color: "#0f766e", icon: "✅" };
  if (inv.revokedAt) return { label: "Revoked", color: "#6b7280", icon: "🚫" };
  const exp = new Date(inv.expiresAt).getTime();
  if (Date.now() > exp) return { label: "Expired", color: "#b45309", icon: "⏳" };
  return { label: "Pending", color: "#1d4ed8", icon: "📩" };
}

function inviteLinkFor(inviteId: string) {
  const base =
    (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/accept-admin-invite?token=${encodeURIComponent(inviteId)}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function AdminsPage() {
  const [email, setEmail] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");

  const [subject, setSubject] = React.useState("Your Curio admin invite");
  const [message, setMessage] = React.useState(
    [
      "Hi,",
      "",
      "You’ve been invited to become a Curio admin.",
      "",
      "Accept here: {{inviteUrl}}",
      "This link expires on: {{expiresAt}}",
      "",
      "— Curio",
    ].join("\n")
  );

  const [admins, setAdmins] = React.useState<AdminRow[]>([]);
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [copyMsg, setCopyMsg] = React.useState("");

  const [adminCode, setAdminCode] = React.useState("");
  const [adminCodeExpiresAt, setAdminCodeExpiresAt] = React.useState("");
  const [codeMsg, setCodeMsg] = React.useState("");

  async function loadData() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/invites", { method: "GET" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setErr(json?.error ?? "Failed to load admins/invites.");
        return;
      }
      setAdmins(json.admins ?? []);
      setInvites(json.invites ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  async function createInvite() {
    setErr("");
    setOkMsg("");
    setInviteUrl("");
    setCopyMsg("");

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subject, message }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      setErr(json?.error ?? "Failed to create invite.");
      if (json?.inviteUrl) setInviteUrl(json.inviteUrl); // backup link if email send fails
      return;
    }

    setInviteUrl(json.inviteUrl);
    setOkMsg(json.sent ? "Invite email sent." : "Invite created.");
    setEmail("");
    await loadData();
  }

  async function generateAdminCode() {
  setErr("");
  setCodeMsg("");
  setAdminCode("");
  setAdminCodeExpiresAt("");

  const res = await fetch("/api/admin/invites/create-code", { method: "POST" });
  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    setErr(json?.error ?? "Failed to generate admin code.");
    return;
  }

  setAdminCode(String(json.code || ""));
  setAdminCodeExpiresAt(String(json.expiresAt || ""));
  setCodeMsg("Admin code generated.");
}

  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "white",
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 700,
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
    verticalAlign: "top",
  };

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Console</h1>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "7px 14px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#ddddde",
            color: "#353536",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Draft email editor */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, color: "#354790" }}>Invite Email Draft</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <label style={{ fontSize: 12, color: "#2b406b", fontWeight: 500 }}>
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                marginTop: 6,
                width: "100%",
                padding: 10,
                border: "1px solid #6491d5",
                borderRadius: 10,
                fontWeight: 400,
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ fontSize: 12, color: "#3f4655", fontWeight: 500 }}>
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              style={{
                marginTop: 6,
                width: "100%",
                padding: 12,
                fontWeight: 400,
                border: "1px solid #6491d5",
                borderRadius: 10,
                fontSize: 14,
                lineHeight: 1.4,
              }}
            />
          </label>
        </div>
      </div>

      {/* Create invite */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontWeight: 700, color: "#354790", marginBottom: 10 }}>Create Invite</div>

        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="someone@gmail.com"
            style={{ flex: 1, paddingLeft: 17, paddingRight: 10, padding: 6, border: "1px solid #6b98dc", borderRadius: 10 }}
          />
          <button
            onClick={createInvite}
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: "1px solid #355291",
              background: "#4a69ad",
              color: "white",
            }}
          >
            Create invite
          </button>
        </div>

        {err && <p style={{ color: "crimson", marginTop: 10 }}>{err}</p>}
        {okMsg && <p style={{ color: "#047857", marginTop: 10 }}>{okMsg}</p>}

        {inviteUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Backup link (copy if needed):</div>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(inviteUrl);
                  setCopyMsg(ok ? "Copied!" : "Copy failed");
                  setTimeout(() => setCopyMsg(""), 1200);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  fontSize: 13,
                }}
              >
                Copy
              </button>
            </div>

            {!!copyMsg && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{copyMsg}</div>}

            <code style={{ display: "block", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginTop: 8 }}>
              {inviteUrl}
            </code>
          </div>
        )}
      </div>

      {/* Generate Admin Code (backup option) */}
<div style={{ ...card, marginTop: 14 }}>
  <div style={{ fontWeight: 700, color: "#354790", marginBottom: 10 }}>Backup Option: Admin Code</div>

  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
    Generate a single-use code (expires in 7 days). A signed-in student can enter it to become an admin.
  </div>

  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <button
      onClick={generateAdminCode}
      style={{
        padding: "6px 14px",
        borderRadius: 10,
        border: "1px solid #355291",
        background: "#4a69ad",
        color: "white",
      }}
    >
      Generate code
    </button>

    {codeMsg ? <span style={{ color: "#047857", fontSize: 13 }}>{codeMsg}</span> : null}
  </div>

  {adminCode ? (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Code (expires {adminCodeExpiresAt ? fmtDate(adminCodeExpiresAt) : "in 7 days"}):
        </div>

        <button
          onClick={async () => {
            const ok = await copyToClipboard(adminCode);
            setCopyMsg(ok ? "Copied!" : "Copy failed");
            setTimeout(() => setCopyMsg(""), 1200);
          }}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "white",
            fontSize: 13,
          }}
        >
          Copy
        </button>
      </div>

      {!!copyMsg && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{copyMsg}</div>}

      <code style={{ display: "block", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginTop: 8 }}>
        {adminCode}
      </code>
    </div>
  ) : null}
</div>

      {/* Admins table */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Admins</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Name</th>
                <th style={th}>Added</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td style={td}>{a.email ?? <span style={{ color: "#6b7280" }}>—</span>}</td>
                  <td style={td}>{a.fullName ?? <span style={{ color: "#6b7280" }}>—</span>}</td>
                  <td style={td}>{fmtDate(a.createdAt)}</td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td style={td} colSpan={3}>
                    <span style={{ color: "#6b7280" }}>No admins found.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invites table */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Invites</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={th}>Invitee Email</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Expires</th>
                <th style={th}>Accepted</th>
                <th style={th}>Created By</th>
                <th style={th}>Invite Link</th>
                <th style={th}>Admin Code</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const st = statusForInvite(inv);
                const creator = inv.createdBy;
                const creatorLabel = creator?.fullName
                  ? `${creator.fullName}${creator.email ? ` (${creator.email})` : ""}`
                  : creator?.email ?? null;

                const canUseLink = inv.type === "EMAIL" && !!inv.token && !inv.usedAt && !inv.revokedAt;
                const url = inv.token ? inviteLinkFor(inv.token) : "";

              return (
                <tr key={inv.id}>
                  <td style={td}>{inv.email ?? <span style={{ color: "#6b7280" }}>—</span>}</td>

                  <td style={td}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        color: st.color,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      <span aria-hidden>{st.icon}</span>
                      {st.label}
                    </span>
                  </td>

                  <td style={td}>{fmtDate(inv.createdAt)}</td>
                  <td style={td}>{fmtDate(inv.expiresAt)}</td>
                  <td style={td}>{inv.usedAt ? fmtDate(inv.usedAt) : <span style={{ color: "#6b7280" }}>—</span>}</td>
                  <td style={td}>{creatorLabel ?? <span style={{ color: "#6b7280" }}>—</span>}</td>

                  {/* Invite Link (EMAIL invites only) */}
                  <td style={td}>
                    {inv.type === "EMAIL" && inv.token && !inv.usedAt && !inv.revokedAt ? (
                      (() => {
                        const url = inviteLinkFor(inv.token);
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#2563eb", fontSize: 13, textDecoration: "underline" }}
                            >
                              Open
                            </a>

                            <button
                              onClick={async () => {
                                const ok = await copyToClipboard(url);
                                setCopyMsg(ok ? "Copied!" : "Copy failed");
                                setTimeout(() => setCopyMsg(""), 1200);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border: "1px solid #e5e7eb",
                                background: "white",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <span style={{ color: "#6b7280" }}>—</span>
                    )}
                  </td>

                  {/* Admin Code (CODE invites only) */}
                  <td style={td}>
                    {inv.type === "CODE" && inv.code ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <code
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            fontSize: 12,
                          }}
                        >
                          {inv.code}
                        </code>

                        <button
                          onClick={async () => {
                            const ok = await copyToClipboard(inv.code!);
                            setCopyMsg(ok ? "Copied!" : "Copy failed");
                            setTimeout(() => setCopyMsg(""), 1200);
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            background: "white",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#6b7280" }}>—</span>
                    )}
                  </td>
                </tr>
              );
              })}

              {invites.length === 0 && (
                <tr>
                  <td style={td} colSpan={8}>
                    <span style={{ color: "#6b7280" }}>No invites found.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!!copyMsg && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>{copyMsg}</div>}
      </div>
    </div>
  );
}