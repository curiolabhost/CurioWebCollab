// app/admin/(lesson-studio)/lesson-studio/[projectId]/identity/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Users, Clock, Award, Target, Lightbulb, CheckCircle, Wrench } from "lucide-react";

import type { LessonStudioProject, ProjectDifficulty } from "@/app/tools/lessonStudio/_lib/projectTypes";
import { getProject, upsertProject } from "@/app/tools/lessonStudio/_lib/projectStore";
import { exportProjectsEntry } from "@/app/tools/lessonStudio/_lib/exportProjectCode";

const DIFFICULTY_OPTIONS: ProjectDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

function splitLines(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinLines(arr: string[] | undefined) {
  return (arr ?? []).join("\n");
}

function ensureProjectShape(p: Partial<LessonStudioProject> | null | undefined, projectId: string): LessonStudioProject {
  const now = new Date().toISOString();

  return {
    id: projectId,

    /* -----------------------------
       Core identity
    ------------------------------ */
    name: p?.name ?? "Untitled Project",
    slug: p?.slug ?? `project-${projectId.slice(-6)}`,

    title: p?.title ?? p?.name ?? "Untitled Project",
    category: p?.category ?? "Arduino",
    available: p?.available ?? true,

    image: p?.image ?? "",
    description: p?.description ?? "",
    fullDescription: p?.fullDescription ?? "",

    difficulties: Array.isArray(p?.difficulties) ? p!.difficulties : ["Beginner"],
    ageRange: p?.ageRange ?? "10–18",
    hours: p?.hours ?? "4–6 hours",

    learningOutcomes: Array.isArray(p?.learningOutcomes) ? p!.learningOutcomes : [],
    projectHighlights: Array.isArray(p?.projectHighlights) ? p!.projectHighlights : [],
    prerequisitesList: Array.isArray(p?.prerequisitesList) ? p!.prerequisitesList : [],

    // merged canonical materials list
    materials: Array.isArray(p?.materials) ? p!.materials : [],

    skills: Array.isArray(p?.skills) ? p!.skills : [],

    intro:
      p?.intro ??
      ({
        subtitle: "",
        headerInfo: { difficulty: "", duration: "", components: "" },
        features: [],
        capabilities: [],
        workflows: { beginner: [], intermediate: [], advanced: [] },
        levels: [
          { id: "beginner", title: "Beginner", duration: "", description: "", color: "green", features: [] },
          { id: "intermediate", title: "Intermediate", duration: "", description: "", color: "blue", features: [] },
          { id: "advanced", title: "Advanced", duration: "", description: "", color: "purple", features: [] },
        ],
      } as LessonStudioProject["intro"]),

    /* -----------------------------
       Existing lesson-studio fields
       (required by your type)
    ------------------------------ */
    coverImageUrl: p?.coverImageUrl ?? "",
    shortDescription: p?.shortDescription ?? "",

    minAge: typeof p?.minAge === "number" ? p.minAge : 10,
    maxAge: typeof p?.maxAge === "number" ? p.maxAge : 18,
    estimatedTotalMinutes: typeof p?.estimatedTotalMinutes === "number" ? p.estimatedTotalMinutes : 240,

    prerequisites: p?.prerequisites ?? "",

    hardwareRequired: Array.isArray(p?.hardwareRequired) ? p!.hardwareRequired : [],
    softwareRequired: Array.isArray(p?.softwareRequired) ? p!.softwareRequired : [],

    teacherNotes: p?.teacherNotes ?? "",

    levels:
      p?.levels ??
      ({
        beginner: { enabled: true, description: "", estimatedMinutes: 120, prerequisites: "" },
        intermediate: { enabled: false, description: "", estimatedMinutes: 120, prerequisites: "" },
        advanced: { enabled: false, description: "", estimatedMinutes: 120, prerequisites: "" },
      } as LessonStudioProject["levels"]),

    createdAt: p?.createdAt ?? now,
    updatedAt: p?.updatedAt ?? now,
  };
}

export default function AdminProjectIdentityPage1() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = React.useState<LessonStudioProject>(() =>
    ensureProjectShape(getProject(projectId), projectId)
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [exportedCode, setExportedCode] = React.useState<{
    label: string;
    code: string;
  } | null>(null);

  function handleExportProjects() {
    // optional: enforce save first so you export latest
    // (you can remove this if you want export without saving)
    // upsertProject({ ...project, name: project.title, updatedAt: new Date().toISOString() });

    const { code } = exportProjectsEntry(project, {
      // if you don’t have numeric ids in studio yet, this is fine
      idNumber: 999,
    });

    setExportedCode({
      label: "PROJECTS entry (paste inside PROJECTS array in app/data/projects.ts)",
      code,
    });
  }

  async function copyExported() {
    if (!exportedCode) return;
    await navigator.clipboard.writeText(exportedCode.code);
  }

  React.useEffect(() => {
    setProject(ensureProjectShape(getProject(projectId), projectId));
  }, [projectId]);

  function setField<K extends keyof LessonStudioProject>(key: K, value: LessonStudioProject[K]) {
    setProject((p) => ({ ...p, [key]: value }));
  }

  function toggleDifficulty(d: ProjectDifficulty) {
    setProject((p) => {
      const set = new Set<ProjectDifficulty>(p.difficulties ?? []);
      if (set.has(d)) set.delete(d);
      else set.add(d);
      const next = Array.from(set);
      return { ...p, difficulties: next.length ? next : ["Beginner"] };
    });
  }

  async function save() {
    setError(null);
    if (!project.title.trim()) {
      setError("Project title is required.");
      return;
    }
    setSaving(true);
    try {
      upsertProject({
        ...project,
        name: project.title, // keep list display field updated if list uses name
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    await save();
    router.push(`/admin/lesson-studio/${projectId}/identity/intro`);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <Link href="/admin/lesson-studio" className="text-sm underline text-gray-600">
            ← Back to projects
          </Link>
          <h1 className="text-2xl font-bold mt-2">Project Identity (1/2)</h1>
          <p className="text-sm text-gray-600">This page mirrors the public project page.</p>
        </div>

        <div className="text-xs text-gray-500">Project ID: {projectId}</div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* EDIT FORM */}
        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Hero</h2>

            <label className="block text-sm mb-3">
              <div className="font-medium mb-1">Title *</div>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={project.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Electric Status Board"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <div className="font-medium mb-1">Category</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={project.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="Arduino"
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Available</div>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={project.available ? "yes" : "no"}
                  onChange={(e) => setField("available", e.target.value === "yes")}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>

            <div className="mt-3">
              <div className="font-medium text-sm mb-2">Difficulties (chips)</div>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((d) => {
                  const on = (project.difficulties ?? []).includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDifficulty(d)}
                      className={`text-xs px-3 py-1 rounded-full border ${
                        on ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm mt-3">
              <div className="font-medium mb-1">Short description (hero)</div>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={3}
                value={project.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="One paragraph shown under the title…"
              />
            </label>

            <label className="block text-sm mt-3">
              <div className="font-medium mb-1">Image URL</div>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={project.image}
                onChange={(e) => setField("image", e.target.value)}
                placeholder="https://..."
              />
            </label>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Quick stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <div className="font-medium mb-1">Age range</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={project.ageRange}
                  onChange={(e) => setField("ageRange", e.target.value)}
                  placeholder="10–18"
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Duration (hours)</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={project.hours}
                  onChange={(e) => setField("hours", e.target.value)}
                  placeholder="4–6 hours"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Overview + lists</h2>

            <label className="block text-sm mb-3">
              <div className="font-medium mb-1">Project overview (fullDescription)</div>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={4}
                value={project.fullDescription}
                onChange={(e) => setField("fullDescription", e.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <div className="font-medium mb-1">What you’ll learn (one per line)</div>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={6}
                  value={joinLines(project.learningOutcomes)}
                  onChange={(e) => setField("learningOutcomes", splitLines(e.target.value))}
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Project highlights (one per line)</div>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={6}
                  value={joinLines(project.projectHighlights)}
                  onChange={(e) => setField("projectHighlights", splitLines(e.target.value))}
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Prerequisites (one per line)</div>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={6}
                  value={joinLines(project.prerequisitesList)}
                  onChange={(e) => setField("prerequisitesList", splitLines(e.target.value))}
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Materials needed (one per line)</div>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={6}
                  value={joinLines(project.materials)}
                  onChange={(e) => setField("materials", splitLines(e.target.value))}
                />
              </label>

              <label className="block text-sm md:col-span-2">
                <div className="font-medium mb-1">Skills (one per line)</div>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={4}
                  value={joinLines(project.skills)}
                  onChange={(e) => setField("skills", splitLines(e.target.value))}
                />
              </label>
            </div>
          </section>

          {/* Bottom buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleExportProjects}
              className="px-4 py-2 rounded-md border bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Export projects.ts code
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-md border bg-white text-sm hover:bg-gray-100"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                type="button"
                onClick={next}
                disabled={saving}
                className="px-4 py-2 rounded-md border bg-sky-700 text-white text-sm hover:bg-sky-800"
              >
                Next →
              </button>
            </div>
          </div>

                    {exportedCode ? (
            <section className="mt-6 rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-sm font-semibold text-gray-700">{exportedCode.label}</div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyExported}
                    className="text-xs rounded-md border px-3 py-1 hover:bg-gray-100"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportedCode(null)}
                    className="text-xs rounded-md border px-3 py-1 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>

                    <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed font-mono text-slate-100">
        <code className="!text-slate-100">{exportedCode.code}</code>
      </pre>

              <div className="mt-2 text-xs text-gray-500">
                Paste this inside your <span className="font-mono">PROJECTS</span> array (wraps in <span className="font-mono">withCompat(...)</span> already).
              </div>
            </section>
          ) : null}

        </div>

        {/* PREVIEW (similar to /projects/[slug]) */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="border-b p-4 text-sm text-gray-600 flex items-center justify-between">
            <div className="font-medium">Preview (public project page style)</div>
            <div className="text-xs text-gray-500">/projects/[slug]</div>
          </div>

          <div className="bg-gradient-to-br from-sky-800 to-indigo-500 text-white p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(project.difficulties ?? []).map((d) => (
                <span key={d} className="text-xs px-3 py-1 bg-white/20 rounded-full">
                  {d}
                </span>
              ))}
              <span className="text-xs px-3 py-1 bg-white/20 rounded-full">{project.category || "Category"}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h1 className="text-3xl font-semibold mb-3">{project.title || "Untitled"}</h1>
                <p className="text-indigo-100">{project.description || "Short description appears here."}</p>

                <div className="flex gap-2 mt-4">
                  <div
                    className={`px-3 py-2 rounded-md text-sm ${
                      project.available ? "bg-white text-indigo-900" : "bg-white/60 text-indigo-900"
                    }`}
                  >
                    {project.available ? "Start Learning" : "Not Available"}
                  </div>
                  <div className="px-3 py-2 rounded-md border border-white/40 text-sm">Preview Lessons</div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3">
                {project.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.image} alt="" className="w-full rounded-lg" />
                ) : (
                  <div className="h-40 rounded-lg border border-white/20 flex items-center justify-center text-sm text-white/70">
                    Image preview
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b bg-white">
            <PreviewStat
              icon={<BarChart3 className="w-6 h-6 text-indigo-800 mx-auto" />}
              label="Level"
              value={(project.difficulties ?? []).join(", ")}
            />
            <PreviewStat icon={<Users className="w-6 h-6 text-indigo-800 mx-auto" />} label="Age Range" value={project.ageRange || "—"} />
            <PreviewStat icon={<Clock className="w-6 h-6 text-indigo-800 mx-auto" />} label="Duration" value={project.hours || "—"} />
            <PreviewStat icon={<Award className="w-6 h-6 text-indigo-800 mx-auto" />} label="Certificate" value="Upon completion" />
          </div>

          <div className="p-5 grid lg:grid-cols-3 gap-4 bg-gray-50">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Project Overview">
                <p className="text-gray-700 whitespace-pre-wrap">{project.fullDescription || "Full overview paragraph."}</p>
              </Card>

              {(project.learningOutcomes ?? []).length > 0 ? (
                <Card title="What You’ll Learn" icon={<Target className="w-5 h-5 text-indigo-600" />}>
                  <ul className="space-y-2">
                    {project.learningOutcomes.map((x, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span className="text-gray-700">{x}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {(project.projectHighlights ?? []).length > 0 ? (
                <Card title="Project Highlights" icon={<Lightbulb className="w-5 h-5 text-indigo-600" />}>
                  <div className="grid md:grid-cols-2 gap-2">
                    {project.projectHighlights.map((x, i) => (
                      <div key={i} className="flex gap-2 p-2 bg-indigo-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <span className="text-gray-700 text-sm">{x}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {(project.prerequisitesList ?? []).length > 0 ? (
                <Card title="Prerequisites">
                  <ul className="space-y-2">
                    {project.prerequisitesList.map((x, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>

            <div className="space-y-4">
              <Card title="Materials Needed" icon={<Wrench className="w-5 h-5 text-indigo-600" />}>
                {(project.materials ?? []).length ? (
                  <ul className="space-y-2">
                    {project.materials.map((x, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                        {x}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">Add materials on the left.</div>
                )}
              </Card>

              <Card title="Skills You’ll Use">
                {(project.skills ?? []).length ? (
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((x, i) => (
                      <span key={i} className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                        {x}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Add skills on the left.</div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      {icon}
      <div className="font-medium mt-1">{label}</div>
      <div className="text-sm text-gray-600">{value || "—"}</div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}