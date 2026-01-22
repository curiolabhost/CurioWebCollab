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

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsGet(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}
function lsSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}
function lsGetJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = safeJsonParse<T>(window.localStorage.getItem(key));
  return (v ?? fallback) as T;
}
function lsSetJson(key: string, value: any) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
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
  | "expr_ref";

export type BlankMeta = {
  uid: BlankUID;
  answer: string;
  description?: string;
  bindKey?: string;
  // Option fields
  constraintType?: ConstraintType; // dropdown selection
  allowedRaw?: string;             // for oneOf: "64, 32" or for str: '"A","B"' or 'A,B'
  rangeMinRaw?: string;            // for range
  rangeMaxRaw?: string;            // for range
  createdAt: number;
  updatedAt: number;
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

function loadRegistryTables(): RegistryTable[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<RegistryTable[]>(window.localStorage.getItem(LS_TABLES_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

function loadRegistryActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_ACTIVE_ID_KEY);
}

function buildBindingsFromActiveRegistry(): Record<string, string> {
  const tables = loadRegistryTables();
  const activeId = loadRegistryActiveId();
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

export default function CreateBlanksPage() {

    const [answerKeySnippet, setAnswerKeySnippet] = React.useState("");
    const [answerKeyReport, setAnswerKeyReport] = React.useState("");
  const [createMode, setCreateMode] = React.useState(false);

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

  if (cType === "num_oneOf") {
    const nums = parseOneOfNums(c.allowedRaw || "");
    return nums.length ? `K.num({ oneOf: ${JSON.stringify(nums)} })` : `K.num()`;
  }

  if (cType === "str_oneOf") {
    const strs = parseOneOfStrs(c.allowedRaw || "");
    return strs.length ? `K.str({ oneOf: ${JSON.stringify(strs)} })` : `K.str()`;
  }

  if (cType === "id_bound") {
    // requires bindKey, but it's missing
    return `K.id()`;
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

  const bindings = buildBindingsFromActiveRegistry();

  const expr = emitSingleKeyExpr({
    blankId: id,
    answer,
    bindKey: meta?.bindKey,
    bindings,
    constraint: {
      constraintType: meta?.constraintType,
      allowedRaw: meta?.allowedRaw,
      rangeMinRaw: meta?.rangeMinRaw,
      rangeMaxRaw: meta?.rangeMaxRaw,
    },
  });

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

          },
        },
      };
    });
  }, 250);
}

  // keep latest state in refs so undo/redo + key handlers are stable
  const templateRef = React.useRef(template);
  const counterRef = React.useRef(counter);
  const storeRef = React.useRef(store);
  const selectedRef = React.useRef<string | null>(selectedBlankId);

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
    return;
  }

  const meta = getBlankMeta(store, selectedBlankId);

  setAnswerDraft(meta?.answer ?? "");
  setDescDraft(meta?.description ?? "");
  setBindDraft(meta?.bindKey ?? "");

  setConstraintDraft((meta?.constraintType as ConstraintType) ?? "expr_ref");
  setAllowedDraft(meta?.allowedRaw ?? "");
  setMinDraft(meta?.rangeMinRaw ?? "");
  setMaxDraft(meta?.rangeMaxRaw ?? "");
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
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
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

  // load from localStorage (with migration)
  React.useEffect(() => {
    const project = lsGet(LS_PROJECT_CODE);
    const storedSolved = lsGet(LS_SOLVED_CODE);
    const storedTemplate = lsGet(LS_TEMPLATE_CODE);

    const initialSolved = storedSolved || project || "";
    const initialTemplate = storedTemplate || initialSolved || "";

    setSolved(initialSolved);
    setTemplate(initialTemplate);

    // load new store
    const storedStore = lsGetJson<BlankStore>(LS_BLANK_STORE, { uidByDisplay: {}, metaByUid: {} });

    // migrate legacy answersMap if needed and if store looks empty
    const legacyAnswers = lsGetJson<Record<string, string>>(LS_ANSWERS_MAP, {});
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
      lsSetJson(LS_BLANK_STORE, nextStore);
    }

    setStore(nextStore);

    const storedCounter = Number(lsGet(LS_BLANK_COUNTER) || "1");
    const c = Number.isFinite(storedCounter) && storedCounter > 0 ? storedCounter : 1;
    setCounter(nextAvailableCounter(initialTemplate, c));
  }, []);

  // persist
  React.useEffect(() => {
    lsSet(LS_SOLVED_CODE, solved);
  }, [solved]);

  React.useEffect(() => {
    lsSet(LS_TEMPLATE_CODE, template);
  }, [template]);

  React.useEffect(() => {
    lsSet(LS_BLANK_COUNTER, String(counter));
  }, [counter]);

const persistTimerRef = React.useRef<number | null>(null);

React.useEffect(() => {
  if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
  persistTimerRef.current = window.setTimeout(() => {
    lsSetJson(LS_BLANK_STORE, store);
  }, 400);

  return () => {
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
  };
}, [store]);


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

    function buildAnswerSpecForBlank(meta: BlankMeta, bindings: Record<string, string>): AnswerSpec {
    const ans = String(meta.answer ?? "").trim();
    const cType = (meta.constraintType || "expr_ref") as ConstraintType;

    // If you explicitly bound this blank, treat it as identifier (bound)
    // regardless of other settings (you can remove this if you want strict behavior).
    const explicitBind = String(meta.bindKey ?? "").trim();

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

  const bindings = buildBindingsFromActiveRegistry();
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

    return uniqIds.map((id) => {
      const answer = getBlankMeta(store, id)?.answer ?? "";
      const preview = String(answer).replace(/\s+/g, " ").trim();
      return {
        id,
        preview: preview.length > 60 ? preview.slice(0, 60) + "…" : preview,
        count: ids.filter((x) => x === id).length,
      };
    });
  }, [template, store]);



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
            onClick={() => window.history.back()}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Create Blanks</h1>

          <button
            type="button"
            onClick={undo}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={redo}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
            title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
          >
            Redo
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/tools/answerkey-studio"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-blue-100"
            title="Return to AnswerKey Studio (template + solved will be there)"
          >
            Go to AnswerKey Studio →
          </Link>

          <button
            type="button"
            onClick={resetFromSolved}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toggle + instructions */}
      <div className="rounded-2xl border p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium">Blank creation mode</div>
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
                "rounded-xl px-3 py-2 text-sm border hover:bg-gray-100 transition-colors",
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
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
            >
              Copy template
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(solved)}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-100"
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
            <section className="rounded-2xl border p-4 lg:col-span-6">
              <div className="font-medium mb-2">Solved code (reference)</div>
              <div className="text-sm opacity-70 mb-2">This stays as your ground truth.</div>
              <AutoGrowTextarea
                value={solved}
                onChange={(e) => setSolved(e.target.value)}
                className="w-full rounded-xl border p-3 font-mono text-sm max-h-[70vh] overflow-auto"
                placeholder="Paste full project code here (solved/reference)"
              />
            </section>

            <section className="rounded-2xl border p-4 lg:col-span-6">
              <div className="font-medium mb-2">Template code (you blank this out)</div>
              <div className="text-sm opacity-70 mb-2">Highlight text to blank. Click existing blanks to edit/remove.</div>

                    <AutoGrowTextarea
                    ref={templateTextareaRef}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    onMouseUp={(e) => captureSelectionFromTextarea(e.currentTarget)}
                    onKeyUp={(e) => captureSelectionFromTextarea(e.currentTarget)}
                    className="w-full rounded-xl border p-3 font-mono text-sm max-h-[70vh] overflow-auto whitespace-pre-wrap break-words"
                    placeholder="Template code you will turn into blanks"
                    />


              <div className="text-xs opacity-60 mt-2">
                Tip: text is transparent so the overlay can handle clicking blanks; caret remains visible.
              </div>
            </section>
          </div>

          {/* Debug / export: store */}
<section className="rounded-2xl border p-4 mt-4">
  <div className="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <div className="font-medium">Blank answers (readable)</div>
      <div className="text-sm opacity-70">
        Format: <span className="font-mono">display# : "answer"</span> and the stable internal UID below it.
      </div>
    </div>

    <button
      type="button"
      onClick={() => {
        // copy a friendly export the way you want
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

  <div className="mt-3 space-y-3">
    {unique(extractBlanksInOrder(template)).length === 0 ? (
      <div className="text-sm opacity-70">No blanks yet.</div>
    ) : (
      unique(extractBlanksInOrder(template)).map((id) => {
        const uid = resolveBlankUid(store, id);
        const ans = getBlankMeta(store, id)?.answer ?? "";
        const keyExpr = getBlankMeta(store, id)?.generatedKeyExpr ?? "";

        return (
          <div key={id} className="rounded-xl border p-3">
            <div className="font-mono text-sm">
              {id} : <span className="opacity-80">"{ans}"</span>
            </div>
            <div className="text-xs opacity-60 mt-1">
              uid: <span className="font-mono">{uid ?? "(none)"}</span>
            </div>
              {keyExpr ? (
            <div className="text-xs opacity-60 mt-1">
                key: <span className="font-mono">{keyExpr}</span>
            </div>
            ) : null}
          </div>
        );
      })
    )}
  </div>
</section>

        </div>

        {/* Right rail: blanks list + inspector */}
        <div className="xl:col-span-3 space-y-4">
          {/* Blanks list */}
<section className="rounded-2xl border p-4">
  <div className="flex items-center justify-between gap-2">
    <div className="font-medium">Blanks list</div>

    <div className="flex items-center gap-2">
      <div className="text-sm opacity-70">{blanksInOrder.length} blanks</div>

      <button
        type="button"
        onClick={renumberByAppearance}
        className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-100"
        title="Renumber blanks in the order they appear in the template"
        disabled={blanksInOrder.length === 0}
      >
        Renumber
      </button>
    </div>
  </div>

  {blanksInOrder.length === 0 ? (
    <div className="text-sm opacity-70 mt-3">No blanks yet.</div>
  ) : (
    <div className="mt-3 space-y-2">
      {blanksInOrder.map((b, idx) => {
        const active = selectedBlankId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBlankId(b.id)} // or openInspectorToggle(b.id) if you want toggle behavior
            className={[
              "w-full text-left rounded-xl border px-3 py-2 hover:bg-gray-50",
              active ? "border-indigo-400 bg-indigo-50" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-sm">__BLANK[{b.id}]__</div>
              <div className="text-xs opacity-60">#{idx + 1}</div>
            </div>
            <div className="text-xs opacity-70 mt-1">
              {b.preview ? b.preview : <span className="italic">no stored answer</span>}
              {b.count > 1 ? <span className="ml-2">(x{b.count})</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  )}
</section>


          {/* Inspector */}
          <section className="rounded-2xl border p-4">
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
        constraintDraft === "num_oneOf"
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
