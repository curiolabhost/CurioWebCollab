"use client";

import * as React from "react";

type SplitViewProps = {
  left: React.ReactNode;
  right?: React.ReactNode;

  // Controlled width (optional)
  leftPx?: number;
  onLeftPxChange?: (px: number) => void;
  onResizeEnd?: (px: number) => void;

  // Default (used only if no persisted value and no controlled leftPx)
  initialLeftRatio?: number;

  // Optional: persist the ratio across close/reopen
  persistKey?: string | null;

  // Constraints
  minLeftPx?: number;
  minRightPx?: number;
  minLeftRatio?: number; // 0.35 etc
  maxLeftRatio?: number;

  // Divider
  handleWidth?: number;

  // Disable resizing
  locked?: boolean;

  // Hard-set right pane width (disables resizing)
  fixedRightPx?: number | null;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function readPersistedRatio(key: string | null | undefined): number | null {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    const r = raw != null ? Number(raw) : null;
    if (r != null && Number.isFinite(r) && r > 0 && r < 1) return r;
  } catch {}
  return null;
}

function writePersistedRatio(key: string | null | undefined, ratio: number) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, String(ratio));
  } catch {}
}

export default function SplitView({
  left,
  right,

  leftPx,
  onLeftPxChange,
  onResizeEnd,

  initialLeftRatio = 0.6,
  persistKey = null,

  minLeftPx = 200,
  minRightPx = 0,
  minLeftRatio = 0,
  maxLeftRatio = 0.85,

  handleWidth = 12,

  locked = false,
  fixedRightPx = null,
}: SplitViewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [containerW, setContainerW] = React.useState(0);
  const [internalLeftPx, setInternalLeftPx] = React.useState<number | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const containerWRef = React.useRef(0);
  const leftPxRef = React.useRef<number | null>(null);
  const dragStartXRef = React.useRef(0);
  const dragStartLeftRef = React.useRef(0);
  const persistedRatioRef = React.useRef<number | null>(null);

  /* ===============================
     Measure container width
  =============================== */
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      setContainerW(w);
    });

    ro.observe(el);
    setContainerW(el.getBoundingClientRect().width);

    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    containerWRef.current = containerW;
  }, [containerW]);

  const effectiveLeftPx = leftPx != null ? leftPx : internalLeftPx;

  React.useEffect(() => {
    leftPxRef.current = effectiveLeftPx;
  }, [effectiveLeftPx]);

  /* ===============================
     Constraints
  =============================== */
  const constraints = React.useMemo(() => {
    const w = containerW || 0;

    const minLeftByRatio = minLeftRatio > 0 ? w * minLeftRatio : 0;
    const minLeft = Math.max(minLeftPx, minLeftByRatio);

    const maxLeftByRatio = w * maxLeftRatio;

    let maxLeftByRight = w;
    if (fixedRightPx != null) {
      maxLeftByRight = w - handleWidth - fixedRightPx;
    } else if (minRightPx > 0) {
      maxLeftByRight = w - handleWidth - minRightPx;
    }

    const maxLeft = Math.min(maxLeftByRatio, maxLeftByRight);

    return { minLeft, maxLeft };
  }, [
    containerW,
    minLeftPx,
    minRightPx,
    minLeftRatio,
    maxLeftRatio,
    fixedRightPx,
    handleWidth,
  ]);

  /* ===============================
     Load persisted ratio
  =============================== */
  React.useEffect(() => {
    persistedRatioRef.current = readPersistedRatio(persistKey);
  }, [persistKey]);

  /* ===============================
     Initialize left width
  =============================== */
  React.useEffect(() => {
    if (!containerW) return;

    // fixed right forces left
    if (fixedRightPx != null) {
      const forcedLeft = containerW - handleWidth - fixedRightPx;
      const clamped = clamp(forcedLeft, constraints.minLeft, constraints.maxLeft);

      if (leftPx != null) onLeftPxChange?.(clamped);
      else setInternalLeftPx(clamped);
      return;
    }

    // controlled mode
    if (leftPx != null) return;

    if (internalLeftPx != null) return;

    const ratio =
      persistedRatioRef.current != null
        ? persistedRatioRef.current
        : initialLeftRatio;

    const next = clamp(containerW * ratio, constraints.minLeft, constraints.maxLeft);
    setInternalLeftPx(next);
  }, [
    containerW,
    fixedRightPx,
    handleWidth,
    constraints.minLeft,
    constraints.maxLeft,
    initialLeftRatio,
    leftPx,
    internalLeftPx,
    onLeftPxChange,
  ]);

  function commitLeftPx(px: number) {
    if (leftPx != null) onLeftPxChange?.(px);
    else setInternalLeftPx(px);
  }

  function persistCurrentRatio() {
    if (!persistKey) return;
    const w = containerWRef.current;
    const lw = leftPxRef.current;
    if (!w || lw == null) return;

    const ratio = lw / w;
    if (!(ratio > 0 && ratio < 1)) return;

    persistedRatioRef.current = ratio;
    writePersistedRatio(persistKey, ratio);
  }

  function startDrag(clientX: number) {
    if (locked || fixedRightPx != null) return;
    if (!containerWRef.current) return;

    setDragging(true);
    dragStartXRef.current = clientX;

    dragStartLeftRef.current =
      leftPxRef.current != null
        ? leftPxRef.current
        : containerWRef.current * initialLeftRatio;
  }

  function applyDrag(clientX: number) {
    const w = containerWRef.current;
    if (!w) return;

    const dx = clientX - dragStartXRef.current;
    const next = clamp(
      dragStartLeftRef.current + dx,
      constraints.minLeft,
      constraints.maxLeft
    );

    commitLeftPx(next);
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);

    persistCurrentRatio();

    const px = leftPxRef.current;
    if (typeof px === "number") onResizeEnd?.(px);
  }

  /* ===============================
     Window listeners while dragging
  =============================== */
  React.useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      applyDrag(e.clientX);
    };
    const onMouseUp = () => endDrag();

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches?.[0];
      if (!t) return;
      applyDrag(t.clientX);
    };
    const onTouchEnd = () => endDrag();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [dragging, constraints.minLeft, constraints.maxLeft]);

  const resolvedLeft =
    effectiveLeftPx != null
      ? effectiveLeftPx
      : containerW
      ? containerW * initialLeftRatio
      : 0;

  const leftWidth = clamp(resolvedLeft, constraints.minLeft, constraints.maxLeft);

  const rightStyle: React.CSSProperties =
    fixedRightPx != null
      ? { width: fixedRightPx, minWidth: fixedRightPx }
      : { flex: 1, minWidth: 0 };

  const handleCursor: React.CSSProperties = {
    cursor: locked || fixedRightPx != null ? "default" : "col-resize",
    userSelect: "none",
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", height: "100%", position: "relative" }}
    >
      {/* LEFT */}
      <div style={{ width: leftWidth, minWidth: constraints.minLeft, overflow: "hidden" }}>
        {left}
      </div>

      {/* HANDLE */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag(e.clientX);
        }}
        onTouchStart={(e) => {
          const t = e.touches?.[0];
          if (!t) return;
          startDrag(t.clientX);
        }}
        style={{
          width: handleWidth,
          background: "rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          opacity: locked || fixedRightPx != null ? 0.3 : 1,
          ...handleCursor,
        }}
      >
        <div
          style={{
            width: 2,
            height: 30,
            borderRadius: 2,
            background: "rgba(0,0,0,0.32)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* RIGHT */}
      <div style={rightStyle}>{right}</div>

      {/* overlay while dragging */}
      {dragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
