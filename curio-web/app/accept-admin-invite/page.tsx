import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <AcceptInviteClient />
    </Suspense>
  );
}