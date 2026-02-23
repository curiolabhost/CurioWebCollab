// app/admin/settings/admins/page.tsx
"use client";
import * as React from "react";

const INVITES_PER_PAGE = 10;
const MAX_INVITE_PAGES = 6;
const MAX_VISIBLE_INVITES = 60;

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
  inviteUrl: string | null;
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
  const [inviteCode, setInviteCode] = React.useState("");
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
      "",
      "If the link doesn't work, use this manual code after you log in in the Dashboard:",
      "{{code}}",
      "",
      "This link expires on: {{expiresAt}}",
      "",
      "— Curio",
    ].join("\n")
  );

  const [admins, setAdmins] = React.useState<AdminRow[]>([]);
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [invitePage, setInvitePage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [copyMsg, setCopyMsg] = React.useState("");


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
      const sliced = (json.invites ?? []).slice(0, MAX_VISIBLE_INVITES);
      setInvites(sliced);
      setInvitePage((p) => {
        const total = Math.min(MAX_INVITE_PAGES, Math.ceil(sliced.length / INVITES_PER_PAGE) || 1);
        return Math.min(p, total);
      });
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
    setInviteCode("");
    setCopyMsg("");

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subject, message }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      setErr(json?.error ?? "Failed to create invite.");
      if (json?.inviteUrl) setInviteUrl(json.inviteUrl);
      if (json?.code) setInviteCode(json.code);
      return;
    }

    setInviteUrl(json.inviteUrl ?? "");
    setInviteCode(json.code ?? "");
    setOkMsg(json.sent ? "Invite email sent." : "Invite created.");
    setEmail("");
    setInvitePage(1);
    await loadData();
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

  const totalPages = Math.min(MAX_INVITE_PAGES, Math.ceil(invites.length / INVITES_PER_PAGE) || 1);
  const pagedInvites = invites.slice((invitePage - 1) * INVITES_PER_PAGE, invitePage * INVITES_PER_PAGE);

  const paginationPages: (number | "ellipsis")[] = (() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (invitePage > 2) pages.push("ellipsis");
    for (let i = Math.max(2, invitePage - 1); i <= Math.min(totalPages - 1, invitePage + 1); i++) {
      if (pages[pages.length - 1] !== i) pages.push(i);
    }
    if (invitePage < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  })();

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <style>{`
        .invite-url-scroll::-webkit-scrollbar { display: none; }
        .invite-url-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
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
            {inviteCode && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
                Manual code: <code style={{ padding: "2px 6px", background: "#f9fafb", borderRadius: 4 }}>{inviteCode}</code>
              </div>
            )}
          </div>
        )}
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
              {pagedInvites.map((inv) => {
                const st = statusForInvite(inv);
                const creator = inv.createdBy;
                const creatorLabel = creator?.fullName
                  ? `${creator.fullName}${creator.email ? ` (${creator.email})` : ""}`
                  : creator?.email ?? null;

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
                    {inv.inviteUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <code
                          className="invite-url-scroll"
                          style={{
                            flex: "0 0 360px",
                            width: 160,
                            minWidth: 160,
                            maxWidth: 160,
                            overflowX: "auto",
                            overflowY: "hidden",
                            whiteSpace: "nowrap",
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            fontSize: 12,
                          }}
                        >
                          {inv.inviteUrl}
                        </code>
                        <button
                          onClick={async () => {
                            const ok = await copyToClipboard(inv.inviteUrl!);
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
                            flexShrink: 0,
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#6b7280" }}>—</span>
                    )}
                  </td>

                  {/* Code (manual code on EMAIL invites) */}
                  <td style={td}>
                    {inv.code ? (
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

        {invites.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => setInvitePage((p) => Math.max(1, p - 1))}
              disabled={invitePage <= 1}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
                fontSize: 13,
                cursor: invitePage <= 1 ? "default" : "pointer",
                opacity: invitePage <= 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            {paginationPages.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#6b7280", fontSize: 13 }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setInvitePage(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: invitePage === p ? "1px solid #4a69ad" : "1px solid #e5e7eb",
                    background: invitePage === p ? "#4a69ad" : "white",
                    color: invitePage === p ? "white" : "#353536",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setInvitePage((p) => Math.min(totalPages, p + 1))}
              disabled={invitePage >= totalPages}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
                fontSize: 13,
                cursor: invitePage >= totalPages ? "default" : "pointer",
                opacity: invitePage >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}

        {!!copyMsg && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>{copyMsg}</div>}
      </div>
    </div>
  );
}