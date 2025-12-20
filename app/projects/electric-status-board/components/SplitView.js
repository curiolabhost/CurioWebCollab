import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Platform, PanResponder } from "react-native";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

// Optional AsyncStorage support (native persistence)
let AsyncStorage = null;
try {
  // eslint-disable-next-line global-require
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

async function readPersistedRatio(key) {
  if (!key) return null;

  // Web: localStorage
  if (isWeb) {
    try {
      const raw = window.localStorage.getItem(key);
      const r = raw != null ? Number(raw) : null;
      if (r != null && Number.isFinite(r) && r > 0 && r < 1) return r;
    } catch {}
    return null;
  }

  // Native: AsyncStorage (if available)
  if (AsyncStorage) {
    try {
      const raw = await AsyncStorage.getItem(key);
      const r = raw != null ? Number(raw) : null;
      if (r != null && Number.isFinite(r) && r > 0 && r < 1) return r;
    } catch {}
  }
  return null;
}

async function writePersistedRatio(key, ratio) {
  if (!key) return;

  const value = String(ratio);

  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    return;
  }

  if (AsyncStorage) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  }
}

export default function SplitView({
  left,
  right,

  // Default (used only if no persisted value and no controlled leftPx)
  initialLeftRatio = 0.6,

  // Optional: persist the ratio across close/reopen
  persistKey = null,

  // Constraints
  minLeftPx = 200,
  minRightPx = 0,
  minLeftRatio = 0,   // 0.35 etc
  maxLeftRatio = 0.85,

  // Divider
  handleWidth = 12,

  // Disable resizing
  locked = false,

  // Hard-set right pane width (disables resizing)
  fixedRightPx = null,

  // Controlled mode (optional):
  // If you pass leftPx, SplitView will use it and call onLeftPxChange during drag.
  leftPx = null,
  onLeftPxChange = null,

  // Callback after resize ends
  onResizeEnd = null,
}) {
  const [containerW, setContainerW] = useState(0);
  const [internalLeftPx, setInternalLeftPx] = useState(null);
  const [dragging, setDragging] = useState(false);

  const containerWRef = useRef(0);
  const leftPxRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragStartLeftRef = useRef(0);
  const didInitFromPersistRef = useRef(false);
  const persistedRatioRef = useRef(null);

  // Keep refs fresh
  useEffect(() => {
    containerWRef.current = containerW;
  }, [containerW]);

  const effectiveLeftPx = leftPx != null ? leftPx : internalLeftPx;

  useEffect(() => {
    leftPxRef.current = effectiveLeftPx;
  }, [effectiveLeftPx]);

  // Compute constraints based on container width
  const constraints = useMemo(() => {
    const w = containerW || 0;

    const minLeftByRatio = minLeftRatio > 0 ? w * minLeftRatio : 0;
    const minLeft = Math.max(minLeftPx, minLeftByRatio);

    const maxLeftByRatio = w * maxLeftRatio;

    let maxLeftByRight = w; // default
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

  // Load persisted ratio once
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!persistKey) return;
      const r = await readPersistedRatio(persistKey);
      if (!alive) return;
      if (r != null) {
        persistedRatioRef.current = r;
      }
    })();
    return () => {
      alive = false;
    };
  }, [persistKey]);

  // Initialize size when we first know container width
  useEffect(() => {
    if (!containerW) return;

    // If right pane is fixed, force left size accordingly
    if (fixedRightPx != null) {
      const forcedLeft = containerW - handleWidth - fixedRightPx;
      const clamped = clamp(forcedLeft, constraints.minLeft, constraints.maxLeft);

      if (leftPx != null) {
        // controlled
        onLeftPxChange?.(clamped);
      } else {
        setInternalLeftPx(clamped);
      }
      didInitFromPersistRef.current = true;
      return;
    }

    // If we’re controlled and already have a leftPx, don’t auto-initialize
    if (leftPx != null) return;

    // If we already have internal px, don’t re-init
    if (internalLeftPx != null) return;

    // Use persisted ratio if available, else initialLeftRatio
    const ratioToUse =
      persistedRatioRef.current != null ? persistedRatioRef.current : initialLeftRatio;

    const next = clamp(containerW * ratioToUse, constraints.minLeft, constraints.maxLeft);
    setInternalLeftPx(next);
    didInitFromPersistRef.current = true;
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

  function commitLeftPx(nextLeftPx) {
    if (leftPx != null) onLeftPxChange?.(nextLeftPx);
    else setInternalLeftPx(nextLeftPx);
  }

  // Persist ratio at end of drag
  async function persistCurrentRatio() {
    if (!persistKey) return;
    if (!containerWRef.current) return;
    const lw = leftPxRef.current;
    if (lw == null) return;

    const ratio = lw / containerWRef.current;
    if (!(ratio > 0 && ratio < 1)) return;

    persistedRatioRef.current = ratio;
    await writePersistedRatio(persistKey, ratio);
  }

  function startDrag(clientX) {
    if (locked || fixedRightPx != null) return;
    if (!containerWRef.current) return;

    setDragging(true);
    dragStartXRef.current = clientX;
    const baseLeft = leftPxRef.current != null ? leftPxRef.current : containerWRef.current * initialLeftRatio;
    dragStartLeftRef.current = baseLeft;
  }

  function applyDrag(clientX) {
    const w = containerWRef.current;
    if (!w) return;

    const dx = clientX - dragStartXRef.current;
    const next = clamp(dragStartLeftRef.current + dx, constraints.minLeft, constraints.maxLeft);

    commitLeftPx(next);
  }

  async function endDrag() {
    if (!dragging) return;
    setDragging(false);

    await persistCurrentRatio();
    onResizeEnd?.(leftPxRef.current);
  }

  // Web: mouse/touch listeners on window
  useEffect(() => {
    if (!isWeb) return;
    if (!dragging) return;

    function onMouseMove(e) {
      e.preventDefault();
      applyDrag(e.clientX);
    }
    function onMouseUp() {
      endDrag();
    }
    function onTouchMove(e) {
      e.preventDefault();
      const t = e.touches?.[0];
      if (!t) return;
      applyDrag(t.clientX);
    }
    function onTouchEnd() {
      endDrag();
    }

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

  // Native: PanResponder
  const panResponder = useMemo(() => {
    if (isWeb) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !(locked || fixedRightPx != null),
      onMoveShouldSetPanResponder: () => !(locked || fixedRightPx != null),
      onPanResponderGrant: (evt) => {
        const x = evt?.nativeEvent?.pageX ?? 0;
        startDrag(x);
      },
      onPanResponderMove: (evt) => {
        const x = evt?.nativeEvent?.pageX ?? 0;
        applyDrag(x);
      },
      onPanResponderRelease: () => {
        endDrag();
      },
      onPanResponderTerminate: () => {
        endDrag();
      },
    });
  }, [locked, fixedRightPx, constraints.minLeft, constraints.maxLeft]);

  const resolvedLeft =
    effectiveLeftPx != null
      ? effectiveLeftPx
      : containerW
      ? containerW * initialLeftRatio
      : 0;

  const dividerCursor =
    isWeb ? { cursor: locked || fixedRightPx != null ? "default" : "col-resize", userSelect: "none" } : {};

  const rightStyle =
    fixedRightPx != null
      ? { width: fixedRightPx, minWidth: fixedRightPx }
      : { flex: 1, minWidth: 0 };

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setContainerW(w);
      }}
      style={{ flex: 1, flexDirection: "row", position: "relative" }}
    >
      {/* LEFT */}
      <View style={{ width: clamp(resolvedLeft, constraints.minLeft, constraints.maxLeft), minWidth: constraints.minLeft }}>
        {left}
      </View>

      {/* HANDLE */}
      <View
        {...(isWeb
          ? {
              onMouseDown: (e) => {
                e.preventDefault();
                startDrag(e.clientX);
              },
              onTouchStart: (e) => {
                const t = e.touches?.[0];
                if (!t) return;
                startDrag(t.clientX);
              },
            }
          : panResponder
          ? panResponder.panHandlers
          : {})}
        style={{
          width: handleWidth,
          backgroundColor: "rgba(0,0,0,0.08)",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          opacity: locked || fixedRightPx != null ? 0.3 : 1,
          ...dividerCursor,
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

      {/* RIGHT */}
      <View style={rightStyle}>{right}</View>

      {/* overlay while dragging (prevents weird selections on web) */}
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
