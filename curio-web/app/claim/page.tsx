import { Suspense } from "react";
import ClaimClient from "./ClaimClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 max-w-xl mx-auto">One moment…</div>}>
      <ClaimClient />
    </Suspense>
  );
}