"use client";

import * as React from "react";

const KEY = "esb:showEditor";

export function useEditorToggle() {
  const [showEditor, setShowEditor] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v != null) setShowEditor(v === "true");
    } catch {}
  }, []);

  const toggle = React.useCallback(() => {
    setShowEditor((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(KEY, next ? "true" : "false");
      } catch {}
      return next;
    });
  }, []);

  return { showEditor, toggle };
}
