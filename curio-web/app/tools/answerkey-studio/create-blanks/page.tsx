"use client";

import * as React from "react";
import Link from "next/link";

const LS_PROJECTS = "curio:createblanks:projects:v1";

function loadProjects(): string[] {
  try {
    const raw = localStorage.getItem(LS_PROJECTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: string[]) {
  localStorage.setItem(LS_PROJECTS, JSON.stringify(projects));
}

function normalizeId(s: string) {
  return s.trim().replace(/\s+/g, "-");
}

export default function CreateBlanksProjectsPage() {
  const [projects, setProjects] = React.useState<string[]>([]);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    setProjects(loadProjects());
  }, []);

  function createProject() {
    const id = normalizeId(name);
    if (!id) return;

    const next = Array.from(new Set([id, ...projects]));
    setProjects(next);
    saveProjects(next);
    setName("");
  }

  function removeProject(id: string) {
    const next = projects.filter((p) => p !== id);
    setProjects(next);
    saveProjects(next);
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
        >
          ← Back
        </button>

        <h1 className="text-xl font-semibold">Create Blanks Projects</h1>
      </div>

      <div className="rounded-2xl border p-4 mb-4">
        <div className="text-sm opacity-70 mb-2">
          Make a new project ID (it becomes the URL).
        </div>

        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border px-3 py-2 font-mono text-sm"
            placeholder='e.g. "focusboard" or "lesson-01"'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            onClick={createProject}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Create
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="text-sm opacity-70">No projects yet.</div>
        ) : (
          projects.map((id) => (
            <div
              key={id}
              className="rounded-2xl border p-4 flex items-center justify-between"
            >
              <div className="font-mono">{id}</div>
              <div className="flex gap-2">
                <Link
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-indigo-100"
                  href={`/tools/answerkey-studio/create-blanks/${encodeURIComponent(
                    id
                  )}`}
                >
                  Open →
                </Link>
                <button
                  type="button"
                  onClick={() => removeProject(id)}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
