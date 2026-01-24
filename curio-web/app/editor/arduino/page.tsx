import * as React from "react";
import ArduinoEditorClient from "./ArduinoEditorClient";

export default function Page() {
  return (
    <React.Suspense fallback={<div style={{ width: "100vw", height: "100vh" }} />}>
      <ArduinoEditorClient />
    </React.Suspense>
  );
}
