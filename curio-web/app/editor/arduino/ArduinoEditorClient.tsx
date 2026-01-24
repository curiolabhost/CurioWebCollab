"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import ArduinoEditor from "@/src/lesson-core/ArduinoEditor";

export default function ArduinoEditorClient() {
  const sp = useSearchParams();

  const key = sp.get("key") ?? undefined;
  const fileToken = sp.get("fileToken") ?? undefined;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ArduinoEditor storageKey={key} fileToken={fileToken} />
    </div>
  );
}
