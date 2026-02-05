"use client";

import * as React from "react";
import Link from "next/link";
import { inferBlankValues } from "@/src/lesson-core/authoring/blankAnswerInfer";
import { generateKeyFromReference } from "@/src/lesson-core/blankKeyGenerator";
import {
  type AnswerSpec,
  type BlankRule,
  type BlankTypedSpec,
  evalAnswerSpec,
} from "@/src/lesson-core/blankCheckUtils";
import { useParams } from "next/navigation";

import { K } from "@/src/lesson-core/blankKeyBuilder";


const LS_PROJECT_CODE = "curio:answerkey:studio:projectCode:v1";
const LS_TEMPLATE_CODE = "curio:answerkey:studio:templateCode:v1";
const LS_SOLVED_CODE = "curio:answerkey:studio:solvedCode:v1";

// Registry tables (same keys as AnswerKey Studio)
const LS_TABLES_KEY = "curio:answerkey:registryTables:v1";
const LS_ACTIVE_ID_KEY = "curio:answerkey:registryActiveId:v1";


// legacy (migration only)
const LS_ANSWERS_MAP = "curio:answerkey:studio:answersMap:v1"; // { "1": "original text", ... }
const LS_BLANK_COUNTER = "curio:answerkey:studio:blankCounter:v1";

// new stable store
const LS_BLANK_STORE = "curio:answerkey:studio:blankStore:v1";

const LS_ANSWERKEY_SNIPPET = "curio:answerkey:studio:answerKeySnippet:v1";
const LS_ANSWERKEY_REPORT  = "curio:answerkey:studio:answerKeyReport:v1";
const LS_TEST_VALUE        = "curio:answerkey:studio:testValue:v1";

// notes
const LS_NOTES = "curio:answerkey:studio:notes:v1";


function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsGet(key: string, projectId: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(k(key, projectId)) || "";
}
function lsSet(key: string, projectId: string, value: string) {
  if (typeof window === "undefined") return;

  const fullKey = k(key, projectId);
  const prev = window.localStorage.getItem(fullKey);

  // Guard: don't stomp existing data with empty string
  if ((value ?? "") === "" && (prev ?? "") !== "") {
    return;
  }

  window.localStorage.setItem(fullKey, value);
}

function lsSetJson(key: string, projectId: string, value: any) {
  if (typeof window === "undefined") return;

  const fullKey = k(key, projectId);
  const prev = window.localStorage.getItem(fullKey);

  const next = JSON.stringify(value);

  // detect "empty BlankStore"
  const isEmptyStore =
    value &&
    typeof value === "object" &&
    value.uidByDisplay &&
    Object.keys(value.uidByDisplay).length === 0 &&
    value.metaByUid &&
    Object.keys(value.metaByUid).length === 0;

  // Guard: don't stomp an existing non-empty store with an empty one
  if (isEmptyStore && (prev ?? "").length > 10) {
    return;
  }

  window.localStorage.setItem(fullKey, next);
}

function lsGetJson<T>(key: string, projectId: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k(key, projectId));
    const parsed = raw ? (JSON.parse(raw) as T) : null;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}



function replaceRange(str: string, start: number, end: number, insert: string) {
  return str.slice(0, start) + insert + str.slice(end);
}

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function migrateLegacyProject(projectId: string) {
  if (typeof window === "undefined") return;

  const LEGACY_KEYS = [
    LS_PROJECT_CODE,
    LS_TEMPLATE_CODE,
    LS_SOLVED_CODE,
    LS_BLANK_COUNTER,
    LS_BLANK_STORE,
    LS_ANSWERKEY_SNIPPET,
    LS_ANSWERKEY_REPORT,
    LS_TEST_VALUE,
    LS_TABLES_KEY,
    LS_ACTIVE_ID_KEY,
    LS_ANSWERS_MAP,
  ];

  let copied = 0;

  for (const baseKey of LEGACY_KEYS) {
    const legacyVal = localStorage.getItem(baseKey);
    if (legacyVal == null) continue;

    const newKey = k(baseKey, projectId);
    localStorage.setItem(newKey, legacyVal); // overwrite
    copied++;
  }

  alert(`Force imported ${copied} legacy keys into project "${projectId}". Reload the page.`);
}


function extractBlanksInOrder(template: string): string[] {
  const ids: string[] = [];
  const re = /__BLANK\[(\d+)\]__/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

function unique<T>(arr: T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const k = String(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function isValidBlankId(s: string) {
  return /^\d+$/.test(String(s ?? "").trim());
}

function nextAvailableCounter(template: string, counter: number) {
  const used = new Set(extractBlanksInOrder(template));
  let c = Math.max(1, Math.floor(counter || 1));
  while (used.has(String(c))) c += 1;
  return c;
}

export type BlankUID = `b_${string}`;

export type ConstraintType =
  | "num_any"
  | "num_range"
  | "num_oneOf"
  | "id_bound"
  | "str_oneOf"
  | "same_as"
  | "pat_array_empty"    // identifier[]
  | "pat_array_index"    // identifier[ identifier | number ]
  | "expr_ref"
  | "pattern_custom";

export type BlankMeta = {
  uid: BlankUID;
  answer: string;
  description?: string;
  bindKey?: string;
  sameAsTarget?: string;
  requireQuoted?: boolean; // for string constraints (default false)


  // Option fields
  constraintType?: ConstraintType; // dropdown selection
  allowedRaw?: string;             // for oneOf: "64, 32" or for str: '"A","B"' or 'A,B'
  rangeMinRaw?: string;            // for range
  rangeMaxRaw?: string;            // for range
  createdAt: number;
  updatedAt: number;
  patternJson?: string;
  generatedKeyExpr?: string; // e.g. 'K.num({ oneOf: [64, 32] })'
};


export type BlankStore = {
  uidByDisplay: Record<string, BlankUID>; // "12" -> "b_xxx"
  metaByUid: Record<BlankUID, BlankMeta>; // "b_xxx" -> {...}
};

export function resolveBlankUid(store: BlankStore, displayId: string): BlankUID | null {
  const id = String(displayId ?? "").trim();
  return store.uidByDisplay[id] ?? null;
}

export function getBlankMeta(store: BlankStore, displayId: string): BlankMeta | null {
  const uid = resolveBlankUid(store, displayId);
  if (!uid) return null;
  return store.metaByUid[uid] ?? null;
}

function newUid(): BlankUID {
  // stable internal id, never shown in template
  // format: b_<timebase36>_<randbase36>
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `b_${t}_${r}` as BlankUID;
}

type Snapshot = {
  template: string;
  counter: number;
  selectedBlankId: string | null;
  store: BlankStore;
};

function extractGeneratedKeyExpr(snippet: string, blankId: string): string | null {
  // matches:   3: K.num({ oneOf: [64, 32] }),
  // or:        3: generateKeyFromReference("64", { bind: {...} }),
  const re = new RegExp(
    String.raw`^\s*${blankId}\s*:\s*(.+?)\s*,\s*$`,
    "m"
  );
  const m = snippet.match(re);
  if (!m) return null;
  return m[1].trim();
}


type AutoGrowProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxVh?: number; // default 0.7
};

type RegistryRow = {
  key: string; // bindKey e.g. "arrVar"
  desc: string;
  examples: string; // comma-separated identifiers
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

type PatternRow =
  | { kind: "identifier", bindAs?: string}
  | { kind: "string", bindAs?: string }
  | { kind: "number" ,bindAs?: string}
  | { kind: "sameAs"; target: string }
  | { kind: "oneOf"; valuesRaw: string } // comma list
  | { kind: "wildcard"; min?: string; max?: string }
  | { kind: "literal"; text: string };

function parseCsvOps(raw: string): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function persistNow(args: {
  store: any;
  tables: any;
  activeId: string | null;
  projectCode: string;
  templateCode: string;
  solvedCode: string;
  projectId: string;
}) {
  if (typeof window === "undefined") return;

  const pid = args.projectId;

  window.localStorage.setItem(k(LS_BLANK_STORE, pid), JSON.stringify(args.store));
  window.localStorage.setItem(k(LS_TABLES_KEY, pid), JSON.stringify(args.tables));
  window.localStorage.setItem(k(LS_ACTIVE_ID_KEY, pid), args.activeId ?? "");

  window.localStorage.setItem(k(LS_PROJECT_CODE, pid), args.projectCode);
  window.localStorage.setItem(k(LS_TEMPLATE_CODE, pid), args.templateCode);
  window.localStorage.setItem(k(LS_SOLVED_CODE, pid), args.solvedCode);
}


function loadRegistryTables(projectId: string): RegistryTable[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<RegistryTable[]>(window.localStorage.getItem(k(LS_TABLES_KEY, projectId)));
  return Array.isArray(parsed) ? parsed : [];
}

function loadRegistryActiveId(projectId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(k(LS_ACTIVE_ID_KEY, projectId));
}


function k(base: string, projectId: string) {
  return `${base}:${projectId}`;
}

function buildBindingsFromActiveRegistry(projectId: string): Record<string, string> {
  const tables = loadRegistryTables(projectId);
  const activeId = loadRegistryActiveId(projectId);
  const active = (activeId && tables.find((t) => t.id === activeId)) || tables[0] || null;
  if (!active) return {};

  const bindings: Record<string, string> = {};
  for (const row of active.rows || []) {
    const bindKey = (row.key || "").trim();
    if (!bindKey) continue;

    const ids = String(row.examples || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const ident of ids) bindings[ident] = bindKey;
  }
  return bindings;
}

const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowProps>(function AutoGrowTextarea(
  { maxVh = 0.7, ...props },
  forwardedRef
) {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;

      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef && "current" in forwardedRef) (forwardedRef as any).current = node;
    },
    [forwardedRef]
  );

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;

    // capture scroll so page doesn't jump
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    el.style.height = "auto";

    const maxPx = Math.floor(window.innerHeight * maxVh);
    const next = Math.min(el.scrollHeight, maxPx);

    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";

    window.scrollTo(scrollX, scrollY);
  }, [maxVh]);

  React.useLayoutEffect(() => {
    resize();
  }, [resize, props.value]);

  return (
    <textarea
      {...props}
      ref={setRefs}
      onChange={(e) => {
        props.onChange?.(e);
        requestAnimationFrame(resize);
      }}
      className={[props.className || "", "resize-none"].join(" ")}
    />
  );
});

export default function CreateBlanksPage(){

  const params = useParams<{ projectId?: string }>();
  const rawId = params?.projectId as string | undefined;
  const projectId = rawId ? decodeURIComponent(rawId) : null;
  if (!projectId) {
    return <div className="p-6 text-sm opacity-70">Loading…</div>;
  }

  const pid = projectId;


  const get = React.useCallback((key: string) => lsGet(key, projectId), [projectId]);
  const set = React.useCallback((key: string, value: string) => lsSet(key, projectId, value), [projectId]);
  const getJson = React.useCallback(
    <T,>(key: string, fallback: T) => lsGetJson<T>(key, projectId, fallback),
    [projectId]
  );
  const setJson = React.useCallback((key: string, value: any) => lsSetJson(key, projectId, value), [projectId]);
  const kk = React.useCallback((base: string) => k(base, projectId), [projectId]);


  const [answerKeySnippet, setAnswerKeySnippet] = React.useState("");
  const [answerKeyReport, setAnswerKeyReport] = React.useState("");
  const [createMode, setCreateMode] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<string>("");
  const [didLoad, setDidLoad] = React.useState(false);
  const [patternRowsDraft, setPatternRowsDraft] = React.useState<PatternRow[]>([
    { kind: "identifier" },
    { kind: "literal", text: "." },
    { kind: "literal", text: "println" },
    { kind: "literal", text: "(" },
    { kind: "string" },
    { kind: "literal", text: ")" },
    ]);

    const [patternModeDraft, setPatternModeDraft] = React.useState<"exact" | "contains">("exact");
    const [patternNoSpaceOpsDraft, setPatternNoSpaceOpsDraft] = React.useState("."); // input like "." or ".,::"

    const [sameAsTargetDraft, setSameAsTargetDraft] = React.useState("");
    const sameAsTargetDraftRef = React.useRef(sameAsTargetDraft);
    React.useEffect(() => { sameAsTargetDraftRef.current = sameAsTargetDraft; }, [sameAsTargetDraft]);


  const [solved, setSolved] = React.useState("");
  const [template, setTemplate] = React.useState("");

  // selection UI (for making blanks)
  const [sel, setSel] = React.useState<{ start: number; end: number; text: string } | null>(null);

  // blank numbering (display ids)
  const [counter, setCounter] = React.useState<number>(1);

  // stable internal store
  const [store, setStore] = React.useState<BlankStore>({ uidByDisplay: {}, metaByUid: {} });

  // inspector selection (display id)
  const [selectedBlankId, setSelectedBlankId] = React.useState<string | null>(null);

    // ---------- Inspector drafts (avoid writing store on every keystroke) ----------
const [answerDraft, setAnswerDraft] = React.useState("");
const [descDraft, setDescDraft] = React.useState("");
const [bindDraft, setBindDraft] = React.useState("");

const [constraintDraft, setConstraintDraft] = React.useState<ConstraintType>("expr_ref");
const [allowedDraft, setAllowedDraft] = React.useState("");   // "64, 32"
const [minDraft, setMinDraft] = React.useState("");           // "0"
const [maxDraft, setMaxDraft] = React.useState("");           // "255"const [testInputDraft, setTestInputDraft] = React.useState("");

const [testValue, setTestValue] = React.useState("");
const [testResult, setTestResult] = React.useState<{
  ok: boolean;
  message: string;
  bound?: Record<string, string>;
} | null>(null);

const [pendingSelectBlankId, setPendingSelectBlankId] = React.useState<string | null>(null);

const [blankSearch, setBlankSearch] = React.useState("");

const [requireQuotedDraft, setRequireQuotedDraft] = React.useState<"no" | "yes">("no");
const requireQuotedDraftRef = React.useRef(requireQuotedDraft);
React.useEffect(() => { requireQuotedDraftRef.current = requireQuotedDraft; }, [requireQuotedDraft]);


// ------------------------------------------------------------
// Load once on mount if ?s=... exists
// ------------------------------------------------------------
React.useEffect(() => {
  if (!projectId) return;
  if (typeof window === "undefined") return;

  const sp = new URLSearchParams(window.location.search);
  const s = sp.get("s");
  if (!s) return;

  try {
    const json = decodeURIComponent(
      escape(window.atob(decodeURIComponent(s)))
    );
    const payload = JSON.parse(json) as {
      v: number;
      projectId: string;
      projectCode: string;
      templateCode: string;
      solvedCode: string;
      store: any;
      tables: any;
      activeId: string | null;
    };

    // Write into localStorage for THIS projectId
    persistNow({
      store: payload.store,
      tables: payload.tables,
      activeId: payload.activeId ?? null,
      projectCode: payload.projectCode ?? "",
      templateCode: payload.templateCode ?? "",
      solvedCode: payload.solvedCode ?? "",
      projectId,
    });

    // Clean the URL so it doesn't keep re-importing on refresh
    sp.delete("s");
    const nextUrl =
      window.location.pathname + (sp.toString() ? `?${sp.toString()}` : "");
    window.history.replaceState({}, "", nextUrl);

    setSaveStatus("Imported from share link ✓");
  } catch (e) {
    console.warn("Share import failed", e);
    setSaveStatus("Share import failed (bad link)");
  }
}, [projectId]);



React.useLayoutEffect(() => {
  if (!pendingSelectBlankId) return;

  const ta = templateTextareaRef.current;
  if (!ta) return;

  const ph = `__BLANK[${pendingSelectBlankId}]__`;
  const idx = ta.value.indexOf(ph);

  if (idx >= 0) {
    ta.focus();
    ta.setSelectionRange(idx, idx + ph.length);

    // Scroll selection into view (textarea doesn't have scrollIntoView for ranges)
    const before = ta.value.slice(0, idx);
    const lineCount = before.split("\n").length;
    const approxLineHeight = 18; // close enough for monospace 14px
    const targetTop = Math.max(0, (lineCount - 3) * approxLineHeight);
    ta.scrollTop = targetTop;
  }

  setPendingSelectBlankId(null);
}, [template, pendingSelectBlankId]);



const [notes, setNotes] = React.useState("");

// hydrate notes when projectId changes
React.useEffect(() => {
  if (!projectId) return;
  setNotes(lsGet(LS_NOTES, projectId) || "");
}, [projectId]);

// persist notes (debounced)
React.useEffect(() => {
  if (!projectId) return;

  const t = window.setTimeout(() => {
    lsSet(LS_NOTES, projectId, notes);
  }, 250);

  return () => window.clearTimeout(t);
}, [projectId, notes]);


// debounce commit
const commitTimerRef = React.useRef<number | null>(null);
const lastUndoStampRef = React.useRef<number>(0);

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

function parseCsv(raw: string): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOneOfNums(raw: string): number[] {
  const items = parseCsv(raw);
  const out: number[] = [];
  for (const it of items) {
    const n = Number(it);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}
function rowsToPatternParts(rows: PatternRow[]) {
  const parts: any[] = [];

  for (const r of rows) {
    if (r.kind === "literal") {
      const t = String((r as any).text ?? "");
      if (t.trim() !== "") parts.push(t);
      continue;
    }

    if (r.kind === "identifier") {
      const bindAs = (r.bindAs ?? "").trim();
      parts.push(bindAs ? { p: "identifier", bindAs } : { p: "identifier" });
      continue;
    }

    if (r.kind === "string") {
      const bindAs = (r.bindAs ?? "").trim();
      parts.push(bindAs ? { p: "string", bindAs } : { p: "string" });
      continue;
    }

    if (r.kind === "number") {
      const bindAs = (r.bindAs ?? "").trim();
      parts.push(bindAs ? { p: "number", bindAs } : { p: "number" });
      continue;
    }

    if (r.kind === "sameAs") {
      parts.push({ p: "sameAs", target: String((r as any).target ?? "") });
      continue;
    }

    if (r.kind === "oneOf") {
      parts.push({ p: "oneOf", values: parseCsv(String((r as any).valuesRaw ?? "")) });
      continue;
    }

    if (r.kind === "wildcard") {
      const min = (r as any).min?.trim() === "" ? undefined : Number((r as any).min);
      const max = (r as any).max?.trim() === "" ? undefined : Number((r as any).max);
      parts.push({
        p: "wildcard",
        min: Number.isFinite(min as any) ? min : undefined,
        max: Number.isFinite(max as any) ? max : undefined,
      });
      continue;
    }
  }

  return parts;
}


function parseOneOfStrs(raw: string): string[] {
  // allow: A,B  OR  "A","B"
  const items = parseCsv(raw);
  return items.map((s) => {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
    return t;
  });
}
function buildPatternSpecFromDraft() {
  const parts = rowsToPatternParts(patternRowsDraft);
  const ops = parseCsvOps(patternNoSpaceOpsDraft);

  const spec: any = {
    type: "pattern",
    parts,
    policy: ops.length ? { requireNoSpacesAround: ops } : undefined,
    mode: patternModeDraft, //
  };

  // remove undefined fields so JSON is clean
  if (!spec.policy) delete spec.policy;
  if (!spec.mode) delete spec.mode;

  return spec;
}



function upsertAnswerKeyLine(existing: string, blankId: string, newLine: string) {
  const id = String(blankId).trim();
  const lineRe = new RegExp(`^\\s*${id}\\s*:\\s*.*?,\\s*$`, "m");

  // If snippet empty, create a minimal wrapper
  if (!existing || !existing.trim()) {
    return [
      `import { K, buildAnswerKey } from "@/src/lesson-core/blankKeyBuilder";`,
      `import { generateKeyFromReference } from "@/src/lesson-core/blankKeyGenerator";`,
      ``,
      `answerKey: buildAnswerKey({`,
      `  ${id}: ${newLine},`,
      `}),`,
    ].join("\n");
  }

  // Replace existing line if present
  if (lineRe.test(existing)) {
    return existing.replace(lineRe, `  ${id}: ${newLine},`);
  }

  // Otherwise insert before the closing `}),`
  const closingRe = /^\s*\}\),\s*$/m;
  if (closingRe.test(existing)) {
    return existing.replace(closingRe, `  ${id}: ${newLine},\n}),`);
  }

  // Fallback: if structure is unexpected, append at end
  return `${existing.trimEnd()}\n  ${id}: ${newLine},\n`;
}

function makeShareLink() {
  // make sure current edits are committed to store + written to localStorage
  flushAllNow();

  // Build payload from CURRENT state (refs are safest)
  const payload = {
    v: 1,
    projectId: pid,
    projectCode: get(LS_PROJECT_CODE) || solvedRef.current || "",
    templateCode: templateRef.current || "",
    solvedCode: solvedRef.current || "",
    store: storeRef.current,
    tables: loadRegistryTables(pid),
    activeId: loadRegistryActiveId(pid),
  };

  const json = JSON.stringify(payload);
  const b64 = window.btoa(unescape(encodeURIComponent(json)));

  const url = new URL(window.location.href);
  url.searchParams.set("s", encodeURIComponent(b64));

  navigator.clipboard?.writeText(url.toString()).catch(() => {});
  setSaveStatus("Share link copied ✓");
}


function emitSingleKeyExpr(opts: {
  blankId: string;
  answer: string;
  bindKey?: string;
  bindings: Record<string, string>;
  constraint?: {
    constraintType?: ConstraintType;
    allowedRaw?: string;
    rangeMinRaw?: string;
    rangeMaxRaw?: string;
    sameAsTarget?: string;
    requireQuoted?: boolean;

  };
}) {
  const { blankId, answer, bindKey, bindings, constraint } = opts;
  const ans = (answer ?? "").trim();
  const bk = (bindKey ?? "").trim();
  const c = constraint || {};
  const cType = (c.constraintType || "expr_ref") as ConstraintType;

  // bindKey always wins
  if (bk) return `K.id().bind(${JSON.stringify(bk)})`;

  if (cType === "num_any") return `K.num()`;

  if (cType === "num_range") {
    const min = Number(c.rangeMinRaw);
    const max = Number(c.rangeMaxRaw);
    const parts: string[] = [];
    if (Number.isFinite(min)) parts.push(`min: ${min}`);
    if (Number.isFinite(max)) parts.push(`max: ${max}`);
    return `K.num(${parts.length ? `{ ${parts.join(", ")} }` : ""})`;
  }

if (cType === "same_as") {
  let target = String(c.sameAsTarget ?? "").trim(); // bind key

  // If user typed quotes, strip ONE layer: "mainIndex" -> mainIndex, 'mainIndex' -> mainIndex
  if (
    (target.startsWith('"') && target.endsWith('"')) ||
    (target.startsWith("'") && target.endsWith("'"))
  ) {
    target = target.slice(1, -1);
  }

  return `K.same(${JSON.stringify(target)})`;
}



  if (cType === "num_oneOf") {
    const nums = parseOneOfNums(c.allowedRaw || "");
    return nums.length ? `K.num({ oneOf: ${JSON.stringify(nums)} })` : `K.num()`;
  }

  if (cType === "str_oneOf") {
    const strs = parseOneOfStrs(c.allowedRaw || "");
    const rq = c.requireQuoted === true;

    const opts: string[] = [];
    if (strs.length) opts.push(`oneOf: ${JSON.stringify(strs)}`);
    if (rq) opts.push(`requireQuoted: true`);

    return `K.str(${opts.length ? `{ ${opts.join(", ")} }` : ""})`;
  }


  if (cType === "id_bound") {
    // requires bindKey, but it's missing
    return `K.id()`;
  }

    // pattern presets
  if (cType === "pat_array_empty") {
    return `({ type: "pattern", parts: [{ p: "identifier" }, "[", "]"] } as const)`;
  }
  if (cType === "pat_array_index") {
    return `({ type: "pattern", parts: [{ p: "identifier" }, "[", { p: "any", specs: [{ p: "identifier" }, { p: "number" }] }, "]"] } as const)`;
  }


  // expr_ref fallback
  const hasStructure = /[\[\]\(\)\{\},.+\-*/=!<>:]/.test(ans);

  if (looksNumber(ans) && !hasStructure) return `K.num()`;
  if (looksQuoted(ans) && !hasStructure) return `K.str()`;
  if (looksIdentifier(ans) && !hasStructure) return `K.id()`;

  return `generateKeyFromReference(${JSON.stringify(ans)}, { bind: ${JSON.stringify(bindings)} })`;
}


function onGenerateAnswerKey() {
  if (!selectedRef.current) {
    alert("Select a blank first, then click Generate.");
    return;
  }

  const id = String(selectedRef.current);
  const meta = getBlankMeta(storeRef.current, id);

  const answer = (meta?.answer ?? "").trim();
  if (!answer) {
    alert(`Blank ${id} has no stored answer text.`);
    return;
  }

  const bindings = buildBindingsFromActiveRegistry(pid);

  let expr: string;

  if (meta?.constraintType === "pattern_custom") {
    const parsed = safeJsonParse<any>(meta.patternJson ?? "");
    if (!parsed || parsed.type !== "pattern" || !Array.isArray(parsed.parts)) {
      alert("Pattern JSON is missing/invalid. Click 'Save pattern' in the Pattern builder first.");
      return;
    }
    expr = `(${JSON.stringify(parsed, null, 2)} as const)`;
  } else {
    expr = emitSingleKeyExpr({
      blankId: id,
      answer,
      bindKey: meta?.bindKey,
      bindings,
      constraint: {
        constraintType: meta?.constraintType,
        allowedRaw: meta?.allowedRaw,
        rangeMinRaw: meta?.rangeMinRaw,
        rangeMaxRaw: meta?.rangeMaxRaw,
        sameAsTarget: meta?.sameAsTarget,
        requireQuoted: meta?.requireQuoted,
      },
    });
  }


  //  1) Update the big snippet (incremental upsert)
  setAnswerKeySnippet((prev) => {
    const next = upsertAnswerKeyLine(prev, id, expr);
    navigator.clipboard?.writeText(next).catch(() => {});
    return next;
  });

  //  2) Store *the generated expr* on the blank meta
  setStore((prev) => {
    const uid = resolveBlankUid(prev, id);
    if (!uid) return prev;

    const m = prev.metaByUid?.[uid];
    if (!m) return prev;

    return {
      ...prev,
      metaByUid: {
        ...prev.metaByUid,
        [uid]: {
          ...m,
          generatedKeyExpr: expr, // ✅ store it
          updatedAt: Date.now(),
        },
      },
    };
  });

  // Optional: small report
  setAnswerKeyReport((prev) => {
    const line = `- ${id}: ${JSON.stringify(answer)}  ->  ${expr}`;
    if (!prev || !prev.trim()) {
      return [
        `Generated 1 blank (incremental mode).`,
        `Using registry bindings: ${Object.keys(bindings).length} identifiers mapped.`,
        ``,
        line,
      ].join("\n");
    }
    return `${prev.trimEnd()}\n${line}`;
  });
}


function pushUndoSnapshotThrottled(nextSelectedId?: string | null) {
  const now = Date.now();
  if (now - lastUndoStampRef.current < 700) return; // throttle snapshots while typing
  lastUndoStampRef.current = now;
  pushUndoSnapshot(nextSelectedId);
}

function scheduleCommitSelectedBlank(next: {
  answer?: string;
  description?: string;
  bindKey?: string;

  constraintType?: ConstraintType;
  allowedRaw?: string;
  rangeMinRaw?: string;
  rangeMaxRaw?: string;
  patternJson?: string;
  sameAsTarget?: string;
  requireQuoted?: boolean;

}) {
  const blankId = selectedRef.current;
  if (!blankId) return;

  if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);

  commitTimerRef.current = window.setTimeout(() => {
    pushUndoSnapshotThrottled(blankId);

    setStore((prev) => {
      const uid = resolveBlankUid(prev, blankId);
      const now = Date.now();

      // if missing, create record
      if (!uid) {
        const uidNew = newUid();
        return {
          uidByDisplay: { ...(prev.uidByDisplay || {}), [blankId]: uidNew },
          metaByUid: {
            ...(prev.metaByUid || {}),
            [uidNew]: {
                uid: uidNew,
                answer: next.answer ?? "",
                description: next.description,
                bindKey: next.bindKey,

                constraintType: next.constraintType ?? "expr_ref",
                allowedRaw: next.allowedRaw,
                rangeMinRaw: next.rangeMinRaw,
                rangeMaxRaw: next.rangeMaxRaw,
                patternJson: next.patternJson ?? "",
                sameAsTarget: next.sameAsTarget,
                requireQuoted: typeof next.requireQuoted === "undefined" ? false : next.requireQuoted,

                createdAt: now,
                updatedAt: now,
            },
          },
        };
      }

      const meta = prev.metaByUid?.[uid];
      if (!meta) return prev;

      return {
        ...prev,
        metaByUid: {
          ...prev.metaByUid,
          [uid]: {
            ...meta,
            answer: typeof next.answer === "undefined" ? meta.answer : next.answer,
            description: typeof next.description === "undefined" ? meta.description : next.description,
            bindKey: typeof next.bindKey === "undefined" ? meta.bindKey : next.bindKey,
            updatedAt: now,
            constraintType: typeof next.constraintType === "undefined" ? meta.constraintType : next.constraintType,
            allowedRaw: typeof next.allowedRaw === "undefined" ? meta.allowedRaw : next.allowedRaw,
            rangeMinRaw: typeof next.rangeMinRaw === "undefined" ? meta.rangeMinRaw : next.rangeMinRaw,
            rangeMaxRaw: typeof next.rangeMaxRaw === "undefined" ? meta.rangeMaxRaw : next.rangeMaxRaw,
            sameAsTarget: typeof next.sameAsTarget === "undefined" ? meta.sameAsTarget : next.sameAsTarget,
            patternJson: typeof next.patternJson === "undefined" ? meta.patternJson : next.patternJson,
            requireQuoted: typeof next.requireQuoted === "undefined" ? meta.requireQuoted : next.requireQuoted,

          },
        },
      };
    });
  }, 250);
}

function commitPatternToSelectedBlank(nextRows?: PatternRow[], nextMode?: "exact" | "contains", nextOps?: string) {
  const spec = {
    ...buildPatternSpecFromDraft(),
    ...(typeof nextMode !== "undefined" ? { mode: nextMode } : {}),
  };

  const json = JSON.stringify(spec, null, 2);

  scheduleCommitSelectedBlank({
    patternJson: json,
    constraintType: "pattern_custom",
  } as any);
}


function applyDraftsToStoreSync(prev: BlankStore, blankId: string, next: {
  answer: string;
  description: string;
  bindKey: string;
  constraintType: ConstraintType;
  allowedRaw: string;
  rangeMinRaw: string;
  rangeMaxRaw: string;
  patternJson?: string;
  sameAsTarget: string;
  requireQuoted: "no" | "yes";
}): BlankStore {

  const now = Date.now();
  const uid = resolveBlankUid(prev, blankId);

  if (!uid) {
    const uidNew = newUid();
    return {
      uidByDisplay: { ...(prev.uidByDisplay || {}), [blankId]: uidNew },
      metaByUid: {
        ...(prev.metaByUid || {}),
        [uidNew]: {
          uid: uidNew,
          answer: next.answer ?? "",
          description: next.description ?? "",
          bindKey: next.bindKey ?? "",
          constraintType: next.constraintType ?? "expr_ref",
          allowedRaw: next.allowedRaw ?? "",
          rangeMinRaw: next.rangeMinRaw ?? "",
          rangeMaxRaw: next.rangeMaxRaw ?? "",
          createdAt: now,
          updatedAt: now,
          patternJson: next.patternJson ?? "",
          sameAsTarget: next.sameAsTarget ?? "", 
          requireQuoted: next.requireQuoted === "yes",

        },
      },
    };
  }

  const meta = prev.metaByUid?.[uid];
  if (!meta) return prev;

  return {
    ...prev,
    metaByUid: {
      ...prev.metaByUid,
      [uid]: {
        ...meta,
        answer: next.answer,
        description: next.description,
        bindKey: next.bindKey,
        constraintType: next.constraintType,
        allowedRaw: next.allowedRaw,
        rangeMinRaw: next.rangeMinRaw,
        rangeMaxRaw: next.rangeMaxRaw,
        sameAsTarget: next.sameAsTarget,
        requireQuoted: next.requireQuoted === "yes",
        updatedAt: now,
      },
    },
  };
}


  // keep latest state in refs so undo/redo + key handlers are stable
  const templateRef = React.useRef(template);
  const counterRef = React.useRef(counter);
  const storeRef = React.useRef(store);
  const selectedRef = React.useRef<string | null>(selectedBlankId);

    // also keep solved in a ref (used by flush)
const solvedRef = React.useRef(solved);
React.useEffect(() => { solvedRef.current = solved; }, [solved]);

// Draft refs so pagehide can flush latest typed values
const answerDraftRef = React.useRef(answerDraft);
const descDraftRef = React.useRef(descDraft);
const bindDraftRef = React.useRef(bindDraft);
const constraintDraftRef = React.useRef(constraintDraft);
const allowedDraftRef = React.useRef(allowedDraft);
const minDraftRef = React.useRef(minDraft);
const maxDraftRef = React.useRef(maxDraft);

React.useEffect(() => { answerDraftRef.current = answerDraft; }, [answerDraft]);
React.useEffect(() => { descDraftRef.current = descDraft; }, [descDraft]);
React.useEffect(() => { bindDraftRef.current = bindDraft; }, [bindDraft]);
React.useEffect(() => { constraintDraftRef.current = constraintDraft; }, [constraintDraft]);
React.useEffect(() => { allowedDraftRef.current = allowedDraft; }, [allowedDraft]);
React.useEffect(() => { minDraftRef.current = minDraft; }, [minDraft]);
React.useEffect(() => { maxDraftRef.current = maxDraft; }, [maxDraft]);

// Other text boxes you want to survive back/forward
const answerKeySnippetRef = React.useRef(answerKeySnippet);
const answerKeyReportRef = React.useRef(answerKeyReport);
const testValueRef = React.useRef(testValue);

React.useEffect(() => { answerKeySnippetRef.current = answerKeySnippet; }, [answerKeySnippet]);
React.useEffect(() => { answerKeyReportRef.current = answerKeyReport; }, [answerKeyReport]);
React.useEffect(() => { testValueRef.current = testValue; }, [testValue]);

  React.useEffect(() => {
    templateRef.current = template;
  }, [template]);
  React.useEffect(() => {
    counterRef.current = counter;
  }, [counter]);
  React.useEffect(() => {
    storeRef.current = store;
  }, [store]);
  React.useEffect(() => {
    selectedRef.current = selectedBlankId;
  }, [selectedBlankId]);

  // keep inspector drafts in sync with selected blank
React.useEffect(() => {
  if (!selectedBlankId) {
    setAnswerDraft("");
    setDescDraft("");
    setBindDraft("");

    setConstraintDraft("expr_ref");
    setAllowedDraft("");
    setMinDraft("");
    setMaxDraft("");
    setRequireQuotedDraft("no");
    return;
  }



  const meta = getBlankMeta(store, selectedBlankId);

  const rq = meta?.requireQuoted === true ? "yes" : "no";
  setRequireQuotedDraft(rq); 
  setAnswerDraft(meta?.answer ?? "");
  setDescDraft(meta?.description ?? "");
  setBindDraft(meta?.bindKey ?? "");

  setConstraintDraft((meta?.constraintType as ConstraintType) ?? "expr_ref");
  setAllowedDraft(meta?.allowedRaw ?? "");
  setMinDraft(meta?.rangeMinRaw ?? "");
  setMaxDraft(meta?.rangeMaxRaw ?? "");
  setSameAsTargetDraft(meta?.sameAsTarget ?? "");

}, [selectedBlankId, store]);



  // history (undo/redo)
  const undoStackRef = React.useRef<Snapshot[]>([]);
  const redoStackRef = React.useRef<Snapshot[]>([]);

  const templateTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = React.useRef<HTMLPreElement | null>(null);

  function pushUndoSnapshot(nextSelectedId?: string | null) {
    undoStackRef.current.push({
      template: templateRef.current,
      counter: counterRef.current,
      store: structuredClone(storeRef.current),
      selectedBlankId: typeof nextSelectedId === "undefined" ? selectedRef.current : nextSelectedId,
    });
    redoStackRef.current = [];
  }

  function restoreSnapshot(s: Snapshot) {
    setTemplate(s.template);
    setCounter(s.counter);
    setStore(s.store);
    setSelectedBlankId(s.selectedBlankId ?? null);
    setSel(null);
  }

  function undo() {
    const stack = undoStackRef.current;
    if (!stack.length) return;

    const current: Snapshot = {
      template: templateRef.current,
      counter: counterRef.current,
      store: structuredClone(storeRef.current),
      selectedBlankId: selectedRef.current,
    };

    const prev = stack.pop()!;
    redoStackRef.current.push(current);
    restoreSnapshot(prev);
  }

  function redo() {
    const stack = redoStackRef.current;
    if (!stack.length) return;

    const current: Snapshot = {
      template: templateRef.current,
      counter: counterRef.current,
      store: structuredClone(storeRef.current),
      selectedBlankId: selectedRef.current,
    };

    const next = stack.pop()!;
    undoStackRef.current.push(current);
    restoreSnapshot(next);
  }

  // keyboard shortcuts (stable handler)
// keyboard shortcuts (stable handler)
React.useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();

    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((key === "z" && e.shiftKey) || key === "y") {
      e.preventDefault();
      redo();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);

// navigation / persistence / BFCache handling

React.useEffect(() => {
  if (!projectId) return;

  const hydrateOnce = () => {
    const project = get(LS_PROJECT_CODE);
    const storedSolved = get(LS_SOLVED_CODE);
    const storedTemplate = get(LS_TEMPLATE_CODE);

    const initialSolved = storedSolved || project || "";
    const initialTemplate = storedTemplate || initialSolved || "";

    // if LS is empty but we already have real state, do NOT overwrite
    // (prevents "wipe" when coming back via history)
    const lsLooksEmpty =
      !storedSolved &&
      !storedTemplate &&
      !project &&
      Object.keys(getJson<BlankStore>(LS_BLANK_STORE, { uidByDisplay: {}, metaByUid: {} }).uidByDisplay || {}).length === 0;

    const stateLooksReal =
      (templateRef.current && templateRef.current.trim().length > 0) ||
      (solvedRef.current && solvedRef.current.trim().length > 0) ||
      Object.keys(storeRef.current.uidByDisplay || {}).length > 0;

    if (lsLooksEmpty && stateLooksReal) {
      return; // don't stomp state (and therefore don't trigger empty writes)
    }

    setSolved(initialSolved);
    setTemplate(initialTemplate);

    setAnswerKeySnippet(get(LS_ANSWERKEY_SNIPPET) || "");
    setAnswerKeyReport(get(LS_ANSWERKEY_REPORT) || "");
    setTestValue(get(LS_TEST_VALUE) || "");

    // load new store
    const storedStore = getJson<BlankStore>(LS_BLANK_STORE, { uidByDisplay: {}, metaByUid: {} });

    // migrate legacy answersMap if needed and if store looks empty
    const legacyAnswers = getJson<Record<string, string>>(LS_ANSWERS_MAP, {});
    let nextStore = storedStore;

    const storeEmpty = !storedStore || Object.keys(storedStore.uidByDisplay || {}).length === 0;
    const hasLegacy = legacyAnswers && Object.keys(legacyAnswers).length > 0;

    if (storeEmpty && hasLegacy) {
      const uidByDisplay: Record<string, BlankUID> = {};
      const metaByUid: Record<BlankUID, BlankMeta> = {};
      const now = Date.now();

      for (const [displayId, answer] of Object.entries(legacyAnswers)) {
        const uid = newUid();
        uidByDisplay[String(displayId)] = uid;
        metaByUid[uid] = {
          uid,
          answer: String(answer ?? ""),
          createdAt: now,
          updatedAt: now,
        };
      }

      nextStore = { uidByDisplay, metaByUid };
      setJson(LS_BLANK_STORE, nextStore);
    }

    setStore(nextStore);

    const storedCounter = Number(get(LS_BLANK_COUNTER) || "1");
    const c = Number.isFinite(storedCounter) && storedCounter > 0 ? storedCounter : 1;
    setCounter(nextAvailableCounter(initialTemplate, c));

    setDidLoad(true);
  };

  hydrateOnce();

  // only flush on hide; do NOT rehydrate on focus/pageshow
  const onPageHide = () => flushAllNow();
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flushAllNow();
  };

  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    flushAllNow();
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}, [projectId, get, getJson, setJson]);


  // load from localStorage (with migration)

  React.useEffect(() => {
  if (!didLoad) return;
  set(LS_SOLVED_CODE, solved);
}, [solved, didLoad]);

React.useEffect(() => {
  if (!didLoad) return;
  set(LS_TEMPLATE_CODE, template);
}, [template, didLoad]);

React.useEffect(() => {
  if (!didLoad) return;
  set(LS_BLANK_COUNTER, String(counter));
}, [counter, didLoad]);

const persistTimerRef = React.useRef<number | null>(null);

React.useEffect(() => {
  if (!didLoad) return;

  if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);

  persistTimerRef.current = window.setTimeout(() => {
    setJson(LS_BLANK_STORE, storeRef.current); // or `store` is fine
  }, 400);

  return () => {
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
  };
}, [store, didLoad]);


function flushAllNow() {
  if (typeof window === "undefined") return;

  // cancel pending debounced commits/saves
  if (commitTimerRef.current) {
    window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
  }
  if (persistTimerRef.current) {
    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = null;
  }

  // 1) Force-commit inspector drafts into store synchronously
  let nextStore = storeRef.current;
  const bid = selectedRef.current;

  if (bid) {
    nextStore = applyDraftsToStoreSync(nextStore, bid, {
      answer: answerDraftRef.current ?? "",
      description: descDraftRef.current ?? "",
      bindKey: bindDraftRef.current ?? "",
      constraintType: (constraintDraftRef.current ?? "expr_ref") as ConstraintType,
      allowedRaw: allowedDraftRef.current ?? "",
      rangeMinRaw: minDraftRef.current ?? "",
      rangeMaxRaw: maxDraftRef.current ?? "",
      sameAsTarget: sameAsTargetDraftRef.current ?? "", 
      requireQuoted: requireQuotedDraftRef.current ?? "no", 
    });
    storeRef.current = nextStore;
  }

  // 2) Persist other UI textareas/inputs that otherwise reset on remount
localStorage.setItem(k(LS_ANSWERKEY_SNIPPET, pid), answerKeySnippetRef.current ?? "");
window.localStorage.setItem(k(LS_ANSWERKEY_REPORT, pid), answerKeyReportRef.current ?? "");
window.localStorage.setItem(k(LS_TEST_VALUE, pid), testValueRef.current ?? "");
window.localStorage.setItem(k(LS_BLANK_COUNTER, pid), String(counterRef.current ?? 1));

  // --- GUARD: don't overwrite an existing project with empty state ---
  const existingStoreRaw = window.localStorage.getItem(k(LS_BLANK_STORE, pid)) || "";
  const existingSolved   = window.localStorage.getItem(k(LS_SOLVED_CODE, pid)) || "";
  const existingTemplate = window.localStorage.getItem(k(LS_TEMPLATE_CODE, pid)) || "";

  const existingLooksReal =
    existingStoreRaw.length > 10 || existingSolved.trim().length > 0 || existingTemplate.trim().length > 0;

  const nextLooksEmpty =
    Object.keys((nextStore?.uidByDisplay || {})).length === 0 &&
    (templateRef.current ?? "").trim().length === 0 &&
    (solvedRef.current ?? "").trim().length === 0;

  // If localStorage already has real data, never stomp it with empty.
  if (existingLooksReal && nextLooksEmpty) {
    return;
  }


  // 3) Persist core data immediately (no debounce)
persistNow({
  store: nextStore,
  tables: loadRegistryTables(pid),
  activeId: loadRegistryActiveId(pid),
  projectCode: get(LS_PROJECT_CODE) || "",
  templateCode: templateRef.current ?? "",
  solvedCode: solvedRef.current ?? "",
  projectId: pid,
});
}

function onSave() {
  flushAllNow();
  setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`);
  window.setTimeout(() => setSaveStatus(""), 2000);
}




  function captureSelectionFromTextarea(el: HTMLTextAreaElement | null) {
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) {
      setSel(null);
      return;
    }
    const text = template.slice(start, end);
    setSel({ start, end, text });
  }

  function openInspectorToggle(blankId: string) {
    // Fix: toggle inspector on/off for the same id (requested)
    setSelectedBlankId((cur) => (cur === blankId ? null : blankId));
  }

  function ensureBlankRecord(displayId: string, answer: string) {
    setStore((prev) => {
      const id = String(displayId);
      const existingUid = prev.uidByDisplay?.[id];
      const now = Date.now();

      if (existingUid && prev.metaByUid?.[existingUid]) {
        // update answer if missing / empty
        const meta = prev.metaByUid[existingUid];
        if ((meta.answer ?? "") !== String(answer ?? "")) {
          return {
            ...prev,
            metaByUid: {
              ...prev.metaByUid,
              [existingUid]: {
                ...meta,
                answer: String(answer ?? ""),
                updatedAt: now,
              },
            },
          };
        }
        return prev;
      }

      const uid = newUid();
      return {
        uidByDisplay: { ...(prev.uidByDisplay || {}), [id]: uid },
        metaByUid: {
          ...(prev.metaByUid || {}),
          [uid]: {
            uid,
            answer: String(answer ?? ""),
            createdAt: now,
            updatedAt: now,
          },
        },
      };
    });
  }

  

  function makeBlank() {
    const ta = templateTextareaRef.current;
    const prevTaScrollTop = ta?.scrollTop ?? 0;
    const prevTaScrollLeft = ta?.scrollLeft ?? 0;
    const winX = window.scrollX;
    const winY = window.scrollY;

    if (!sel) return;
    if (!createMode) return;

    const start = sel.start;
    const end = sel.end;
    if (start === end) return;

    const selected = sel.text;
    if (!selected.trim()) {
      setSel(null);
      return;
    }

    // prevent blanking existing placeholders
    if (/__BLANK\[\d+\]__/.test(selected)) {
      setSel(null);
      return;
    }

    const blankName = String(nextAvailableCounter(templateRef.current, counterRef.current));
    const placeholder = `__BLANK[${blankName}]__`;

    pushUndoSnapshot(blankName);

    const nextTemplate = replaceRange(templateRef.current, start, end, placeholder);
    setTemplate(nextTemplate);

    // stable record
    ensureBlankRecord(blankName, selected);

    setCounter(nextAvailableCounter(nextTemplate, counterRef.current + 1));
    setSel(null);

    // open inspector
    setSelectedBlankId(blankName);
    setPendingSelectBlankId(blankName);

    requestAnimationFrame(() => {
  window.scrollTo(winX, winY);

  const el = templateTextareaRef.current;
  if (el) {
    el.scrollTop = prevTaScrollTop;
    el.scrollLeft = prevTaScrollLeft;
  }
});

  }

  function resetFromSolved() {
    const ok = window.confirm("Reset template back to solved code and clear blanks? This clears blank metadata too.");
    if (!ok) return;

    pushUndoSnapshot(null);

    setTemplate(solved);
    setCounter(1);
    setStore({ uidByDisplay: {}, metaByUid: {} });
    setSel(null);
    setSelectedBlankId(null);

    undoStackRef.current = [];
    redoStackRef.current = [];
    
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  // ------------ Inspector actions ------------

  function getAnswerByDisplay(blankId: string): string {
    const meta = getBlankMeta(storeRef.current, blankId);
    return meta?.answer ?? "";
  }

  function removeBlank(blankId: string) {
    const placeholder = `__BLANK[${blankId}]__`;
    const curTemplate = templateRef.current;
    if (!curTemplate.includes(placeholder)) return;

    const answer = getAnswerByDisplay(blankId);
    if (answer == null) return;

    pushUndoSnapshot(blankId);

    const nextTemplate = curTemplate.split(placeholder).join(answer);
    setTemplate(nextTemplate);

    setStore((prev) => {
    const id = String(blankId);
    const uid = prev.uidByDisplay?.[id];

    const nextUidByDisplay = { ...(prev.uidByDisplay || {}) };
    delete nextUidByDisplay[id];

    const nextMetaByUid = { ...(prev.metaByUid || {}) };
    if (uid) delete nextMetaByUid[uid];

    return { uidByDisplay: nextUidByDisplay, metaByUid: nextMetaByUid };
    });


    setSelectedBlankId(null);
    setCounter(nextAvailableCounter(nextTemplate, counterRef.current));
  }

  function updateBlankAnswer(blankId: string, newAnswer: string) {
    const uid = resolveBlankUid(storeRef.current, blankId);
    if (!uid) {
      // create record if missing
      ensureBlankRecord(blankId, newAnswer);
      return;
    }

    pushUndoSnapshot(blankId);

    setStore((prev) => {
      const now = Date.now();
      const meta = prev.metaByUid?.[uid];
      if (!meta) return prev;
      return {
        ...prev,
        metaByUid: {
          ...prev.metaByUid,
          [uid]: {
            ...meta,
            answer: newAnswer,
            updatedAt: now,
          },
        },
      };
    });
  }


  function renameBlank(oldId: string, newId: string) {
    const o = String(oldId || "").trim();
    const n = String(newId || "").trim();
    if (!isValidBlankId(o) || !isValidBlankId(n)) return;
    if (o === n) return;

    const oldPh = `__BLANK[${o}]__`;
    const newPh = `__BLANK[${n}]__`;

    const curTemplate = templateRef.current;
    if (!curTemplate.includes(oldPh)) return;

    // prevent collisions in template
    const used = new Set(extractBlanksInOrder(curTemplate));
    if (used.has(n) && n !== o) {
      alert(`Blank ${n} already exists in the template.`);
      return;
    }

    pushUndoSnapshot(o);

    const nextTemplate = curTemplate.split(oldPh).join(newPh);
    setTemplate(nextTemplate);

    // IMPORTANT: keep internal uid stable; just remap display
    setStore((prev) => {
      const uid = prev.uidByDisplay?.[o];
      const nextUidByDisplay = { ...(prev.uidByDisplay || {}) };
      delete nextUidByDisplay[o];
      if (uid) nextUidByDisplay[n] = uid;
      return { ...prev, uidByDisplay: nextUidByDisplay };
    });

    setSelectedBlankId(n);
    setCounter(nextAvailableCounter(nextTemplate, counterRef.current));
  }

  function buildPatternSpec(cType: ConstraintType): AnswerSpec | null {
  if (cType === "pat_array_empty") {
    return {
      type: "pattern",
      parts: [{ p: "identifier" }, "[", "]"],
    };
  }

  if (cType === "pat_array_index") {
    return {
      type: "pattern",
      parts: [
        { p: "identifier" },
        "[",
        { p: "any", specs: [{ p: "identifier" }, { p: "number" }] },
        "]",
      ],
    };
  }

  return null;
}


    function buildAnswerSpecForBlank(meta: BlankMeta, bindings: Record<string, string>): AnswerSpec {
    const ans = String(meta.answer ?? "").trim();


    const cType = (meta.constraintType || "expr_ref") as ConstraintType;


    // If you explicitly bound this blank, treat it as identifier (bound)
    // regardless of other settings (you can remove this if you want strict behavior).
    const explicitBind = String(meta.bindKey ?? "").trim();

    const pat = buildPatternSpec(cType);
    if (pat) return pat;


    if (cType === "num_any") {
        const spec: BlankTypedSpec = { type: "number" };
        return spec;
    }

    if (cType === "num_range") {
        const minRaw = String(meta.rangeMinRaw ?? "").trim();
        const maxRaw = String(meta.rangeMaxRaw ?? "").trim();

        const min = minRaw === "" ? undefined : Number(minRaw);
        const max = maxRaw === "" ? undefined : Number(maxRaw);

        const spec: BlankTypedSpec = {
        type: "range",
        min: Number.isFinite(min as number) ? (min as number) : undefined,
        max: Number.isFinite(max as number) ? (max as number) : undefined,
        };
        return spec;
    }

        if (cType === "num_oneOf") {
        const nums = parseOneOfNums(meta.allowedRaw || "");
        if (!nums.length) return { type: "number" };
        const spec: BlankTypedSpec = { type: "number", oneOf: nums };
        return spec;
        }

        if (cType === "str_oneOf") {
        const strs = parseOneOfStrs(meta.allowedRaw || "");
        if (!strs.length) return { type: "string" };
        const spec: BlankTypedSpec = { type: "string", oneOf: strs };
        return spec;
        }


    if (cType === "id_bound" || explicitBind) {
        const bindKey = explicitBind || "boundVar";
        const spec: BlankTypedSpec = { type: "identifier", bindAs: bindKey };
        return spec;
    }

    // expr_ref fallback: use your reference-based generator
    // (this supports expressions, function calls, etc.)
    return generateKeyFromReference(ans, { bind: bindings });
    }

    

    function onTestKey() {
  if (!selectedBlankId) {
    setTestResult({ ok: false, message: "No blank selected." });
    return;
  }

  const meta = getBlankMeta(storeRef.current, selectedBlankId);
  if (!meta) {
    setTestResult({ ok: false, message: `No meta found for blank ${selectedBlankId}.` });
    return;
  }

  const bindings = buildBindingsFromActiveRegistry(pid);
  const spec = buildAnswerSpecForBlank(meta, bindings);

  // This object is used for identifier bindings (bindAs).
  const allValues: Record<string, string> = {};

  const res = evalAnswerSpec(spec, testValue, allValues);

  setTestResult({
    ok: res === true,
    message: res === true ? "✅ Pass" : `❌ Fail: Does not match constraint`,
    bound: Object.keys(allValues).length ? allValues : undefined,
  });
}




  function renumberByAppearance() {
    const curTemplate = templateRef.current;
    const idsInOrder = extractBlanksInOrder(curTemplate);
    const uniqIds = unique(idsInOrder);

    const mapping: Record<string, string> = {};
    let nextNum = 1;
    for (const oldId of uniqIds) mapping[oldId] = String(nextNum++);

    const anyChange = Object.entries(mapping).some(([a, b]) => a !== b);
    if (!anyChange) return;

    pushUndoSnapshot(selectedRef.current);

    // rewrite placeholders
    let nextTemplate = curTemplate;
    for (const [oldId, newId] of Object.entries(mapping)) {
      const oldPh = `__BLANK[${oldId}]__`;
      const newPh = `__BLANK[${newId}]__`;
      nextTemplate = nextTemplate.split(oldPh).join(newPh);
    }
    setTemplate(nextTemplate);

    // remap display ids while keeping UIDs stable
    setStore((prev) => {
      const nextUidByDisplay: Record<string, BlankUID> = {};
      for (const [oldId, uid] of Object.entries(prev.uidByDisplay || {})) {
        const newId = mapping[oldId] || oldId;
        nextUidByDisplay[newId] = uid;
      }
      return { ...prev, uidByDisplay: nextUidByDisplay };
    });

    setCounter(nextAvailableCounter(nextTemplate, nextNum));
    setSelectedBlankId(selectedRef.current ? mapping[selectedRef.current] || selectedRef.current : null);
  }

  // ------------ Blanks list ------------

const blanksInOrder = React.useMemo(() => {
  const ids = extractBlanksInOrder(template);
  const uniqIds = unique(ids);

  // sort by numeric blank id (1,2,3,...,10,11...)
  const sortedIds = [...uniqIds].sort((a, b) => Number(a) - Number(b));

  return sortedIds.map((id) => {
    const answer = getBlankMeta(store, id)?.answer ?? "";
    const preview = String(answer).replace(/\s+/g, " ").trim();
    return {
      id,
      preview: preview.length > 60 ? preview.slice(0, 60) + "…" : preview,
      // keep count based on occurrences in the template
      count: ids.filter((x) => x === id).length,
    };
  });
}, [template, store]);

const filteredBlanksInOrder = React.useMemo(() => {
  const q = blankSearch.trim().toLowerCase();
  if (!q) return blanksInOrder;

  return blanksInOrder.filter((b) => {
    const id = String(b.id ?? "");
    const placeholder = `__BLANK[${id}]__`.toLowerCase();

    const meta = getBlankMeta(store, id);
    const ans = String(meta?.answer ?? "").toLowerCase();

    // match id, placeholder, or answer contents
    return (
      id.toLowerCase().includes(q) ||
      placeholder.includes(q) ||
      ans.includes(q)
    );
  });
}, [blankSearch, blanksInOrder, store]);



  // ------------ Clickable overlay ------------

  const overlayHtml = React.useMemo(() => {
    const html = escapeHtml(template).replace(/__BLANK\[(\d+)\]__/g, (_m, id) => {
      const active = selectedBlankId === String(id);
      const cls = active ? "bg-indigo-200 ring-2 ring-indigo-400" : "bg-yellow-100 hover:bg-yellow-200";
      return `<span data-blank-id="${id}" class="cursor-pointer rounded px-1 ${cls}">__BLANK[${id}]__</span>`;
    });
    return html;
  }, [template, selectedBlankId]);

  function onOverlayClick(e: React.MouseEvent<HTMLPreElement>) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const id = target.getAttribute("data-blank-id");
    if (!id) return;

    // FIX: toggle inspector on click
    const did = String(id);
    openInspectorToggle(did);

    // also select it in textarea
    const ph = `__BLANK[${did}]__`;
    const idx = templateRef.current.indexOf(ph);
    if (idx >= 0) {
      const ta = templateTextareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(idx, idx + ph.length);
      }
    }
  }

  function syncOverlayScroll() {
    const ta = templateTextareaRef.current;
    const ov = overlayRef.current;
    if (!ta || !ov) return;
    ov.scrollTop = ta.scrollTop;
    ov.scrollLeft = ta.scrollLeft;
  }

  const selectedAnswer = selectedBlankId ? getAnswerByDisplay(selectedBlankId) : "";
  const selectedPlaceholder = selectedBlankId ? `BLANK[${selectedBlankId}]` : "";

  // Also show stable UID in inspector (hidden by default)
  const selectedUid = selectedBlankId ? resolveBlankUid(store, selectedBlankId) : null;
  const selectedMeta = selectedBlankId ? getBlankMeta(store, selectedBlankId) : null;


  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {flushAllNow(); 
              window.history.back();
            }}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Create Blanks</h1>

          <button
            type="button"
            onClick={undo}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-100"
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={redo}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-100"
            title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
          >
            Redo
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-100"
            title="Save to local storage"
          >
            Save
          </button>

        {saveStatus ? (
          <div className="text-xs opacity-70">{saveStatus}</div>
        ) : null}

        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={makeShareLink}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
            title="Copy a shareable link that includes the current project data"
          >
            Share link
          </button>

        </div>
      </div>

      {/* Toggle + instructions */}
      <div className="rounded-2xl bg-blue-50 border p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-blue-900">Blank creation mode</div>
            <div className="text-sm opacity-70">
              Turn this on, then drag-highlight code in the template and click “Make Blank”. Click any{" "}
              <span className="font-mono">__BLANK[...]__</span> to open/close the inspector.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateMode((v) => !v)}
              className={[
                "rounded-xl px-3 py-2 text-sm border hover:bg-indigo-200 transition-colors",
                createMode ? "bg-black text-white" : "",
              ].join(" ")}
            >
              {createMode ? "Create Blanks: ON" : "Create Blanks: OFF"}
            </button>

            <div className="text-sm opacity-70">
              Next blank #: <span className="font-mono">{nextAvailableCounter(template, counter)}</span>
            </div>
          </div>
        </div>

        {/* Selection bar */}
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            {sel ? (
              <>
                Selected:{" "}
                <span className="font-mono">
                  [{sel.start}..{sel.end}]
                </span>{" "}
                <span className="opacity-70">({sel.text.length} chars)</span>
              </>
            ) : (
              <span className="opacity-70">No selection.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!createMode || !sel}
              onClick={makeBlank}
              className={[
                "rounded-xl px-3 py-2 text-sm border transition-colors",
                createMode && sel
                  ? "bg-blue-900 text-white border-blue-900 hover:bg-blue-800"
                  : "border-blue-900 text-blue-900 opacity-70 hover:bg-blue-50",
              ].join(" ")}
            >
              Make Blank
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(template)}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-indigo-200"
            >
              Copy template
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(solved)}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-indigo-200"
            >
              Copy solved
            </button>
          </div>
        </div>
      </div>

      {/* Main layout: editors + blanks list + inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Editors */}
        <div className="xl:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="rounded-2xl bg-red-50 border p-4 lg:col-span-6">
              <div className="font-medium mb-2">Solved code (reference)</div>
              <div className="text-sm opacity-70 mb-2">This stays as your ground truth.</div>
              <AutoGrowTextarea
                value={solved}
                onChange={(e) => setSolved(e.target.value)}
                className="w-full rounded-xl border p-3 bg-neutral-50 font-mono text-sm max-h-[70vh] overflow-auto"
                placeholder="Paste full project code here (solved/reference)"
                spellCheck={false}
              />
            </section>

            <section className="rounded-2xl bg-indigo-100 border p-4 lg:col-span-6">
              <div className="font-medium mb-2">Template code (Blank this out)</div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-sm opacity-70 mb-2">Create blanks here.</div>
                  <button
                    type="button"
                    onClick={makeBlank}
                    disabled={!createMode || !sel}
                    className={[
                      "rounded-xl border px-3 py-1 text-sm",
                      createMode && sel ? "bg-blue-900 text-white border-blue-900 hover:bg-blue-800"
                      : "border-blue-900 text-blue-900 opacity-70 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    Make Blank
                  </button>
                </div>

                    <AutoGrowTextarea
                    ref={templateTextareaRef}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    onMouseUp={(e) => captureSelectionFromTextarea(e.currentTarget)}
                    onKeyUp={(e) => captureSelectionFromTextarea(e.currentTarget)}
                    className="w-full bg-neutral-50 rounded-xl border p-3 font-mono text-sm max-h-[70vh] overflow-auto whitespace-pre-wrap break-words"
                    placeholder="Template code you will turn into blanks"
                    spellCheck={false}
                    />


              <div className="text-xs opacity-60 mt-2">
                Tip: text is transparent so the overlay can handle clicking blanks; caret remains visible.
              </div>
            </section>
          </div>

          {/* Debug / export: store */}
          {/* Notes */}
<section className="rounded-2xl border p-4 mt-4">
  <div className="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <div className="font-medium">Notes</div>
      <div className="text-sm opacity-70">
        Write your post-it notes here (autosaves).
      </div>
    </div>

    <button
      type="button"
      onClick={() => setNotes("")}
      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
      title="Clear notes"
      disabled={!notes}
    >
      Clear
    </button>
  </div>

  <textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    className="mt-3 w-full rounded-xl border p-3 bg-neutral-50 text-sm min-h-[180px] whitespace-pre-wrap"
    placeholder="Notes"
    spellCheck={false}
  />
</section>

<section className="rounded-2xl border p-4 mt-4">
  <div className="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <div className="font-medium">Blank answers (click to inspect)</div>
      <div className="text-sm opacity-70">
        Click an item to open/close the inspector.
      </div>
    </div>

    <div className="mt-3 flex gap-2 items-center">
      <input
        value={blankSearch}
        onChange={(e) => setBlankSearch(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
        placeholder='Search blanks… (e.g. "12", "__BLANK[12]__", or "digitalWrite")'
      />
      <button
        type="button"
        onClick={() => setBlankSearch("")}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
        disabled={!blankSearch.trim()}
        title="Clear search"
      >
        Clear
      </button>
    </div>

    <div className="text-xs opacity-60 mt-2">
      Showing {filteredBlanksInOrder.length} of {blanksInOrder.length}
    </div>


    <div className="flex items-center gap-2">
      <div className="text-sm opacity-70">
        {blanksInOrder.length} blanks
      </div>

      <button
        type="button"
        onClick={renumberByAppearance}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
        title="Renumber blanks in the order they appear in the template"
        disabled={blanksInOrder.length === 0}
      >
        Renumber
      </button>

      <button
        type="button"
        onClick={() => {
          const ids = unique(extractBlanksInOrder(templateRef.current));
          const lines = ids.map((id) => {
            const uid = resolveBlankUid(storeRef.current, id);
            const ans = getBlankMeta(storeRef.current, id)?.answer ?? "";
            const safe = ans.replace(/\n/g, "\\n");
            return `${id} : "${safe}"\n  uid: ${uid ?? "(none)"}`;
          });
          copyToClipboard(lines.join("\n\n"));
        }}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
      >
        Copy readable
      </button>
    </div>
  </div>

  {/* Scroll container */}
  <div
  className="mt-3 h-[420px] overflow-y-scroll pr-2 space-y-2 rounded-xl"
  style={{ scrollbarGutter: "stable" as any }}
>
    {filteredBlanksInOrder.map((b, idx) => {
  const uid = resolveBlankUid(store, b.id);
  const meta = getBlankMeta(store, b.id);
  const ans = meta?.answer ?? "";
  const keyExpr = meta?.generatedKeyExpr ?? "";
  const active = selectedBlankId === b.id;

  return (
    <button
      key={b.id}
      type="button"
      onClick={() => openInspectorToggle(b.id)}
      className={[
        "w-full text-left rounded-xl border px-3 py-2 hover:bg-gray-50",
        active ? "border-indigo-400 bg-indigo-50" : "",
      ].join(" ")}
      title="Click to open/close inspector"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm">__BLANK[{b.id}]__</div>
        <div className="text-xs opacity-60">#{idx + 1}</div>
      </div>

      <div className="text-xs opacity-70 mt-1">
        {b.preview ? b.preview : <span className="italic">no stored answer</span>}
        {b.count > 1 ? <span className="ml-2">(x{b.count})</span> : null}
      </div>

      <div className="text-xs opacity-60 mt-2">
        answer: <span className="font-mono">"{ans}"</span>
      </div>
      <div className="text-xs opacity-60 mt-1">
        uid: <span className="font-mono">{uid ?? "(none)"}</span>
      </div>

      {keyExpr ? (
        <div className="text-xs opacity-60 mt-1">
          key: <span className="font-mono">{keyExpr}</span>
        </div>
      ) : null}
    </button>
  );
})}

<div className="text-xs opacity-60 py-2 text-center">
  End of list — showing {blanksInOrder.length} blanks
</div>

  </div>
</section>


        </div>

        {/* Right rail: blanks list + inspector */}
        <div className="xl:col-span-3 space-y-4">
          {/* Blanks list */}

          {/* Inspector */}
          <section className="rounded-2xl border p-4 sticky top-4 self-start">
            <div className="font-medium">Blank Inspector</div>

            {!selectedBlankId ? (
              <div className="text-sm opacity-70 mt-2">
                Click a <span className="font-mono">__BLANK[...]__</span> in the template or choose one from the list.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-60">Blank #</div>
                  <div className="font-mono text-lg">{selectedBlankId}</div>
                  <div className="text-xs opacity-60 mt-2">Placeholder</div>
                  <div className="font-mono">{selectedPlaceholder}</div>

                  {/* keep internal ID mostly hidden */}
                  <details className="mt-2">
                    <summary className="text-xs opacity-70 cursor-pointer">Advanced</summary>
                    <div className="text-xs opacity-70 mt-2">
                      Internal UID: <span className="font-mono">{selectedUid ?? "(none)"}</span>
                    </div>
                  </details>
                </div>

                <div>
                  <div className="text-xs opacity-60">Stored answer text (editable)</div>
                <textarea
                value={answerDraft}
                onChange={(e) => {
                    const v = e.target.value;
                    setAnswerDraft(v);
                    scheduleCommitSelectedBlank({ answer: v });
                }}
                className="w-full rounded-xl border p-2 font-mono text-sm min-h-[80px]"
                placeholder="What this blank expands to"
                />

                </div>

                <div className="grid grid-cols-1 gap-2">
                <button
                    type="button"
                    onClick={() => removeBlank(selectedBlankId)}
                    className="rounded-xl border px-3 py-2 text-sm bg-red-200 hover:bg-red-300"
                >
                    Remove blank
                </button>
                </div>


<div className="rounded-xl border p-3 space-y-3">
  <div>
    <div className="text-xs opacity-60">Description (optional)</div>
    <textarea
      value={descDraft}
      onChange={(e) => {
        const v = e.target.value;
        setDescDraft(v);
        scheduleCommitSelectedBlank({ description: v });
      }}
      className="w-full rounded-xl border p-2 text-sm min-h-[60px]"
      placeholder="e.g., This is the variable used to index the array"
    />
  </div>
    <div>
    <div className="text-xs opacity-60">Bind key (optional)</div>
    <input
      value={bindDraft}
      onChange={(e) => {
        const v = e.target.value;
        setBindDraft(v);
        scheduleCommitSelectedBlank({ bindKey: v });
      }}
      className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
      placeholder="e.g., counterVar"
    />
  </div>

  <div>
    <div>
  <div className="text-xs opacity-60">Constraint type</div>
  <select
    value={constraintDraft}
    onChange={(e) => {
      const v = e.target.value as ConstraintType;
      setConstraintDraft(v);

      // helpful defaults
      if (v === "expr_ref") {
        // keep whatever
      } else if (v === "num_oneOf" || v === "str_oneOf") {
        // keep allowedDraft
      } else if (v === "num_range") {
        // keep min/max
      }

      scheduleCommitSelectedBlank({ constraintType: v });
    }}
    className="w-full rounded-xl border px-2 py-2 text-sm"
  >
    <option value="num_any">Number (any)</option>
    <option value="num_range">Number (range)</option>
    <option value="num_oneOf">Number (one of…)</option>
    <option value="id_bound">Identifier (bound)</option>
    <option value="str_oneOf">String (one of…)</option>
    <option value="expr_ref">Expr (reference-based) (fallback)</option>
    <option value="pat_array_empty">Pattern: identifier[]</option>
    <option value="pat_array_index">Pattern: identifier[ i | 3 ]</option>
    <option value="pattern_custom">Pattern (custom builder)</option>
    <option value="same_as">Same as… (K.same)</option>


  </select>

{constraintDraft === "num_oneOf" || constraintDraft === "str_oneOf" ? (
    <div className="mt-2">
      <div className="text-xs opacity-60">Allowed values (comma-separated)</div>
      <input
        value={allowedDraft}
        onChange={(e) => {
          const v = e.target.value;
          setAllowedDraft(v);
          scheduleCommitSelectedBlank({ allowedRaw: v });
        }}
        className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
        placeholder={constraintDraft === "num_oneOf" ? "e.g., 64, 32" : 'e.g., "HIGH", "LOW"'}
      />
    </div>
  ) : null}

  {constraintDraft === "str_oneOf" ? (
  <div className="mt-2">
    <div className="text-xs opacity-60">Require quotes?</div>
    <select
      value={requireQuotedDraft}
      onChange={(e) => {
        const v = e.target.value as "no" | "yes";
        setRequireQuotedDraft(v);
        scheduleCommitSelectedBlank({ requireQuoted: v === "yes" } as any);
      }}
      className="w-full rounded-xl border px-2 py-2 text-sm"
    >
      <option value="no">No (default)</option>
      <option value="yes">Yes (must type &quot;...&quot; or '...')</option>
    </select>

    <div className="text-xs opacity-60 mt-1">
      If “Yes”, students must include quotes in their answer.
    </div>
  </div>
) : null}


  {constraintDraft === "num_range" ? (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <div>
        <div className="text-xs opacity-60">Min</div>
        <input
          value={minDraft}
          onChange={(e) => {
            const v = e.target.value;
            setMinDraft(v);
            scheduleCommitSelectedBlank({ rangeMinRaw: v });
          }}
          className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
          placeholder="e.g., 0"
        />
      </div>
      <div>
        <div className="text-xs opacity-60">Max</div>
        <input
          value={maxDraft}
          onChange={(e) => {
            const v = e.target.value;
            setMaxDraft(v);
            scheduleCommitSelectedBlank({ rangeMaxRaw: v });
          }}
          className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
          placeholder="e.g., 255"
        />
      </div>
    </div>
  ) : null}

  {constraintDraft === "id_bound" ? (
    <div className="mt-2 text-xs opacity-70">
      Uses <span className="font-mono">Bind key</span> below (required).
    </div>
  ) : null}

  {constraintDraft === "same_as" ? (
  <div className="mt-2">
    <div className="text-xs opacity-60">Same as (target key)</div>
    <input
      value={sameAsTargetDraft}
      onChange={(e) => {
        const v = e.target.value;
        setSameAsTargetDraft(v);
        scheduleCommitSelectedBlank({ sameAsTarget: v } as any);
      }}
      className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
      placeholder='e.g., "A" or "statusList"'
    />
    <div className="text-xs opacity-60 mt-1">
      Must match the value bound under this key during checking.
    </div>
  </div>
) : null}


  {constraintDraft === "pattern_custom" ? (
  <div className="mt-3 rounded-xl border p-3 space-y-2">
    <div className="flex items-center justify-between">
      <div className="text-xs opacity-70">Pattern builder</div>

      <div className="flex items-center gap-2">
        <select
          value={patternModeDraft}
          onChange={(e) => {
            const v = e.target.value as "exact" | "contains";
            setPatternModeDraft(v);
          }}
          className="rounded-lg border px-2 py-1 text-xs"
        >
          <option value="exact">Exact</option>
          <option value="contains">Contains</option>
        </select>
      </div>
    </div>

    {patternRowsDraft.map((row, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <select
          value={row.kind}
          onChange={(e) => {
            const kind = e.target.value as PatternRow["kind"];
            setPatternRowsDraft((prev) => {
              const next = [...prev];
              if (kind === "literal") next[idx] = { kind: "literal", text: "" };
              else if (kind === "sameAs") next[idx] = { kind: "sameAs", target: "" };
              else if (kind === "oneOf") next[idx] = { kind: "oneOf", valuesRaw: "" };
              else if (kind === "wildcard") next[idx] = { kind: "wildcard", min: "", max: "" };
              else {
                const prevRow: any = next[idx];
                const keepBind = prevRow?.bindAs ?? "";
                next[idx] = { kind, bindAs: keepBind } as any;
                }
              return next;
            });
          }}
          className="rounded-lg border px-2 py-1 text-xs"
        >
          <option value="literal">Literal</option>
          <option value="identifier">p(identifier)</option>
          <option value="string">p(string)</option>
          <option value="number">p(number)</option>
          <option value="sameAs">p(sameAs)</option>
          <option value="oneOf">p(oneOf)</option>
          <option value="wildcard">p(wildcard)</option>
        </select>

        {row.kind === "literal" ? (
          <input
            value={row.text}
            onChange={(e) => {
              const v = e.target.value;
              setPatternRowsDraft((prev) => {
                const next = [...prev];
                next[idx] = { kind: "literal", text: v };
                return next;
              });
            }}
            className="flex-1 rounded-lg border px-2 py-1 font-mono text-xs"
            placeholder='e.g. ".", "println", "(", ")"'
          />
        ) : null}

        {row.kind === "sameAs" ? (
          <input
            value={row.target}
            onChange={(e) => {
              const v = e.target.value;
              setPatternRowsDraft((prev) => {
                const next = [...prev];
                next[idx] = { kind: "sameAs", target: v };
                return next;
              });
            }}
            className="flex-1 rounded-lg border px-2 py-1 font-mono text-xs"
            placeholder="target key (e.g. A)"
          />
        ) : null}

        {row.kind === "oneOf" ? (
          <input
            value={row.valuesRaw}
            onChange={(e) => {
              const v = e.target.value;
              setPatternRowsDraft((prev) => {
                const next = [...prev];
                next[idx] = { kind: "oneOf", valuesRaw: v };
                return next;
              });
            }}
            className="flex-1 rounded-lg border px-2 py-1 font-mono text-xs"
            placeholder='e.g. println, print'
          />
        ) : null}

        {row.kind === "wildcard" ? (
          <div className="flex items-center gap-2">
            <input
              value={row.min ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setPatternRowsDraft((prev) => {
                  const next = [...prev];
                  next[idx] = { ...row, min: v };
                  return next;
                });
              }}
              className="w-16 rounded-lg border px-2 py-1 font-mono text-xs"
              placeholder="min"
            />
            <input
              value={row.max ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setPatternRowsDraft((prev) => {
                  const next = [...prev];
                  next[idx] = { ...row, max: v };
                  return next;
                });
              }}
              className="w-16 rounded-lg border px-2 py-1 font-mono text-xs"
              placeholder="max"
            />
          </div>
        ) : null}

        {(row.kind === "identifier" || row.kind === "string" || row.kind === "number") ? (
            <input
                value={(row as any).bindAs ?? ""}
                onChange={(e) => {
                const v = e.target.value;
                setPatternRowsDraft((prev) => {
                    const next = [...prev];
                    next[idx] = { ...(next[idx] as any), bindAs: v };
                    return next;
                });
                }}
                className="w-28 rounded-lg border px-2 py-1 font-mono text-xs"
                placeholder="bindAs"
                title='Optional: bind token value (e.g. "arrVar")'
            />
            ) : null}


        <button
          type="button"
          onClick={() => setPatternRowsDraft((prev) => prev.filter((_r, j) => j !== idx))}
          className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
    ))}

    <div className="flex items-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => setPatternRowsDraft((prev) => [...prev, { kind: "literal", text: "" }])}
        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-100"
      >
        + Add part
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => commitPatternToSelectedBlank()}
        className="rounded-lg border px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300"
      >
        Save pattern
      </button>
    </div>

    <div className="pt-2">
      <div className="text-xs opacity-60">No-spaces-around ops (comma-separated)</div>
      <input
        value={patternNoSpaceOpsDraft}
        onChange={(e) => setPatternNoSpaceOpsDraft(e.target.value)}
        className="w-full rounded-lg border px-2 py-1 font-mono text-xs"
        placeholder="e.g. . , ::"
      />
    </div>

    <details className="pt-2">
      <summary className="text-xs opacity-70 cursor-pointer">Preview spec</summary>
      <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">
        {JSON.stringify(buildPatternSpecFromDraft(), null, 2)}
      </pre>
    </details>
  </div>
) : null}

</div>

    <div className="flex items-center justify-between py-2 gap-2">
      <div className="text-xs opacity-60">Generated answerKey</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGenerateAnswerKey}
          className="rounded-xl border px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300"
          disabled={!selectedBlankId}
          title="Generates a paste-ready answerKey snippet"
        >
          Generate
        </button>

        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(answerKeySnippet).catch(() => {})}
          className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-100"
          disabled={!answerKeySnippet}
          title="Copy generated snippet"
        >
          Copy
        </button>
      </div>
    </div>

    <textarea
      value={answerKeySnippet}
      onChange={(e) => setAnswerKeySnippet(e.target.value)}
      className="mt-0 w-full rounded-xl border p-2 font-mono text-xs min-h-[140px]"
      placeholder="Click Generate to create the snippet. This will persist after refresh."
      spellCheck={false}
    />

    {answerKeyReport ? (
      <details className="mt-2">
        <summary className="text-xs opacity-70 cursor-pointer">Report</summary>
        <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">{answerKeyReport}</pre>
      </details>
    ) : null}
  </div>
  <div className="font-medium text-xs">Test key (selected blank only)</div>
  <div>
    <div className="text-xs opacity-60">Try an input</div>
    <input
      value={testValue}
      onChange={(e) => setTestValue(e.target.value)}
      className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
      placeholder={
          constraintDraft === "pat_array_empty"
            ? "e.g., myArr[]"
            : constraintDraft === "pat_array_index"
            ? "e.g., myArr[i] or myArr[3]"
        :constraintDraft === "num_oneOf"
          ? "e.g., 64"
          : constraintDraft === "num_range"
          ? "e.g., 128"
          : constraintDraft === "str_oneOf"
          ? 'e.g., "HIGH"'
          : constraintDraft === "id_bound"
          ? "e.g., counter"
          : "e.g., 64"
          

      }
    />
  </div>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onTestKey}
      className="rounded-xl border px-2 py-1 text-xs bg-green-200 hover:bg-green-300"
      disabled={!selectedBlankId}
    >
      Test key
    </button>

    <button
      type="button"
      onClick={() => setTestResult(null)}
      className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-100"
    >
      Clear
    </button>
  </div>

  {testResult ? (
    <div className="text-sm">
      <div className={testResult.ok ? "text-green-700" : "text-red-700"}>{testResult.message}</div>

      {testResult.bound ? (
        <details className="mt-2">
          <summary className="text-xs opacity-70 cursor-pointer">Bindings</summary>
          <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">
            {JSON.stringify(testResult.bound, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  ) : (
    <div className="text-xs opacity-70">
      Tests the selected blank’s constraint (range/oneOf/identifier binding/expr_ref).
    </div>
  )}
</div>

                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-60 mb-2">Rename blank #</div>
                  <RenameRow currentId={selectedBlankId} onRename={(newId) => renameBlank(selectedBlankId, newId)} />
                  <div className="text-xs opacity-60 mt-2">
                    Renaming updates the placeholder number, but keeps the internal UID stable.
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedBlankId(null)}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Close
                  </button>

                    <button
                    type="button"
                    onClick={() => {
                        if (!selectedBlankId) return;

                        pushUndoSnapshot(selectedBlankId);

                        setStore((prev) => {
                        const did = selectedBlankId;
                        const uid = prev.uidByDisplay?.[did];

                        const nextUidByDisplay = { ...(prev.uidByDisplay || {}) };
                        delete nextUidByDisplay[did];

                        const nextMetaByUid = { ...(prev.metaByUid || {}) };
                        if (uid) delete nextMetaByUid[uid];

                        return { uidByDisplay: nextUidByDisplay, metaByUid: nextMetaByUid };
                        });

                        setSelectedBlankId(null);
                    }}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
                    title="Keeps the placeholder but removes stored answer + UID mapping"
                    >
                    Delete blank record
                    </button>

                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RenameRow({ currentId, onRename }: { currentId: string; onRename: (newId: string) => void }) {
  const [v, setV] = React.useState(currentId);

  React.useEffect(() => {
    setV(currentId);
  }, [currentId]);

  return (
    <div className="flex items-center gap-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="w-full rounded-xl border px-2 py-2 font-mono text-sm"
        placeholder="e.g., 7"
      />
      <button type="button" onClick={() => onRename(v)} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100">
        Rename
      </button>
    </div>
  );
}
