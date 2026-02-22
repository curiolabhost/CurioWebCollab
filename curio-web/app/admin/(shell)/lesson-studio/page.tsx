// app/admin/lesson-studio/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBlankProject, listProjects } from "@/app/tools/lessonStudio/_lib/projectStore";
import type { LessonStudioProject } from "@/app/tools/lessonStudio/_lib/projectTypes";

export default function AdminLessonStudioProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<LessonStudioProject[]>([]);

  React.useEffect(() => {
    const refresh = () => setProjects(listProjects());

    refresh();

    // When identity is open in a new tab and saves to localStorage,
    // coming back to this tab should refresh.
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    // Optional: also refresh when tab becomes visible
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  function makeId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function onCreate() {
    const id = makeId("proj");
    const p = createBlankProject(id);

    // refresh list
    setProjects(listProjects());

    // go to identity setup first
    router.push(`/admin/lesson-studio/${p.id}/identity`);
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lesson Studio</h1>
          <p className="text-sm text-gray-600">Pick a project to build lessons.</p>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-md border bg-white text-sm"
          onClick={onCreate}
        >
          + New project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/admin/lesson-studio/${p.id}/identity`}
            className="rounded-xl border p-4 bg-white hover:bg-gray-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="font-semibold">{p.title || p.name || "Untitled Project"}</div>
            {p.shortDescription ? <div className="text-sm text-gray-700 mt-1">{p.shortDescription}</div> : null}
            <div className="text-xs text-gray-500 mt-2">Updated: {new Date(p.updatedAt).toLocaleString()}</div>
          </Link>
        ))}

        {projects.length === 0 ? (
          <div className="text-sm text-gray-500">No projects yet. Click “New project”.</div>
        ) : null}
      </div>
    </div>
  );
}