"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";

type Props = {
  embedded?: boolean;

  // Optional overrides from componentProps
  menuItems?: string[];
  title?: string;
};

type AnimButton = "next" | "prev" | null;

export default function TotalCountArrayInteractive(props: Props) {
  const {
    embedded,
    menuItems: menuItemsProp,
    title = "Interactive Demo: Array Navigation",
  } = props;

  const menuItems = useMemo(
    () =>
      (menuItemsProp && menuItemsProp.length > 0
        ? menuItemsProp
        : ["Option 1: Clock", "Option 2: Timer", "Option 3: Temp", "Option 4: Status"]
      ).map((s) => String(s)),
    [menuItemsProp]
  );

  const totalCount = menuItems.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingButton, setAnimatingButton] = useState<AnimButton>(null);
  const [animatingStep, setAnimatingStep] = useState(0);
  const [showError, setShowError] = useState(false);
  const [boundsCheckEnabled, setBoundsCheckEnabled] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(false);



  // Reset animation state after a short window
  useEffect(() => {
    if (animatingStep <= 0) return;
    const t = window.setTimeout(() => {
      setAnimatingStep(0);
      setAnimatingButton(null);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [animatingStep]);

    useEffect(() => {
  // flash green every time currentIndex changes
  setHighlightIndex(true);

  const t = window.setTimeout(() => {
    setHighlightIndex(false);
  }, 900); // how long it stays green (ms)

  return () => window.clearTimeout(t);
}, [currentIndex]);

  function clampIndexStart() {
    setCurrentIndex(0);
    setShowError(false);
    setAnimatingStep(0);
    setAnimatingButton(null);
  }

  function safeWrapNext(idx: number) {
    if (idx >= totalCount) return 0;
    return idx;
  }

  function safeWrapPrev(idx: number) {
    if (idx < 0) return totalCount - 1;
    return idx;
  }

  const handleNext = () => {
    if (animatingButton) return;

    setAnimatingButton("next");
    setShowError(false);

    // 1. Button pressed
    setAnimatingStep(1);

    window.setTimeout(() => {
      // 2. Modify index
      setAnimatingStep(2);
      const newIndex = currentIndex + 1;

      window.setTimeout(() => {
        // 3. Check bounds
        setAnimatingStep(3);

        window.setTimeout(() => {
          if (boundsCheckEnabled) {
            // 4. Wrap if needed
            setAnimatingStep(4);
            setCurrentIndex(safeWrapNext(newIndex));
          } else {
            // No bounds checking, show error if out of range
            if (newIndex >= totalCount) {
              setShowError(true);
            } else {
              setCurrentIndex(newIndex);
            }
          }

          window.setTimeout(() => {
            // 5. Update display
            setAnimatingStep(5);
          }, 250);
        }, 350);
      }, 350);
    }, 250);
  };

  const handlePrev = () => {
    if (animatingButton) return;

    setAnimatingButton("prev");
    setShowError(false);

    // 1. Button pressed
    setAnimatingStep(1);

    window.setTimeout(() => {
      // 2. Modify index
      setAnimatingStep(2);
      const newIndex = currentIndex - 1;

      window.setTimeout(() => {
        // 3. Check bounds
        setAnimatingStep(3);

        window.setTimeout(() => {
          if (boundsCheckEnabled) {
            // 4. Wrap if needed
            setAnimatingStep(4);
            setCurrentIndex(safeWrapPrev(newIndex));
          } else {
            // No bounds checking, show error if out of range
            if (newIndex < 0) {
              setShowError(true);
            } else {
              setCurrentIndex(newIndex);
            }
          }

          window.setTimeout(() => {
            // 5. Update display
            setAnimatingStep(5);
          }, 250);
        }, 350);
      }, 350);
    }, 250);
  };

  const lastValidIndex = Math.max(0, totalCount - 1);

  return (
    <div className="w-full pt-6">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-sky-700">{title}</h2>
        <p className="text-gray-600 mt-2">
          Use <span className="font-semibold">current index</span> to point at the selected item, and{" "}
          <span className="font-semibold">total count</span> to prevent going past the end.
        </p>
      </div>

      {/* Three column layout */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left: array view, flow, controls */}
        <div className="col-span-2 space-y-4">
          {/* Concept cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-base font-semibold text-red-900 mb-3">Without total count</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• You do not know where the list ends</li>
                <li>• You cannot wrap back safely</li>
                <li>• You can try to read an item that does not exist</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-base font-semibold text-green-900 mb-3">With total count</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• You know the last valid index</li>
                <li>• You wrap when reaching the end of the list</li>
                <li>• Go back to the top if you go past the end. Go to the end if you go past the first item.</li>
              </ul>
            </div>
          </div>

          {/* Array visualization */}
          <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-4 text-gray-800">Array in memory</h3>

            <div className="space-y-2">
              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                    idx === currentIndex ? "border-sky-600 bg-sky-50 shadow-sm" : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-base ${
                      idx === currentIndex ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {idx}
                  </div>

                  {idx === currentIndex && (
                    <div className="absolute -left-6">
                      <ChevronRight className="w-5 h-5 text-sky-600 animate-pulse" />
                    </div>
                  )}

                  <div className={`flex-1 text-sm ${idx === currentIndex ? "text-sky-900 font-semibold" : "text-gray-600"}`}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
            </div>
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-4 text-gray-700">Current variables</h3>

            <div className="space-y-3">
<div
  className={`p-4 rounded-lg transition-all ${
    highlightIndex ? "bg-emerald-600 text-white" : "bg-sky-50"
  }`}
>
  <div className={`text-xs mb-1 ${highlightIndex ? "text-emerald-100" : "text-gray-600"}`}>
    current index
  </div>
  <div className={`text-3xl font-mono font-bold ${highlightIndex ? "text-white" : "text-sky-700"}`}>
    {currentIndex}
  </div>
</div>


              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">total count</div>
                <div className="text-3xl font-mono font-bold text-purple-700">{totalCount}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">last valid index</div>
                <div className="text-3xl font-mono font-bold text-gray-700">{lastValidIndex}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              Rule: <span className="font-semibold">lastValidIndex = total count - 1</span>
            </div>
          </div>

            {showError && (
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-red-900 mb-1">Index out of bounds</div>
                  <div className="text-xs text-red-700">
                    Bounds checking is off. We tried to access an index that is not inside the array.
                  </div>
                </div>
              </div>
            )}
          </div>



          {/* Controls */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-3 text-gray-800">Controls</h3>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!!animatingButton || totalCount <= 0}
                className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all text-sm ${
                  animatingButton === "prev"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
                }`}
              >
                ← PREV
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!!animatingButton || totalCount <= 0}
                className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all text-sm ${
                  animatingButton === "next"
                    ? "bg-sky-700 text-white"
                    : "bg-sky-600 hover:bg-sky-700 text-white disabled:bg-gray-300"
                }`}
              >
                NEXT →
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
              <div>
                <div className="font-semibold text-sm text-gray-800">Bounds checking</div>
                <div className="text-xs text-gray-600">Uses total count to wrap safely</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBoundsCheckEnabled((v) => !v);
                  clampIndexStart();
                }}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                  boundsCheckEnabled ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                }`}
              >
                {boundsCheckEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <button
              type="button"
              onClick={clampIndexStart}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-all"
            >
              Reset demo
            </button>
          </div>
        </div>

        {/* Right: variables and OLED simulation */}
        <div className="col-span-1 space-y-6">
                      {/* Process flow */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-3 text-gray-700">Process flow</h3>

            <div className="space-y-2 text-sm">
              <div
                className={`p-3 rounded-lg transition-all ${
                  animatingStep >= 1 ? "bg-emerald-600 text-white font-semibold" : "bg-gray-50 text-gray-500"
                }`}
              >
                1. Button pressed
                {animatingStep >= 1 && animatingButton && (
                  <span className="ml-2 text-emerald-100">({animatingButton.toUpperCase()})</span>
                )}
              </div>

              <ChevronDown className={`w-4 h-4 mx-auto ${animatingStep >= 2 ? "text-emerald-600" : "text-gray-300"}`} />

              <div
                className={`p-3 rounded-lg transition-all ${
                  animatingStep >= 2 ? "bg-emerald-600 text-white font-semibold" : "bg-gray-50 text-gray-500"
                }`}
              >
                2. {animatingButton === "next" ? "index = index + 1" : animatingButton === "prev" ? "index = index - 1" : "Modify current index"}
              </div>

              <ChevronDown className={`w-4 h-4 mx-auto ${animatingStep >= 3 ? "text-emerald-600" : "text-gray-300"}`} />

              <div
                className={`p-3 rounded-lg transition-all ${
                  animatingStep >= 3 ? "bg-emerald-600 text-white font-semibold" : "bg-gray-50 text-gray-500"
                }`}
              >
                3. Check bounds using the total count (ex: 4 items)
              </div>

              <ChevronDown className={`w-4 h-4 mx-auto ${animatingStep >= 4 ? "text-emerald-600" : "text-gray-300"}`} />

              <div
                className={`p-3 rounded-lg transition-all ${
                  animatingStep >= 4 ? "bg-emerald-600 text-white font-semibold" : "bg-gray-50 text-gray-500"
                }`}
              >
                4. Wrap if needed
              </div>

              <ChevronDown className={`w-4 h-4 mx-auto ${animatingStep >= 5 ? "text-emerald-600" : "text-gray-300"}`} />

              <div
                className={`p-3 rounded-lg transition-all ${
                  animatingStep >= 5 ? "bg-emerald-600 text-white font-semibold" : "bg-gray-50 text-gray-500"
                }`}
              >
                5. Update display
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border-4 border-gray-700 shadow-sm">
            <div className="text-green-400 font-mono text-sm space-y-2">
              <div className="border-b border-green-700 pb-2 mb-3">
                <div className="text-center font-semibold">MENU DISPLAY</div>
              </div>

              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-300 ${
                    idx === currentIndex ? "text-yellow-300 font-bold" : "text-green-400"
                  }`}
                >
                  {idx === currentIndex ? "> " : "  "}
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Tiny note for embedded mode */}
          {embedded && (
            <div className="text-xs text-gray-500">
              Tip: this interactive is embedded inside the lesson step, so it avoids full screen layout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
