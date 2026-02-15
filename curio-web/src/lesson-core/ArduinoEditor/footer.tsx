"use client";

import * as React from "react";
import styles from "./ArduinoEditor.module.css";
import type { CoachPayload } from "./arduinoLogic";

function ChatBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "8px 0",
      }}
    >
      {/* assistant dot avatar */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "#111827",
          border: "1px solid #1f2937",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
        aria-hidden
      >
        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e" }} />
      </div>

      <div
        style={{
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: "10px 12px",
          color: "#e5e7eb",
          fontSize: 12,
          lineHeight: 1.5,
          width: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </div>
    </div>
  );
}

type CoachTag = "OK" | "WARN" | "TIP" | "NEXT" | "IDEA";

function coachTagColor(tag: CoachTag) {
  switch (tag) {
    case "OK":
      return "#86efac";
    case "WARN":
      return "#fca5a5";
    case "TIP":
      return "#93c5fd";
    case "NEXT":
      return "#fcd34d";
    case "IDEA":
      return "#c4b5fd";
    default:
      return "#e5e7eb";
  }
}

function coachTagBg(tag: CoachTag) {
  switch (tag) {
    case "OK":
      return "rgba(34,197,94,0.15)";
    case "WARN":
      return "rgba(239,68,68,0.15)";
    case "TIP":
      return "rgba(59,130,246,0.15)";
    case "NEXT":
      return "rgba(245,158,11,0.18)";
    case "IDEA":
      return "rgba(139,92,246,0.15)";
    default:
      return "rgba(148,163,184,0.10)";
  }
}

export type ArduinoEditorFooterProps = {
  bottomHeight: number;
  status: string;
  lastSaved: Date | null;

  compilerOutput: string;
  coachJson: CoachPayload | null;
  coachLive: CoachPayload | null;
  coachRaw: string;

  hasFooterContent: boolean;
};

export default function ArduinoEditorFooter(props: ArduinoEditorFooterProps) {
  const {
    bottomHeight,
    status,
    lastSaved,
    compilerOutput,
    coachJson,
    coachLive,
    coachRaw,
    hasFooterContent,
  } = props;

  const cj = coachJson || coachLive;

  const hasCardData =
    !!cj &&
    Array.isArray((cj as any).sections) &&
    (cj as any).sections.length > 0;

  return (
    <div
      style={{
        height: bottomHeight,
        minHeight: 40,
        borderTop: "1px solid #272e37",
        background: "#191d22",
        position: "relative",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 11,
        zIndex: 50,
        color: "#9ca3af",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Footer header row */}
      <div
        style={{
          padding: "2px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 10,
        }}
      >
        <span>{status}</span>

        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Board: Arduino Uno • Port: Not connected
          {lastSaved && <span style={{ marginLeft: 12 }}>| Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </span>
      </div>

      {/* Footer scroll content */}
      <div
        className={styles.footerScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: hasFooterContent ? "auto" : "hidden",
          padding: hasFooterContent ? "4px 10px 6px" : "0 10px 4px",
        }}
      >
        {(() => {
          // ---- Coach cards UI ----
          if (hasCardData) {
            const safe = cj as any;
            const sections = Array.isArray(safe.sections) ? safe.sections : [];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>
                  {String(safe.summary || "Thinking...")}
                </div>

                {sections.map((sec: any, i: number) => {
                  const items = Array.isArray(sec?.items) ? sec.items : [];

                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
                        {String(sec?.title || "Feedback")}
                      </div>

                      {items.map((it: any, j: number) => (
                        <div
                          key={j}
                          style={{
                            border: "1px solid #1f2937",
                            borderRadius: 10,
                            padding: "8px 10px",
                            background: "#2f343d",
                          }}
                        >
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 999,
                                border: "1px solid #1f2937",
                                background: coachTagBg(it?.tag),
                                color: coachTagColor(it?.tag),
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {String(it?.tag ?? "TIP")}
                            </span>

                            {it?.line != null ? (
                              <span style={{ fontSize: 10, color: "#9ca3af" }}>Line {it.line}</span>
                            ) : null}
                          </div>

                          <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 300, lineHeight: 1.45 }}>
                            <strong style={{ color: "#e5e7eb" }}>{String(it?.text ?? "")}</strong>
                          </div>

                          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                            <div>{String(it?.why ?? "")}</div>

                            <div style={{ marginTop: 4 }}>
                              <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Recommendation:</span>{" "}
                              {String(it?.recommendation ?? "")}
                            </div>
                          </div>

                          {it?.code ? (
                            <pre
                              style={{
                                marginTop: 8,
                                marginBottom: 0,
                                whiteSpace: "pre-wrap",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                                fontSize: 11,
                                color: "#e5e7eb",
                                background: "#060b16",
                                border: "1px solid #1f2937",
                                borderRadius: 10,
                                padding: "8px 10px",
                              }}
                            >
                              {String(it.code)}
                            </pre>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          }

          // ---- If we have JSON but no sections, show it so UI never goes blank ----
          if (cj && !hasCardData) {
            return (
              <ChatBubble>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 11,
                    color: "#cbd5e1",
                    lineHeight: 1.35,
                  }}
                >
                  {JSON.stringify(cj, null, 2)}
                </pre>
              </ChatBubble>
            );
          }

          // ---- Streaming text fallback (coachRaw) ----
          if (coachRaw) {
            return (
              <ChatBubble>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 11,
                    color: "#cbd5e1",
                    lineHeight: 1.35,
                  }}
                >
                  {coachRaw}
                  <span style={{ opacity: 0.6 }}>▍</span>
                </pre>
              </ChatBubble>
            );
          }

          // ---- Compiler output fallback ----
          if (compilerOutput) {
            return (
              <ChatBubble>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 11,
                    color: "#fca5a5",
                    lineHeight: 1.35,
                  }}
                >
                  {compilerOutput}
                </pre>
              </ChatBubble>
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
}
