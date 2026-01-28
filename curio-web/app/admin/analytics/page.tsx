import * as React from "react";
import AnalyticsClient from "./AnalyticsClient";

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<div className="p-6" />}>
      <AnalyticsClient />
    </React.Suspense>
  );
}
