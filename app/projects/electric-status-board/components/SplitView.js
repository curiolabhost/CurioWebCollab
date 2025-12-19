// app/projects/electric-status-board/components/SplitView.js
import React, { useRef, useState, useMemo, useEffect } from "react";
import { View, Platform } from "react-native";

export default function SplitView({
  left,
  right,

  // default behavior (lesson + editor)
  initialLeftRatio = 0.6,

  // constraints (ratio + px)
  minLeftPx = 200,
  minLeftRatio = 0.0, // e.g. 0.35 when you want ratio-limited resizing
  minRightPx = 0,     // e.g. 320 to prevent right pane getting too small
  maxLeftRatio = 0.85,

  // handle
  handleWidth = 12,

  // NEW: lock resizing completely
  locked = false,

  // NEW: hard-set right pane width (for circuit-only editor case)
  fixedRightPx = null, // number like 520 to lock the circuit editor width
}) {
  const [containerW, setContainerW] = useState(0);
  const [leftW, setLeftW] = useState(null);
  const [dragging, setDragging] = useState(false);

  const dragStartXRef = useRef(0);
  const dragStartLeftRef = useRef(0);

  const isWeb = Platform.OS === "web" && typeof window !== "undefined";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Compute constraints based on container width
  const constraints = useMemo(() => {
    const w = containerW || 0;

    // Minimum left width can be driven by px OR ratio
    const minLeftByRatio = minLeftRatio > 0 ? w * minLeftRatio : 0;
    const minLeft = Math.max(minLeftPx, minLeftByRatio);

    // Maximum left width must respect:
    // - maxLeftRatio
    // - minimum right pane px (if provided)
    // - fixed right width (if provided)
    const maxLeftByRatio = w * maxLeftRatio;

    let maxLeftByRight = w; // default no constraint
    if (fixedRightPx != null) {
      maxLeftByRight = w - handleWidth - fixedRightPx;
    } else if (minRightPx > 0) {
      maxLeftByRight = w - handleWidth - minRightPx;
    }

    const maxLeft = Math.min(maxLeftByRatio, maxLeftByRight);

    return { minLeft, maxLeft };
  }, [containerW, minLeftPx, minLeftRatio, maxLeftRatio, minRightPx, fixedRightPx, handleWidth]);

  function onContainerLayout(e) {
    const w = e.nativeEvent.layout.width;
    const prevW = containerW || w;
    setContainerW(w);

    // If right pane is hard-fixed, we hard-force left width too.
    if (fixedRightPx != null) {
      const forcedLeft = w - handleWidth - fixedRightPx;
      setLeftW(clamp(forcedLeft, constraints.minLeft, constraints.maxLeft));
      return;
    }

    if (leftW === null) {
      setLeftW(clamp(w * initialLeftRatio, constraints.minLeft, constraints.maxLeft));
    } else {
      const ratio = leftW / prevW;
      setLeftW(clamp(ratio * w, constraints.minLeft, constraints.maxLeft));
    }
  }

  // If fixedRightPx changes later, enforce it immediately
  useEffect(() => {
    if (!containerW) return;
    if (fixedRightPx == null) return;

    const forcedLeft = containerW - handleWidth - fixedRightPx;
    setLeftW(clamp(forcedLeft, constraints.minLeft, constraints.maxLeft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedRightPx, containerW]);

  const resolvedLeftW =
    leftW !== null ? leftW : containerW * initialLeftRatio;

  const dividerCursor =
    Platform.OS === "web" ? { cursor: locked || fixedRightPx != null ? "default" : "col-resize", userSelect: "none" } : {};

  // ---------- DRAG HANDLERS (WEB only) ----------
  function startDrag(clientX) {
    if (!isWeb) return;
    if (locked || fixedRightPx != null) return;
    if (!containerW) return;

    setDragging(true);
    dragStartXRef.current = clientX;
    const baseLeft = leftW !== null ? leftW : containerW * initialLeftRatio;
    dragStartLeftRef.current = baseLeft;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
  }

  function onMouseDown(e) {
    e.preventDefault();
    startDrag(e.clientX);
  }

  function onTouchStart(e) {
    if (!isWeb) return;
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX);
  }

  function onMouseMove(e) {
    e.preventDefault();
    applyDrag(e.clientX);
  }

  function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    applyDrag(touch.clientX);
  }

  function applyDrag(clientX) {
    if (!containerW) return;
    const dx = clientX - dragStartXRef.current;

    const next = clamp(
      dragStartLeftRef.current + dx,
      constraints.minLeft,
      constraints.maxLeft
    );
    setLeftW(next);
  }

  function endDrag() {
    if (!isWeb) return;
    setDragging(false);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", endDrag);
    window.removeEventListener("touchcancel", endDrag);
  }

  const rightStyle =
    fixedRightPx != null
      ? { width: fixedRightPx, minWidth: fixedRightPx }
      : { flex: 1, minWidth: 0 };

  return (
    <View
      onLayout={onContainerLayout}
      style={{ flex: 1, flexDirection: "row", position: "relative" }}
    >
      {/* LEFT PANE */}
      <View style={{ width: resolvedLeftW, minWidth: constraints.minLeft }}>
        {left}
      </View>

      {/* DRAG HANDLE (disabled when locked/fixedRight) */}
      <View
        onMouseDown={isWeb && !(locked || fixedRightPx != null) ? onMouseDown : undefined}
        onTouchStart={isWeb && !(locked || fixedRightPx != null) ? onTouchStart : undefined}
        style={{
          width: handleWidth,
          backgroundColor: "rgba(0,0,0,0.08)",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          ...dividerCursor,
          opacity: locked || fixedRightPx != null ? 0.3 : 1,
        }}
        pointerEvents={locked || fixedRightPx != null ? "none" : "auto"}
      >
        <View
          pointerEvents="none"
          style={{
            width: 2,
            height: 30,
            borderRadius: 2,
            backgroundColor: "rgba(0,0,0,0.32)",
          }}
        />
      </View>

      {/* RIGHT PANE */}
      <View style={rightStyle}>{right}</View>

      {/* Overlay during drag (web only) */}
      {isWeb && dragging ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          pointerEvents="box-none"
        />
      ) : null}
    </View>
  );
}
