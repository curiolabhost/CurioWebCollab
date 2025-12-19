import React, { useEffect, useMemo, useState } from "react";

export default function CircuitEditor({
  screenTitle = "Circuit",
  wokwiUrlKey,
  codeKey,
  diagramKey,
  defaultWokwiUrl = "",
  height = "100%",
  width = "100%",
  showExit = false,
  onExit,
}) {
  const hasWindow = typeof window !== "undefined";
  const storage = useMemo(() => (hasWindow ? window.localStorage : null), [hasWindow]);

  const [wokwiUrl, setWokwiUrl] = useState("");
  const [wokwiUrlDraft, setWokwiUrlDraft] = useState("");

  const [diagramDraft, setDiagramDraft] = useState("");
  const [savedDiagram, setSavedDiagram] = useState("");

  // NEW: toggle the Load panel (link + diagram.json)
  const [showLoad, setShowLoad] = useState(false);

  useEffect(() => {
    if (!storage) return;

    const savedUrl = storage.getItem(wokwiUrlKey) || "";
    const urlToUse = savedUrl || defaultWokwiUrl || "";
    setWokwiUrl(urlToUse);
    setWokwiUrlDraft(urlToUse);

    const savedDiag = storage.getItem(diagramKey) || "";
    setSavedDiagram(savedDiag);
    setDiagramDraft(savedDiag);
  }, [storage, wokwiUrlKey, diagramKey, defaultWokwiUrl]);

  const isLikelyWokwiUrl = (u) => {
    if (!u) return false;
    try {
      const url = new URL(u);
      return url.hostname.includes("wokwi.com");
    } catch {
      return false;
    }
  };

  const saveWokwiUrl = () => {
    const next = (wokwiUrlDraft || "").trim();
    if (!next) return alert("Paste a Wokwi share link first.");
    if (!isLikelyWokwiUrl(next)) {
      return alert("That doesn't look like a Wokwi link (should include wokwi.com).");
    }
    storage?.setItem(wokwiUrlKey, next);
    setWokwiUrl(next);
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

  const saveDiagramJson = () => {
    const raw = (diagramDraft || "").trim();
    if (!raw) return alert("Paste diagram.json content first.");

    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);
      storage?.setItem(diagramKey, pretty);
      setSavedDiagram(pretty);
      setDiagramDraft(pretty);
      alert("Saved diagram.json to Curio (local backup).");
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
    if (!confirm("Clear saved diagram.json backup from Curio?")) return;
    storage?.removeItem(diagramKey);
    setSavedDiagram("");
    setDiagramDraft("");
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
      {/* Top bar (styled to match ArduinoEditor) */}
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
                <button
                type="button"
                onClick={onExit}
                style={exitButtonStyle}
                >
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

        {/* Load panel (hidden by default) */}
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

            <div style={{ fontWeight: 700, marginBottom: 8 }}>diagram.json backup (optional)</div>
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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

const toolbarButtonStyle = {
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

const exitButtonStyle = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid transparent",
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};

