<<<<<<< HEAD
export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics</h1>
      <p className="text-gray-600">Analytics dashboard coming soon...</p>
    </div>
  );
}
=======
import * as React from "react";
import AnalyticsClient from "./AnalyticsClient";

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<div className="p-6" />}>
      <AnalyticsClient />
    </React.Suspense>
  );
}
>>>>>>> a3896fd86399e894bf76635cc17f6763883ab9f6
