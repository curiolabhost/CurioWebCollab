// app/admin/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StudentsView } from "../components/admin/StudentsView";
import { ProjectsView } from "../components/admin/ProjectsView";

function AdminContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  return (
    <>
      {view === "projects" ? <ProjectsView /> : <StudentsView />}
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}