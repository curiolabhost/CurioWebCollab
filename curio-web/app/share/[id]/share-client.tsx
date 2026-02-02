"use client";

import * as React from "react";
// import your editor component
// import EditorPage from "@/app/editor/[projectId]/EditorPage"; // example
// OR import whatever component hydrates the editor UI

export default function ShareClient({ id }: { id: string }) {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/share/${id}`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error ?? "Not found");
      }
      const json = await res.json();
      if (alive) setData(json);
    })().catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  if (err) return <div style={{ padding: 24 }}>Share link error: {err}</div>;
  if (!data) return <div style={{ padding: 24 }}>Loading shared project…</div>;

  // IMPORTANT:
  // Your editor must support "hydrate from provided data" mode
  // rather than ONLY loading from localStorage by pid.
  return (
    <div style={{ padding: 0 }}>
      {/* Replace this with your editor UI component */}
      <pre style={{ padding: 24 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
