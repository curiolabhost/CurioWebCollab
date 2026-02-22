//  app/admin/lesson-studio/[projectId]/identity/intro/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react";

import type { LessonStudioProject, ProjectIntroLevelId } from "@/app/tools/lessonStudio/_lib/projectTypes";
import { getProject, upsertProject } from "@/app/tools/lessonStudio/_lib/projectStore";

import { exportIntroDataFile, exportIntroRegistrySnippet } from "@/app/tools/lessonStudio/_lib/exportProjectCode";

function splitLines(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinLines(arr: string[] | undefined) {
  return (arr ?? []).join("\n");
}



export default function AdminProjectIdentityIntroPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = React.useState<LessonStudioProject | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [workflowLevel, setWorkflowLevel] = React.useState<ProjectIntroLevelId>("beginner");
  const [selectedLevel, setSelectedLevel] = React.useState<ProjectIntroLevelId | null>(null);

    // -----------------------------
  // Export code panel (intro file + registries snippet)
  // -----------------------------
  type ExportTab = "introFile" | "registry";

  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportTab, setExportTab] = React.useState<ExportTab>("introFile");

  const [exportSnippets, setExportSnippets] = React.useState<{
    introFileLabel: string;
    introFileCode: string;
    registryLabel: string;
    registryCode: string;
  } | null>(null);

  function buildExportSnippets() {
    if (!project) return;

    const introOut = exportIntroDataFile(project); // { slug, constName, file }
    const regOut = exportIntroRegistrySnippet(project); // { importLine, registryEntry, ... }

    const registryCode = `${regOut.importLine}\n\n${regOut.registryEntry}`;

    setExportSnippets({
      introFileLabel: `Intro data file (${introOut.constName}.ts)`,
      introFileCode: introOut.file,
      registryLabel: "introRegistries.ts snippet",
      registryCode,
    });

    setExportTab("introFile");
    setExportOpen(true);
  }

  async function copyActiveSnippet() {
    if (!exportSnippets) return;
    const code = exportTab === "introFile" ? exportSnippets.introFileCode : exportSnippets.registryCode;
    await navigator.clipboard.writeText(code);
  }

  const activeLabel =
    exportSnippets ? (exportTab === "introFile" ? exportSnippets.introFileLabel : exportSnippets.registryLabel) : "";

  const activeCode =
    exportSnippets ? (exportTab === "introFile" ? exportSnippets.introFileCode : exportSnippets.registryCode) : "";
  
  React.useEffect(() => {
    const p = getProject(projectId);
    if (!p) {
      setProject(null);
      return;
    }
    setProject(p as any);
  }, [projectId]);

  function setIntroField(path: string, value: any) {
    if (!project) return;

    // tiny path setter: "intro.subtitle" / "intro.headerInfo.duration"
    const parts = path.split(".");
    setProject((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);

      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;

      return next;
    });
  }

  async function save(goFinish: boolean) {
    if (!project) return;
    setError(null);

    setSaving(true);
    try {
      upsertProject({ ...project, updatedAt: new Date().toISOString() });
      if (goFinish) router.push(`/admin/lesson-studio/${projectId}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Project not found.</div>
      </div>
    );
  }

  const intro = project.intro;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <Link
            href={`/admin/lesson-studio/${projectId}/identity`}
            className="text-sm underline text-gray-600"
          >
            ← Back to identity (1/2)
          </Link>
          <h1 className="text-2xl font-bold mt-2">Project Intro (2/2)</h1>
          <p className="text-sm text-gray-600">This page mirrors the public intro page.</p>
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
            <h2 className="text-lg font-semibold mb-3">Header</h2>

            <label className="block text-sm mb-3">
              <div className="font-medium mb-1">Subtitle</div>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={3}
                value={intro.subtitle ?? ""}
                onChange={(e) => setIntroField("intro.subtitle", e.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block text-sm">
                <div className="font-medium mb-1">Header difficulty</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={intro.headerInfo?.difficulty ?? ""}
                  onChange={(e) => setIntroField("intro.headerInfo.difficulty", e.target.value)}
                  placeholder="Beginner → Advanced"
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Header duration</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={intro.headerInfo?.duration ?? ""}
                  onChange={(e) => setIntroField("intro.headerInfo.duration", e.target.value)}
                  placeholder="4–6 hours"
                />
              </label>

              <label className="block text-sm">
                <div className="font-medium mb-1">Header components</div>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={intro.headerInfo?.components ?? ""}
                  onChange={(e) => setIntroField("intro.headerInfo.components", e.target.value)}
                  placeholder="OLED, RTC, Buttons"
                />
              </label>
            </div>

            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Intro image</div>
              <div className="text-xs text-gray-500 mb-2">
                Reuses the project image from identity page 1.
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                {project.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.image} alt="" className="max-h-40 rounded-md" />
                ) : (
                  <div className="text-xs text-gray-500">No image URL set on identity page 1.</div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">What you’ll build (cards)</h2>
            <div className="text-xs text-gray-500 mb-2">
              For now: enter as lines in “Title — Description” format.
            </div>

            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={7}
              value={(intro.features ?? [])
                .map((f) => `${f.title} — ${f.description}`)
                .join("\n")}
              onChange={(e) => {
                const lines = splitLines(e.target.value);
                const next = lines.map((line) => {
                  const [t, ...rest] = line.split("—");
                  return {
                    title: (t ?? "").trim() || "Feature",
                    description: rest.join("—").trim(),
                    iconName: "",
                  };
                });
                setIntroField("intro.features", next);
              }}
              placeholder={"OLED Display — Show text and menus\nButtons — Navigate and interact"}
            />
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Capabilities (bullets)</h2>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={7}
              value={joinLines(intro.capabilities)}
              onChange={(e) => setIntroField("intro.capabilities", splitLines(e.target.value))}
              placeholder={"Initialize an I2C display\nBuild button input circuits\nDebug errors with hints"}
            />
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Workflow (How it works)</h2>
            <div className="text-xs text-gray-500 mb-2">
              Keep it simple: 3–6 steps per level. Each line = "StepNumber | Title | Description"
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(["beginner", "intermediate", "advanced"] as ProjectIntroLevelId[]).map((lvl) => {
                const raw = (intro.workflows?.[lvl] ?? [])
                  .map((x) => `${x.step} | ${x.title} | ${x.description}`)
                  .join("\n");

                return (
                  <div key={lvl}>
                    <div className="font-medium text-sm mb-1 capitalize">{lvl}</div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      rows={5}
                      value={raw}
                      onChange={(e) => {
                        const lines = splitLines(e.target.value);
                        const next = lines.map((line) => {
                          const [step, title, ...rest] = line.split("|").map((s) => s.trim());
                          return {
                            step: step || "1",
                            title: title || "Step",
                            description: rest.join(" | ").trim(),
                          };
                        });
                        setIntroField(`intro.workflows.${lvl}`, next);
                      }}
                      placeholder={"1 | Setup | Wire the board and upload starter code\n2 | Display | Print text to OLED"}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Choose your learning path (3 cards)</h2>

            <div className="text-xs text-gray-500 mb-2">
              One per level: Title, duration, description, features.
            </div>

            <div className="space-y-3">
              {intro.levels.map((lvl, idx) => (
                <div key={lvl.id} className="rounded-lg border p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="text-sm">
                      <div className="font-medium mb-1">Title</div>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={lvl.title}
                        onChange={(e) => {
                          const next = structuredClone(intro.levels);
                          next[idx].title = e.target.value;
                          setIntroField("intro.levels", next);
                        }}
                      />
                    </label>

                    <label className="text-sm">
                      <div className="font-medium mb-1">Duration</div>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={lvl.duration}
                        onChange={(e) => {
                          const next = structuredClone(intro.levels);
                          next[idx].duration = e.target.value;
                          setIntroField("intro.levels", next);
                        }}
                        placeholder="2–3 hours"
                      />
                    </label>

                    <label className="text-sm">
                      <div className="font-medium mb-1">Color</div>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={lvl.color}
                        onChange={(e) => {
                          const next = structuredClone(intro.levels);
                          next[idx].color = e.target.value as any;
                          setIntroField("intro.levels", next);
                        }}
                      >
                        <option value="green">green</option>
                        <option value="blue">blue</option>
                        <option value="purple">purple</option>
                      </select>
                    </label>
                  </div>

                  <label className="text-sm block mt-3">
                    <div className="font-medium mb-1">Description</div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2"
                      rows={3}
                      value={lvl.description}
                      onChange={(e) => {
                        const next = structuredClone(intro.levels);
                        next[idx].description = e.target.value;
                        setIntroField("intro.levels", next);
                      }}
                    />
                  </label>

                  <label className="text-sm block mt-3">
                    <div className="font-medium mb-1">Features (one per line)</div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      rows={4}
                      value={joinLines(lvl.features)}
                      onChange={(e) => {
                        const next = structuredClone(intro.levels);
                        next[idx].features = splitLines(e.target.value);
                        setIntroField("intro.levels", next);
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

    {/* Bottom buttons */}
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={buildExportSnippets}
        className="px-4 py-2 rounded-md border bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        Export intro code
      </button>

  <div className="flex gap-2 justify-end">
    <button
      type="button"
      onClick={() => router.push(`/admin/lesson-studio/${projectId}/identity`)}
      className="px-4 py-2 rounded-md border bg-white text-sm hover:bg-gray-100"
    >
      ← Back
    </button>

    <button
      type="button"
      onClick={() => save(false)}
      disabled={saving}
      className="px-4 py-2 rounded-md border bg-white text-sm hover:bg-gray-100"
    >
      {saving ? "Saving…" : "Save"}
    </button>

    <button
      type="button"
      onClick={() => save(true)}
      disabled={saving}
      className="px-4 py-2 rounded-md border bg-sky-700 text-white text-sm hover:bg-sky-800 "
    >
      Finish →
    </button>
  </div>
    </div>

    {exportOpen && exportSnippets ? (
  <section className="mt-6 rounded-xl border bg-white p-4">
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="text-sm font-semibold text-gray-700">{activeLabel}</div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyActiveSnippet}
          className="text-xs rounded-md border px-3 py-1 hover:bg-gray-50"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => setExportOpen(false)}
          className="text-xs rounded-md border px-3 py-1 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>

    {/* Code container with toggle INSIDE */}
    <div className="relative">
      {/* Toggle button BELOW header */}
      <div className="flex mb-3">
        <button
          type="button"
          onClick={() => setExportTab((t) => (t === "introFile" ? "registry" : "introFile"))}
          className="text-xs rounded-md border px-3 py-1 bg-gray-100 hover:bg-gray-200"
        >
          {exportTab === "introFile" ? "Show registry" : "Show intro file"}
        </button>
      </div>

      {/* Code block */}
      <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed font-mono text-slate-100">
        <code className="!text-slate-100">{activeCode}</code>
      </pre>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Toggle between the full intro data file and the intro registry snippet.
      </div>
    </section>
  ) : null}

        </div>

        {/* PREVIEW (similar to /projects/[slug]/intro) */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="border-b p-4 text-sm text-gray-600 flex items-center justify-between">
            <div className="font-medium">Preview (public intro style)</div>
            <div className="text-xs text-gray-500">/projects/[slug]/intro</div>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-br from-sky-800 to-indigo-500 text-white p-6">
            <div className="flex items-center gap-2 text-white/90 mb-4">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Projects</span>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-semibold mb-3">{project.title}</h1>
                <p className="text-indigo-100 mb-5">{intro.subtitle || "Subtitle appears here."}</p>

                <div className="flex gap-6 text-sm">
                  <div>
                    <div className="text-indigo-200 mb-1">Difficulty</div>
                    <div className="text-white">{intro.headerInfo.difficulty || "—"}</div>
                  </div>
                  <div>
                    <div className="text-indigo-200 mb-1">Duration</div>
                    <div className="text-white">{intro.headerInfo.duration || "—"}</div>
                  </div>
                  <div>
                    <div className="text-indigo-200 mb-1">Components</div>
                    <div className="text-white">{intro.headerInfo.components || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-lg">
                {project.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.image} alt="" className="w-56 h-36 object-cover rounded-lg" />
                ) : (
                  <div className="w-56 h-36 rounded-lg border flex items-center justify-center text-xs text-gray-500">
                    Image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-10">
            {/* What you'll build */}
            <section>
              <h2 className="text-xl font-semibold mb-4">What You'll Build</h2>
              <div className="grid grid-cols-2 gap-3">
                {(intro.features ?? []).slice(0, 6).map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border">
                    <div className="font-semibold mb-1">{f.title}</div>
                    <div className="text-sm text-gray-600">{f.description}</div>
                  </div>
                ))}
                {(!intro.features || intro.features.length === 0) ? (
                  <div className="text-sm text-gray-500">Add features on the left.</div>
                ) : null}
              </div>
            </section>

            {/* Capabilities */}
            <section>
              <h2 className="text-xl font-semibold mb-4">What You'll Be Able to Do</h2>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border">
                <div className="grid grid-cols-2 gap-3">
                  {(intro.capabilities ?? []).map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </div>
                  ))}
                  {(!intro.capabilities || intro.capabilities.length === 0) ? (
                    <div className="text-sm text-gray-500">Add capabilities on the left.</div>
                  ) : null}
                </div>
              </div>
            </section>

            {/* How it works */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">How Your Prototype Works</h2>

                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg text-sm">
                  <button
                    onClick={() => setWorkflowLevel("beginner")}
                    className={`px-4 py-1 rounded-md ${workflowLevel === "beginner" ? "bg-green-600 text-white" : "text-gray-600"}`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => setWorkflowLevel("intermediate")}
                    className={`px-4 py-1 rounded-md ${workflowLevel === "intermediate" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                  >
                    Intermediate
                  </button>
                  <button
                    onClick={() => setWorkflowLevel("advanced")}
                    className={`px-4 py-1 rounded-md ${workflowLevel === "advanced" ? "bg-purple-600 text-white" : "text-gray-600"}`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(intro.workflows?.[workflowLevel] ?? []).map((w, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center">
                      <span className="text-sm">{w.step}</span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border shadow-sm">
                      <div className="font-semibold">{w.title}</div>
                      <div className="text-sm text-gray-600">{w.description}</div>
                    </div>
                  </div>
                ))}
                {(intro.workflows?.[workflowLevel] ?? []).length === 0 ? (
                  <div className="text-sm text-gray-500">Add workflow steps on the left.</div>
                ) : null}
              </div>
            </section>

            {/* Choose your path */}
            <section>
              <h2 className="text-xl font-semibold mb-2 text-center">Choose Your Learning Path</h2>
              <p className="text-center text-gray-600 mb-6">
                Select the difficulty level that matches your experience.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {intro.levels.map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`rounded-xl p-4 border-2 cursor-pointer ${
                      selectedLevel === lvl.id ? "border-indigo-500 shadow-md" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{lvl.title}</div>
                      {selectedLevel === lvl.id ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : null}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{lvl.duration || "—"}</div>
                    <div className="text-sm text-gray-600 mb-3">{lvl.description || "—"}</div>
                    <div className="space-y-1">
                      {lvl.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2" />
                          <span className="text-xs text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  disabled={!selectedLevel}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl text-base ${
                    selectedLevel ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}