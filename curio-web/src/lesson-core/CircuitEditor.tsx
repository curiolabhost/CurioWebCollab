"use client";

import * as React from "react";

type CircuitEditorProps = {
  screenTitle?: string;

  wokwiUrlKey: string;
  codeKey: string;
  diagramKey: string;

  defaultWokwiUrl?: string;

  height?: string | number;
  width?: string | number;

  showExit?: boolean;
  onExit?: () => void;
  projectSlug?: string;
  lessonSlug?: string;

  /** When provided (e.g. admin view), use this instead of fetching from API */
  initialCircuitState?: { wokwiUrl: string | null; diagramJson: any } | null;
  /** When true, display only; no save to server or localStorage */
  readOnly?: boolean;
};

async function fetchCircuitState(projectSlug: string, lessonSlug: string) {
  const qs = new URLSearchParams({ projectSlug, lessonSlug });
  const res = await fetch(`/api/circuit-state?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as {
    ok: boolean;
    circuit?: { wokwiUrl?: string | null; diagramJson?: any; updatedAt?: string } | null;
  };
}

async function saveCircuitState(
  projectSlug: string,
  lessonSlug: string,
  payload: { wokwiUrl?: string | null; diagramJson?: any | null }
) {
  const res = await fetch("/api/circuit-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectSlug, lessonSlug, ...payload }),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    ok: boolean;
    circuit?: { wokwiUrl?: string | null; diagramJson?: any; updatedAt?: string } | null;
  };
}


export default function CircuitEditor({
  screenTitle = "Circuit",
  wokwiUrlKey,
  codeKey,
  diagramKey,
  defaultWokwiUrl = "",
  height = "100%",
  width = "100%",
  showExit = false,
  projectSlug,
  lessonSlug,
  initialCircuitState,
  readOnly = false,
  onExit,
}: CircuitEditorProps) {
  const hasWindow = typeof window !== "undefined";
  const storage = React.useMemo(() => (hasWindow ? window.localStorage : null), [hasWindow]);

  const [wokwiUrl, setWokwiUrl] = React.useState("");
  const [wokwiUrlDraft, setWokwiUrlDraft] = React.useState("");

  const [diagramDraft, setDiagramDraft] = React.useState("");
  const [savedDiagram, setSavedDiagram] = React.useState("");

  // toggle the Load panel (link + diagram.json)
  const [showLoad, setShowLoad] = React.useState(false);

  const [status, setStatus] = React.useState("Ready.");
  const [isSaving, setIsSaving] = React.useState(false);


  React.useEffect(() => {
    if (!storage) return;

    // Admin view: use provided initial state, skip fetch
    if (initialCircuitState != null) {
      const urlToUse = initialCircuitState.wokwiUrl ?? defaultWokwiUrl ?? "";
      const diag =
        initialCircuitState.diagramJson != null
          ? JSON.stringify(initialCircuitState.diagramJson, null, 2)
          : "";
      setWokwiUrl(urlToUse);
      setWokwiUrlDraft(urlToUse);
      setSavedDiagram(diag);
      setDiagramDraft(diag);
      setStatus(readOnly ? "Admin view (read-only)" : "Loaded from admin state.");
      return;
    }

    const canServer = !!(projectSlug && lessonSlug);

    (async () => {
      try {
        if (canServer) {
          const r = await fetchCircuitState(projectSlug!, lessonSlug!);
          const serverUrl = r?.ok ? (r.circuit?.wokwiUrl ?? "") : "";
          const serverDiag = r?.ok && r.circuit?.diagramJson ? JSON.stringify(r.circuit.diagramJson, null, 2) : "";

          if (serverUrl || serverDiag) {
            const urlToUse = serverUrl || defaultWokwiUrl || "";
            setWokwiUrl(urlToUse);
            setWokwiUrlDraft(urlToUse);
            setSavedDiagram(serverDiag);
            setDiagramDraft(serverDiag);

            if (!readOnly) {
              try {
                storage.setItem(wokwiUrlKey, urlToUse);
                storage.setItem(diagramKey, serverDiag);
              } catch {}
            }

            setStatus("Loaded from server.");
            return;
          }
        }

        const savedUrl = storage.getItem(wokwiUrlKey) || "";
        const urlToUse = savedUrl || defaultWokwiUrl || "";
        setWokwiUrl(urlToUse);
        setWokwiUrlDraft(urlToUse);

        const savedDiag = storage.getItem(diagramKey) || "";
        setSavedDiagram(savedDiag);
        setDiagramDraft(savedDiag);

        setStatus("Loaded from device.");
      } catch {
        setStatus("Load failed.");
      }
    })();
  }, [storage, wokwiUrlKey, diagramKey, defaultWokwiUrl, projectSlug, lessonSlug, initialCircuitState, readOnly]);

  const isLikelyWokwiUrl = (u: string) => {
    if (!u) return false;
    try {
      const url = new URL(u);
      return url.hostname.includes("wokwi.com");
    } catch {
      return false;
    }
  };

  const saveWokwiUrl = async () => {
    if (readOnly) return;
    const next = (wokwiUrlDraft || "").trim();
    if (!next) return alert("Paste a Wokwi share link first.");
    if (!isLikelyWokwiUrl(next)) {
      return alert("That doesn't look like a Wokwi link (should include wokwi.com).");
    }

    storage?.setItem(wokwiUrlKey, next);
    setWokwiUrl(next);

    if (projectSlug && lessonSlug) {
      setIsSaving(true);
      setStatus("Saving link to server...");
      try {
        const r = await saveCircuitState(projectSlug, lessonSlug, { wokwiUrl: next });
        if (!r?.ok) {
          setStatus("Save failed (server).");
          alert("Saved locally, but server save failed.");
          return;
        }
        setStatus("Saved (server).");
      } catch {
        setStatus("Save failed (server).");
        alert("Saved locally, but server save failed.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setStatus("Saved locally.");
    }

    alert("Saved Wokwi link.");
  };


  const openWokwiNewTab = () => {
    if (!wokwiUrl) return alert("No Wokwi link saved yet.");
    window.open(wokwiUrl, "_blank", "noopener,noreferrer");
  };

  const copyCurioCode = async () => {
    const code = storage?.getItem(codeKey) || "";
    if (!code.trim()) {
      alert("No code found. Make sure your Code Editor saves code to localStorage.");
      return;
    }
    await navigator.clipboard.writeText(code);
    alert("Curio code copied. Paste it into Wokwi.");
  };

  const saveDiagramJson = async () => {
    if (readOnly) return;
    const raw = (diagramDraft || "").trim();
    if (!raw) return alert("Paste diagram.json content first.");

    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);

      storage?.setItem(diagramKey, pretty);
      setSavedDiagram(pretty);
      setDiagramDraft(pretty);

      if (projectSlug && lessonSlug) {
        setIsSaving(true);
        setStatus("Saving diagram to server...");
        try {
          const r = await saveCircuitState(projectSlug, lessonSlug, { diagramJson: parsed });
          if (!r?.ok) {
            setStatus("Save failed (server).");
            alert("Saved locally, but server save failed.");
            return;
          }
          setStatus("Saved (server).");
        } catch {
          setStatus("Save failed (server).");
          alert("Saved locally, but server save failed.");
        } finally {
          setIsSaving(false);
        }
      } else {
        setStatus("Saved locally.");
      }

      alert("Saved diagram.json to Curio.");
    } catch {
      alert("diagram.json is not valid JSON. Please paste the full file contents.");
    }
  };

  const copySavedDiagram = async () => {
    if (!savedDiagram.trim()) return alert("No saved diagram.json found yet.");
    await navigator.clipboard.writeText(savedDiagram);
    alert("Saved diagram.json copied.");
  };

  const clearSavedDiagram = () => {
    if (readOnly) return;
    if (!confirm("Clear saved diagram.json backup from Curio?")) return;
    storage?.removeItem(diagramKey);
    setSavedDiagram("");
    setDiagramDraft("");
  };
    const reloadFromServer = async () => {
    if (!projectSlug || !lessonSlug) {
      setStatus("Reload failed: missing project/lesson identity.");
      return;
    }
    setStatus("Reloading from server...");

    try {
      const r = await fetchCircuitState(projectSlug, lessonSlug);
      const serverUrl = r?.ok ? (r.circuit?.wokwiUrl ?? "") : "";
      const serverDiag = r?.ok && r.circuit?.diagramJson ? JSON.stringify(r.circuit.diagramJson, null, 2) : "";

      const urlToUse = serverUrl || defaultWokwiUrl || "";
      setWokwiUrl(urlToUse);
      setWokwiUrlDraft(urlToUse);
      setSavedDiagram(serverDiag);
      setDiagramDraft(serverDiag);

      try {
        storage?.setItem(wokwiUrlKey, urlToUse);
        storage?.setItem(diagramKey, serverDiag);
      } catch {}

      setStatus("Reloaded from server.");
    } catch {
      setStatus("Reload failed (server).");
    }
  };


  return (
    <div
      style={{
        width,
        height,
        minWidth: 260,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #1f2937",
        background: "#020617",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "#020617",
          borderBottom: "1px solid #1f2937",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 12,
          color: "#e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showExit ? (
            <button type="button" onClick={onExit} style={exitButtonStyle}>
              Exit
            </button>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: "#10b981",
              }}
            />
            <span>{screenTitle}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowLoad((v) => !v)}
            style={toolbarButtonStyle}
          >
            {showLoad ? "Close" : "Load"}
          </button>

          <button
            type="button"
            onClick={reloadFromServer}
            style={{ ...toolbarButtonStyle, opacity: !projectSlug || !lessonSlug ? 0.6 : 1 }}
            disabled={!projectSlug || !lessonSlug}
            title={!projectSlug || !lessonSlug ? "Missing projectSlug/lessonSlug" : "Reload from server"}
          >
            ⟳
          </button>


          <button type="button" onClick={copyCurioCode} style={toolbarButtonStyle}>
            Copy Code
          </button>

          <button type="button" onClick={openWokwiNewTab} style={toolbarButtonStyle}>
            Open Wokwi ↗
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* Simulator */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {wokwiUrl ? (
            <iframe
              src={wokwiUrl}
              title="Wokwi Circuit"
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="fullscreen"
            />
          ) : (
            <div style={{ padding: 16, color: "#e5e7eb" }}>
              <h3 style={{ marginTop: 0 }}>No Wokwi link saved yet</h3>
              <p style={{ color: "#cbd5e1" }}>
                Click <b>Load</b> and paste a Wokwi share link, then save it.
              </p>
            </div>
          )}
        </div>

        {/* Load panel */}
        {showLoad ? (
          <div
            style={{
              width: 420,
              borderLeft: "1px solid #1f2937",
              padding: 12,
              overflow: "auto",
              background: "#020617",
              color: "#e5e7eb",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Load</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Wokwi Share Link</div>
              <input
                value={wokwiUrlDraft}
                onChange={(e) => setWokwiUrlDraft(e.target.value)}
                placeholder="https://wokwi.com/projects/..."
                style={{
                  width: "100%",
                  padding: 10,
                  boxSizing: "border-box",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#111827",
                  color: "#e5e7eb",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={saveWokwiUrl} style={toolbarButtonStyle}>
                  Save Link
                </button>
                <button
                  type="button"
                  onClick={() => setWokwiUrlDraft(defaultWokwiUrl || "")}
                  style={toolbarButtonStyle}
                >
                  Use Default
                </button>
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>
                Curio stores this link so your circuit opens automatically next time.
              </p>
            </div>

            <div style={{ borderTop: "1px solid #1f2937", margin: "12px 0" }} />

            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              diagram.json backup (optional)
            </div>
            <p style={{ fontSize: 12, color: "#cbd5e1" }}>
              Export diagram.json from Wokwi and paste here to keep a Curio backup.
            </p>

            <textarea
              value={diagramDraft}
              onChange={(e) => setDiagramDraft(e.target.value)}
              placeholder="Paste diagram.json contents here..."
              style={{
                width: "100%",
                height: 220,
                padding: 10,
                boxSizing: "border-box",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                borderRadius: 10,
                border: "1px solid #374151",
                background: "#111827",
                color: "#e5e7eb",
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={saveDiagramJson} style={toolbarButtonStyle}>
                Save diagram.json
              </button>
              <button type="button" onClick={copySavedDiagram} style={toolbarButtonStyle}>
                Copy saved
              </button>
              <button type="button" onClick={clearSavedDiagram} style={toolbarButtonStyle}>
                Clear saved
              </button>
            </div>

            {savedDiagram.trim() ? (
              <p style={{ marginTop: 10, fontSize: 12, color: "#34d399" }}>
                ✓ Curio has a saved diagram.json backup.
              </p>
            ) : (
              <p style={{ marginTop: 10, fontSize: 12, color: "#fca5a5" }}>
                No diagram.json backup saved yet.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const toolbarButtonStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const exitButtonStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid transparent",
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};
