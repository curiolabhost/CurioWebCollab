// ArduinoEditorTopBar.tsx
"use client";

import * as React from "react";

export type ArduinoEditorTopBarProps = {
  fileName: string;
  isFileMode: boolean;

  isExplaining: boolean;
  isSaving: boolean;
  hasFileHandle: boolean;


  // Enable/disable server buttons
  canServer: boolean;
  readOnly?: boolean;

  // Actions
  onVerify: () => void;
  onCheckCode: () => void;
  onExpand: () => void;

  onSaveNowToServer: () => void;
  onReloadFromServer: () => void;

  // Files menu
  filesMenuOpen: boolean;
  setFilesMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filesBtnRef: React.RefObject<HTMLButtonElement | null>;
  filesMenuRef: React.RefObject<HTMLDivElement | null>;

  onOpenFile: () => void;
  onSaveFile: () => void;
  onSaveAsFile: () => void;
  onCreateNewFile: () => void;

  // Name formatting (keep in parent if you want)
  safeNameFromPath: (name: string) => string;
};

const toolbarButtonStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 15,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
};

const filesMenuItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 12,
  color: "#e5e7eb",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const filesMenuItemHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
  marginLeft: 10,
};

export default function ArduinoEditorTopBar(props: ArduinoEditorTopBarProps) {
  const {
    fileName,
    isFileMode,
    isExplaining,
    isSaving,
    canServer,
    readOnly = false,
    hasFileHandle,
    onVerify,
    onCheckCode,
    onExpand,
    onSaveNowToServer,
    onReloadFromServer,
    filesMenuOpen,
    setFilesMenuOpen,
    filesBtnRef,
    filesMenuRef,
    onOpenFile,
    onSaveFile,
    onSaveAsFile,
    onCreateNewFile,
    safeNameFromPath,
  } = props;

  return (
    <div
      style={{
        background: "#020617",
        borderBottom: "1px solid #1f2937",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 12,
        color: "#e5e7eb",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "999px", background: "#10b981" }} />
        <span>{safeNameFromPath(fileName)}</span>
        {isFileMode ? (
          <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>(File)</span>
        ) : (
          <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>(Lesson)</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={onVerify} style={toolbarButtonStyle}>
          Verify
        </button>

        <button
          type="button"
          onClick={onCheckCode}
          style={{
            ...toolbarButtonStyle,
            opacity: isExplaining ? 0.5 : 1,
            cursor: isExplaining ? "not-allowed" : "pointer",
          }}
          disabled={isExplaining}
        >
          Check Code
        </button>

        {/* Files dropdown - hidden when read-only (admin view) */}
        {!readOnly && (
        <div style={{ position: "relative" }}>
          <button
            ref={filesBtnRef}
            type="button"
            onClick={() => setFilesMenuOpen((v) => !v)}
            style={{
              ...toolbarButtonStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            aria-haspopup="menu"
            aria-expanded={filesMenuOpen}
          >
            Files <span style={{ opacity: 0.8 }}>▾</span>
          </button>

          {filesMenuOpen ? (
            <div
              ref={filesMenuRef}
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 220,
                background: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                padding: 6,
                zIndex: 2000,
              }}
            >
              <button role="menuitem" type="button" onClick={onOpenFile} style={filesMenuItemStyle}>
                Open…
                <span style={filesMenuItemHintStyle}>from computer</span>
              </button>

              <button role="menuitem" type="button" onClick={onSaveFile} style={filesMenuItemStyle}>
                Save
                <span style={filesMenuItemHintStyle}>{hasFileHandle ? "overwrite" : "Save As"}</span>
              </button>

              <button role="menuitem" type="button" onClick={onSaveAsFile} style={filesMenuItemStyle}>
                Save As…
                <span style={filesMenuItemHintStyle}>choose location</span>
              </button>

              <div style={{ height: 1, background: "#1f2937", margin: "6px 0" }} />

              <button role="menuitem" type="button" onClick={onCreateNewFile} style={filesMenuItemStyle}>
                Create New
                <span style={filesMenuItemHintStyle}>new tab</span>
              </button>
            </div>
          ) : null}
        </div>
        )}

        <button type="button" onClick={onExpand} style={toolbarButtonStyle}>
          Expand
        </button>

        <button
          type="button"
          onClick={onSaveNowToServer}
          style={{
            ...toolbarButtonStyle,
            opacity: isSaving || !canServer ? 0.6 : 1,
            cursor: isSaving || !canServer ? "not-allowed" : "pointer",
          }}
          disabled={isSaving || !canServer}
          title={
            isSaving ? "Saving..." : !canServer ? "Server save disabled" : "Save now to server"
          }
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={onReloadFromServer}
          style={{ ...toolbarButtonStyle, opacity: 0.9 }}
          disabled={!canServer}
          title={!canServer ? "Reload disabled" : "Reload latest code from server"}
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
