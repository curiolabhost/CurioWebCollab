// app/tools/answerkey-studio/page.tsx
"use client";

import * as React from "react";
import { inferBlankValues } from "@/src/lesson-core/authoring/blankAnswerInfer";
import { generateKeyFromReference } from "@/src/lesson-core/blankKeyGenerator";
import Link from "next/link";


// ---------- Types ----------
type Kind = "auto" | "id" | "num" | "str";

type RegistryRow = {
  key: string; // bindKey e.g. "arrVar"
  desc: string;
  examples: string; // comma-separated
  kind: "identifier" | "number" | "expr";
  scope: "project" | "lesson";
};

type RegistryTable = {
  id: string;
  title: string;
  rows: RegistryRow[];
  createdAt: number;
  updatedAt: number;
};

// ---------- LocalStorage ----------
const LS_TABLES_KEY = "curio:answerkey:registryTables:v1";
const LS_ACTIVE_ID_KEY = "curio:answerkey:registryActiveId:v1";

function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadTables(): RegistryTable[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<RegistryTable[]>(window.localStorage.getItem(LS_TABLES_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

function saveTables(tables: RegistryTable[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_TABLES_KEY, JSON.stringify(tables));
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_ACTIVE_ID_KEY);
}

function saveActiveId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_ACTIVE_ID_KEY, id);
}

// ---------- Existing helper JSON parsers ----------
function tryParseJson<T>(s: string, fallback: T): T {
  try {
    const v = JSON.parse(s);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function looksNumber(s: string) {
  return /^[+\-]?(?:0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?$/.test(
    s.trim()
  );
}
function looksQuoted(s: string) {
  const t = s.trim();
  return (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  );
}
function looksIdentifier(s: string) {
  return /^[A-Za-z_]\w*$/.test(s.trim());
}

type BindMap = Record<string, string>;

function emitAnswerKeySnippet(opts: {
  inferred: { name: string; value: string; ok: boolean; warning?: string }[];
  bindBlanks: BindMap; // blankName -> bindKey
  bindings: BindMap; // identifier -> bindKey
  kinds: Record<string, Kind>;
}) {
  const { inferred, bindBlanks, bindings, kinds } = opts;

  const lines: string[] = [];
  lines.push(`import { K, buildAnswerKey } from "@/src/lesson-core/blankKeyBuilder";`);
  lines.push(`import { generateKeyFromReference } from "@/src/lesson-core/blankKeyGenerator";`);
  lines.push(``);
  lines.push(`answerKey: buildAnswerKey({`);

  for (const b of inferred) {
    const blank = b.name;
    const ans = (b.value ?? "").trim();
    if (!b.ok) {
      lines.push(`  // ${blank}: (could not infer)`);
      continue;
    }

    if (bindBlanks[blank]) {
      lines.push(`  ${blank}: K.id().bind(${JSON.stringify(bindBlanks[blank])}),`);
      continue;
    }

    const kind = kinds[blank] ?? "auto";
    if (kind === "id") {
      lines.push(`  ${blank}: K.id(),`);
      continue;
    }
    if (kind === "num") {
      lines.push(`  ${blank}: K.num(),`);
      continue;
    }
    if (kind === "str") {
      lines.push(`  ${blank}: K.str(),`);
      continue;
    }

    // AUTO
    const hasStructure = /[\[\]\(\)\{\},.+\-*/=!<>:]/.test(ans);

    if (looksNumber(ans) && !hasStructure) {
      lines.push(`  ${blank}: K.num(),`);
      continue;
    }
    if (looksQuoted(ans) && !hasStructure) {
      lines.push(`  ${blank}: K.str(),`);
      continue;
    }
    if (looksIdentifier(ans) && !hasStructure) {
      lines.push(`  ${blank}: K.id(),`);
      continue;
    }

    lines.push(
      `  ${blank}: generateKeyFromReference(${JSON.stringify(ans)}, { bind: ${JSON.stringify(bindings)} }),`
    );
  }

  lines.push(`}),`);
  return lines.join("\n");
}

// ---------- UI Component ----------
export default function AnswerKeyStudioPage() {
  // Main text areas
  const [templateCode, setTemplateCode] = React.useState("");
  const [solvedCode, setSolvedCode] = React.useState("");
  const [projectCode, setProjectCode] = React.useState("");

  // Advanced JSON (still supported)
  const [bindingsJson, setBindingsJson] = React.useState(`{\n  \n}`);
  const [bindBlanksJson, setBindBlanksJson] = React.useState(`{\n  \n}`);
  const [kindsJson, setKindsJson] = React.useState(`{\n  \n}`);

  // Outputs
  const [report, setReport] = React.useState<string>("");
  const [snippet, setSnippet] = React.useState<string>("");

  // ---------- Registry Tables ----------
  const [tables, setTables] = React.useState<RegistryTable[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  const activeTable = React.useMemo(
    () => tables.find((t) => t.id === activeId) || null,
    [tables, activeId]
  );

  // Load tables from localStorage on mount
  React.useEffect(() => {
    const loaded = loadTables();

    // If none exist, create a default one
    if (!loaded.length) {
      const first: RegistryTable = {
        id: uid(),
        title: "Default Registry",
        rows: [
          { key: "arrVar", desc: "Array variable being indexed", examples: "arr,scores,happy", kind: "identifier", scope: "lesson" },
          { key: "idxVar", desc: "Index/counter variable used inside []", examples: "i,idx,counter", kind: "identifier", scope: "lesson" },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveTables([first]);
      saveActiveId(first.id);
      setTables([first]);
      setActiveId(first.id);
      return;
    }

    const storedActive = loadActiveId();
    const pick = storedActive && loaded.some((t) => t.id === storedActive) ? storedActive : loaded[0].id;

    setTables(loaded);
    setActiveId(pick);
  }, []);

  // Persist on changes
  React.useEffect(() => {
    if (!tables.length) return;
    saveTables(tables);
  }, [tables]);

  React.useEffect(() => {
    if (!activeId) return;
    saveActiveId(activeId);
  }, [activeId]);

  function createNewTable() {
    const title = window.prompt("New registry table title:", "Status Board Beginner Lesson");
    if (!title) return;

    const t: RegistryTable = {
      id: uid(),
      title: title.trim(),
      rows: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTables((prev) => [t, ...(prev || [])]);
    setActiveId(t.id);
  }

  function renameActive() {
    if (!activeTable) return;
    const next = window.prompt("Rename table:", activeTable.title);
    if (!next) return;
    setTables((prev) =>
      (prev || []).map((t) =>
        t.id === activeTable.id ? { ...t, title: next.trim(), updatedAt: Date.now() } : t
      )
    );
  }

  function deleteActive() {
    if (!activeTable) return;
    const ok = window.confirm(`Delete "${activeTable.title}"? This cannot be undone.`);
    if (!ok) return;

    setTables((prev) => {
      const rest = (prev || []).filter((t) => t.id !== activeTable.id);
      // pick next active
      const nextActive = rest[0]?.id || "";
      setActiveId(nextActive);
      return rest;
    });
  }

  function updateRow(idx: number, patch: Partial<RegistryRow>) {
    if (!activeTable) return;
    setTables((prev) =>
      (prev || []).map((t) => {
        if (t.id !== activeTable.id) return t;
        const rows = [...t.rows];
        rows[idx] = { ...rows[idx], ...patch };
        return { ...t, rows, updatedAt: Date.now() };
      })
    );
  }

  function addRow() {
    if (!activeTable) return;
    const newRow: RegistryRow = { key: "", desc: "", examples: "", kind: "identifier", scope: "lesson" };
    setTables((prev) =>
      (prev || []).map((t) =>
        t.id === activeTable.id ? { ...t, rows: [...t.rows, newRow], updatedAt: Date.now() } : t
      )
    );
  }

  function removeRow(idx: number) {
    if (!activeTable) return;
    setTables((prev) =>
      (prev || []).map((t) => {
        if (t.id !== activeTable.id) return t;
        const rows = t.rows.filter((_, i) => i !== idx);
        return { ...t, rows, updatedAt: Date.now() };
      })
    );
  }

  // Optional: export/import registry JSON
  function exportActiveRegistry() {
    if (!activeTable) return;
    const raw = JSON.stringify(activeTable, null, 2);
    navigator.clipboard?.writeText(raw).catch(() => {});
    alert("Copied active registry table JSON to clipboard.");
  }

  function importRegistryFromJson() {
    const raw = window.prompt("Paste a RegistryTable JSON here:");
    if (!raw) return;
    const parsed = safeJsonParse<RegistryTable>(raw);
    if (!parsed || !parsed.id || !parsed.title || !Array.isArray(parsed.rows)) {
      alert("Invalid JSON. Expected a RegistryTable object.");
      return;
    }
    // Ensure unique id
    const nextId = uid();
    const table: RegistryTable = {
      ...parsed,
      id: nextId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTables((prev) => [table, ...(prev || [])]);
    setActiveId(table.id);
  }

  // ---------- Generator ----------
  function onGenerate() {
    const inferred = inferBlankValues(templateCode, solvedCode);

    const bindings = tryParseJson<Record<string, string>>(bindingsJson, {});
    const bindBlanks = tryParseJson<Record<string, string>>(bindBlanksJson, {});
    const kinds = tryParseJson<Record<string, Kind>>(kindsJson, {});

    const out = emitAnswerKeySnippet({ inferred, bindings, bindBlanks, kinds });
    setSnippet(out);

    const repLines: string[] = [];
    repLines.push(`Found ${inferred.length} blanks.`);
    repLines.push(``);
    for (const b of inferred) {
      repLines.push(
        `- ${b.name}: ${b.ok ? JSON.stringify(b.value) : "(not inferred)"}${b.warning ? `  ⚠ ${b.warning}` : ""}`
      );
    }
    if (projectCode.trim()) {
      repLines.push(``);
      repLines.push(`(Project code provided: ${projectCode.trim().length} chars — currently unused in v1.)`);
    }
    setReport(repLines.join("\n"));
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header row */}
<div className="flex items-center justify-between gap-4 mb-4">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => window.history.back()}
      className="rounded-xl border px-3 py-2 text-sm"
    >
      ← Back
    </button>

    <h1 className="text-xl font-semibold">AnswerKey Studio</h1>

    <Link
      href="/tools/answerkey-studio/create-blanks"
      className="rounded-xl border px-3 py-2 text-sm inline-block"
    >
      Create Blanks
    </Link>
  </div>

  <button
    type="button"
    onClick={onGenerate}
    className="rounded-xl px-4 py-2 shadow bg-black text-white"
  >
    Generate answerKey
  </button>
</div>


      {/* Registry Tables */}
      <section className="rounded-2xl border p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-medium">Binding Registry Table</div>
              <div className="text-sm opacity-70">
                Create a named table per lesson/project (e.g., “Status Board Beginner Lesson”) to standardize bind keys.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              <button type="button" onClick={createNewTable} className="rounded-xl border px-3 py-2 text-sm">
                + New table
              </button>
              <button type="button" onClick={renameActive} className="rounded-xl border px-3 py-2 text-sm">
                Rename
              </button>
              <button type="button" onClick={deleteActive} className="rounded-xl border px-3 py-2 text-sm">
                Delete
              </button>
              <button type="button" onClick={exportActiveRegistry} className="rounded-xl border px-3 py-2 text-sm">
                Copy JSON
              </button>
              <button type="button" onClick={importRegistryFromJson} className="rounded-xl border px-3 py-2 text-sm">
                Import JSON
              </button>
              
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 w-48">Bind key</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2 w-64">Examples (comma-separated)</th>
                  <th className="text-left p-2 w-32">Kind</th>
                  <th className="text-left p-2 w-32">Scope</th>
                  <th className="text-left p-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTable?.rows || []).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <input
                        value={r.key}
                        onChange={(e) => updateRow(i, { key: e.target.value })}
                        className="w-full rounded-lg border px-2 py-1 font-mono"
                        placeholder="arrVar"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={r.desc}
                        onChange={(e) => updateRow(i, { desc: e.target.value })}
                        className="w-full rounded-lg border px-2 py-1"
                        placeholder="Array variable being indexed"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={r.examples}
                        onChange={(e) => updateRow(i, { examples: e.target.value })}
                        className="w-full rounded-lg border px-2 py-1"
                        placeholder="happy,scores,arr"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={r.kind}
                        onChange={(e) => updateRow(i, { kind: e.target.value as any })}
                        className="w-full rounded-lg border px-2 py-1"
                      >
                        <option value="identifier">identifier</option>
                        <option value="number">number</option>
                        <option value="expr">expr</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={r.scope}
                        onChange={(e) => updateRow(i, { scope: e.target.value as any })}
                        className="w-full rounded-lg border px-2 py-1"
                      >
                        <option value="lesson">lesson</option>
                        <option value="project">project</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="rounded-lg border px-2 py-1"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}

                {!activeTable?.rows?.length && (
                  <tr>
                    <td className="p-3 text-sm opacity-70" colSpan={6}>
                      No rows yet. Click “Add row” to start defining bind keys for this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <button type="button" onClick={addRow} className="rounded-xl border px-3 py-2 text-sm">
              + Add row
            </button>
          </div>
        </div>
      </section>

      {/* Existing UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Lesson template (with blanks)</div>
          <textarea
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            className="w-full h-64 rounded-xl border p-3 font-mono text-sm"
            placeholder="Paste code containing __BLANK[NAME]__"
          />
        </section>

        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Solved lesson code (blanks filled)</div>
          <textarea
            value={solvedCode}
            onChange={(e) => setSolvedCode(e.target.value)}
            className="w-full h-64 rounded-xl border p-3 font-mono text-sm"
            placeholder="Paste solved version of the same code"
          />
        </section>

        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Bindings (identifier → bindKey)</div>
          <div className="text-sm opacity-70 mb-2">
            Example: {"{ \"happy\": \"arrVar\", \"counter\": \"idxVar\" }"}
          </div>
          <textarea
            value={bindingsJson}
            onChange={(e) => setBindingsJson(e.target.value)}
            className="w-full h-40 rounded-xl border p-3 font-mono text-sm"
          />
        </section>

        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Bind blanks (blankName → bindKey)</div>
          <div className="text-sm opacity-70 mb-2">
            For blanks that define identifiers. Example: {"{ \"ARR_NAME\": \"arrVar\" }"}
          </div>
          <textarea
            value={bindBlanksJson}
            onChange={(e) => setBindBlanksJson(e.target.value)}
            className="w-full h-40 rounded-xl border p-3 font-mono text-sm"
          />
        </section>

        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Kinds override (blankName → kind)</div>
          <div className="text-sm opacity-70 mb-2">Kinds: auto | id | num | str</div>
          <textarea
            value={kindsJson}
            onChange={(e) => setKindsJson(e.target.value)}
            className="w-full h-40 rounded-xl border p-3 font-mono text-sm"
          />
        </section>

        <section className="rounded-2xl border p-4">
          <div className="font-medium mb-2">Project code (optional)</div>
          <div className="text-sm opacity-70 mb-2">
            Not used in v1. Later: suggestions / validation.
          </div>
          <textarea
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            className="w-full h-40 rounded-xl border p-3 font-mono text-sm"
            placeholder="Optional context"
          />
        </section>

        <section className="rounded-2xl border p-4 lg:col-span-2">
          <div className="font-medium mb-2">Report</div>
          <pre className="w-full rounded-xl border p-3 text-sm whitespace-pre-wrap">{report}</pre>
        </section>

        <section className="rounded-2xl border p-4 lg:col-span-2">
          <div className="font-medium mb-2">Paste-ready answerKey snippet</div>
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            className="w-full h-72 rounded-xl border p-3 font-mono text-sm"
            placeholder="Click Generate"
          />
        </section>
      </div>
    </div>
  );
}
