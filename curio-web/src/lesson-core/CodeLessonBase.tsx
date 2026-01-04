"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, ChevronRight, Check } from "lucide-react";

import SplitView from "./SplitView";
import ArduinoEditor from "./ArduinoEditor";
import CircuitEditor from "./CircuitEditor";
import GuidedCodeBlock from "./GuidedCodeBlock";
import styles from "./CodeLessonBase.module.css";

/* ============================================================
   Storage helpers
============================================================ */

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function storageGetJson<T>(key: string): T | null {
  if (!key) return null;
  if (typeof window === "undefined") return null;
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function storageSetJson(key: string, value: any) {
  if (!key) return;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function storageGetString(key: string): string | null {
  if (!key) return null;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSetString(key: string, value: string) {
  if (!key) return;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function defaultKeys(storagePrefix: string) {
  return {
    doneSetKey: `${storagePrefix}:doneSet`,
    overallProgressKey: `${storagePrefix}:overallProgress`, // optional
    globalBlanksKey: `${storagePrefix}:blanks:GLOBAL`,
    localBlanksPrefixKey: `${storagePrefix}:blanks:LOCAL`,
    navKey: `${storagePrefix}:nav`,
    sidebarKey: `${storagePrefix}:sidebarExpanded`,
    splitKey: `${storagePrefix}:split`,
  };
}

const INLINE_CHAR_W = 8.6; // match GuidedCodeBlock
function inlineWidthPx(len: number) {
  return Math.max(40, Math.max(1, len) * INLINE_CHAR_W);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function lessonNumbers(lessonSteps: Record<string, any>) {
  return Object.keys(lessonSteps || {})
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

function makeStepKey(lessonNumber: number, stepIdx: number) {
  return `L${lessonNumber}-S${stepIdx}`;
}

//for adding bullet points
function processDesc(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      // Existing @ bullet support (outside backticks)
      if (trimmed.startsWith("@")) {
        return "\u00A0\u00A0•\u00A0\u00A0" + trimmed.substring(1).trim();
      }

      return line;
    })
    .join("\n")
    .replace(/`([\s\S]*?)`/g, (match, inner) => {
      // Only process multiline backtick blocks
      if (!inner.includes("\n")) return match;

      const lines = inner.split("\n");

      const converted = lines.map((l: string) => {
        const t = l.trimStart();
        if (t.startsWith("- ") || t.startsWith("* ")) {
          return "\u00A0\u00A0•\u00A0\u00A0" + t.substring(2);
        }
        return l;
      });

      return "`" + converted.join("\n") + "`";
    });
}


function renderWithInlineCode(
  text: string | null | undefined,
  opts: {
    values: Record<string, any>;
    onChangeBlank: (name: string, value: string) => void;
    onBlurBlank?: (name: string) => void;
  }
) {
  if (!text) return null;

  const lines = String(text).split(/\n/);

  return lines.map((line, lineIdx) => {
    if (line === "") {
      return (
        <div key={`rtl-${lineIdx}`} className={styles.richTextLine}>
          <span className={styles.stepDescText}>&nbsp;</span>
        </div>
      );
    }

    const parts = line
      .split(/(__BLANK\[[A-Z0-9_]+\]__|`[^`]+`|\*\*[^*]+\*\*)/g)
      .filter(Boolean);

    return (
      <div key={`rtl-${lineIdx}`} className={styles.richTextLine}>
        {parts.map((part, idx) => {
          const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
          if (blankMatch) {
            const name = blankMatch[1];
            const value = opts.values?.[name] ?? "";

            const v = String(value ?? "");
            const width = inlineWidthPx(v.length) + 18;

            return (
              <input
                key={`blank-${lineIdx}-${idx}`}
                value={v}
                onChange={(e) => opts.onChangeBlank(name, e.target.value)}
                onBlur={() => opts.onBlurBlank?.(name)}
                className={styles.inlineBlankInput}
                style={{ width }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            );
          }

          if (part.startsWith("`") && part.endsWith("`")) {
            const code = part.slice(1, -1);

            if (code.startsWith("***") && code.endsWith("***")) {
              const strong = code.slice(3, -3);
              return (
                <span
                  key={`code-strong-${lineIdx}-${idx}`}
                  className={styles.inlineCodeStrong}
                >
                  {strong}
                </span>
              );
            }

            return (
              <span key={`code-${lineIdx}-${idx}`} className={styles.inlineCode}>
                {code}
              </span>
            );
          }

          if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return (
              <span key={`bold-${lineIdx}-${idx}`} className={styles.boldGeneral}>
                {boldText}
              </span>
            );
          }

          return (
            <span key={`txt-${lineIdx}-${idx}`} className={styles.stepDescText}>
              {part}
            </span>
          );
        })}
      </div>
    );
  });
}

/* ============================================================
   View mode wiring
============================================================ */

type ViewMode = "lesson" | "code" | "circuit";
const VIEW_MODE_EVENT = "curio:viewMode";

function coerceViewMode(raw: string | null): ViewMode {
  if (raw === "code" || raw === "circuit" || raw === "lesson") return raw;
  return "lesson";
}

/* ============================================================
   Main
============================================================ */

function parseCurioPtr(storagePrefix: string): { slug: string; lessonSlug: string } | null {
  // expects: curio:<slug>:<lessonSlug>
  if (!storagePrefix) return null;
  const parts = storagePrefix.split(":");
  if (parts.length < 3) return null;
  if (parts[0] !== "curio") return null;
  const slug = parts[1];
  const lessonSlug = parts.slice(2).join(":");
  if (!slug || !lessonSlug) return null;
  return { slug, lessonSlug };
}

function siblingLessonSlug(current: string, want: "coding" | "circuits") {
  // expects slugs like: code-beg, code-int, code-adv, circuit-beg, circuit-int, circuit-adv
  const m = String(current).match(/^(code|circuit)-(.+)$/);
  if (!m) return null;

  const level = m[2]; // beg/int/adv/whatever after dash
  return want === "coding" ? `code-${level}` : `circuit-${level}`;
}

function hasAnySteps(obj: any) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).length > 0;
}

function isLessonEntryAdvanced(entry: any) {
  return !!entry?.advanced;
}

function isLessonEntryIntermediate(entry: any) { 
  return !!entry?.intermediate;
}

function isLessonEntryOptional(entry: any) {
  return !!entry?.optional;
}

function isStepOptional(step: any) {
  return !!step?.optional;
}

function splitStepsForOptionalDropdown(stepsArr: any[]) {
  const optIdxs = (stepsArr || [])
    .map((st, idx) => (isStepOptional(st) ? idx : -1))
    .filter((idx) => idx >= 0);

  const hasOptional = optIdxs.length > 0;
  if (!hasOptional) {
    return {
      hasOptional: false,
      before: stepsArr.map((st, idx) => ({ st, idx })),
      optionalBlock: [],
      after: [],
      firstOpt: -1,
      lastOpt: -1,
    };
  }

  const firstOpt = Math.min(...optIdxs);
  const lastOpt = Math.max(...optIdxs);

  const before = stepsArr
    .map((st, idx) => ({ st, idx }))
    .filter(({ idx }) => idx < firstOpt);

  const optionalBlock = stepsArr
    .map((st, idx) => ({ st, idx }))
    .filter(({ idx, st }) => idx >= firstOpt && idx <= lastOpt && isStepOptional(st));

  const after = stepsArr
    .map((st, idx) => ({ st, idx }))
    .filter(({ idx }) => idx > lastOpt);

  return { hasOptional: true, before, optionalBlock, after, firstOpt, lastOpt };
}


function countCountedStepsForLesson(getEntry: (n: number) => any, getSteps: (n: number) => any[], lessonNum: number) {
  const entry = getEntry(lessonNum);
  if (isLessonEntryOptional(entry)) return 0; // optional lesson excluded
  const arr = getSteps(lessonNum);
  let c = 0;
  for (let i = 0; i < arr.length; i++) {
    if (isStepOptional(arr[i])) continue; // optional step excluded
    c++;
  }
  return c;
}

function isCountedStep(getEntry: (n: number) => any, getSteps: (n: number) => any[], lessonNum: number, stepIdx: number) {
  const entry = getEntry(lessonNum);
  if (isLessonEntryOptional(entry)) return false;
  const arr = getSteps(lessonNum);
  const st = arr?.[stepIdx];
  if (!st) return false;
  return !isStepOptional(st);
}



export default function CodeLessonBase({
  lessonSteps = {},
  circuitLessonSteps = {}, // optional “single-page track switch” mode
  storagePrefix = "lesson",

  doneSetKey,
  overallProgressKey,
  globalBlanksKey,
  localBlanksPrefixKey,

  analyticsTag = "lesson",
  apiBaseUrl = "http://localhost:4000",

  backRoute = "",

  codingLessonSlug = "code-beg",
  circuitsLessonSlug = "circuit-beg",
}: any) {
  const router = useRouter();

  /* ============================================================
     Coding | Circuits toggle
  ============================================================ */

  type LessonType = "coding" | "circuits";
  const LESSON_TYPE_KEY = `${storagePrefix}:lessonType`;

  // “Single-page track switch” only makes sense if BOTH tracks exist as props
  const supportsInlineTracks = hasAnySteps(circuitLessonSteps);

  const [lessonType, setLessonType] = React.useState<LessonType>("coding");

  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    const raw = storageGetString(LESSON_TYPE_KEY);
    const next: LessonType = raw === "circuits" ? "circuits" : "coding";
    setLessonType(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportsInlineTracks, LESSON_TYPE_KEY]);

  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    storageSetString(LESSON_TYPE_KEY, lessonType);
  }, [supportsInlineTracks, LESSON_TYPE_KEY, lessonType]);

const onSelectCircuits = React.useCallback(() => {
  if (supportsInlineTracks) {
    setLessonType("circuits");
    return;
  }

  const ptr = parseCurioPtr(storagePrefix);
  if (!ptr) return;

  const target = siblingLessonSlug(ptr.lessonSlug, "circuits") ?? circuitsLessonSlug;
  if (ptr.lessonSlug === target) return;

  router.push(`/projects/${ptr.slug}/lessons/${target}`);
}, [supportsInlineTracks, storagePrefix, circuitsLessonSlug, router]);

const onSelectCoding = React.useCallback(() => {
  if (supportsInlineTracks) {
    setLessonType("coding");
    return;
  }

  const ptr = parseCurioPtr(storagePrefix);
  if (!ptr) return;

  const target = siblingLessonSlug(ptr.lessonSlug, "coding") ?? codingLessonSlug;
  if (ptr.lessonSlug === target) return;

  router.push(`/projects/${ptr.slug}/lessons/${target}`);
}, [supportsInlineTracks, storagePrefix, codingLessonSlug, router]);


  const trackPrefix = React.useMemo(() => {
    if (!supportsInlineTracks) return storagePrefix;
    return `${storagePrefix}:${lessonType}`;
  }, [supportsInlineTracks, storagePrefix, lessonType]);

  const activeLessonSteps = React.useMemo(() => {
    if (!supportsInlineTracks) return lessonSteps || {};
    return lessonType === "circuits" ? circuitLessonSteps || {} : lessonSteps || {};
  }, [supportsInlineTracks, lessonType, lessonSteps, circuitLessonSteps]);

  const getLessonEntry = React.useCallback(
    (lessonNum: number) => (activeLessonSteps as any)?.[lessonNum],
    [activeLessonSteps]
  );

  const getLessonStepsArray = React.useCallback(
    (lessonNum: number) => {
      const entry = (activeLessonSteps as any)?.[lessonNum];
      if (!entry) return [];

      if (Array.isArray(entry)) return entry; // legacy support
      if (Array.isArray(entry.steps)) return entry.steps;

      return [];
    },
    [activeLessonSteps]
  );

  const getLessonPhrase = React.useCallback(
    (lessonNum: number) => {
      const entry = (activeLessonSteps as any)?.[lessonNum];
      return typeof entry?.phrase === "string" ? entry.phrase : "";
    },
    [activeLessonSteps]
  );

  const KEYS = React.useMemo(() => {
    const d = defaultKeys(trackPrefix);
    return {
      doneSetKey: doneSetKey || d.doneSetKey,
      overallProgressKey: overallProgressKey || d.overallProgressKey,
      globalBlanksKey: globalBlanksKey || d.globalBlanksKey,
      localBlanksPrefixKey: localBlanksPrefixKey || d.localBlanksPrefixKey,
      navKey: d.navKey,
      sidebarKey: d.sidebarKey,
      splitKey: d.splitKey,
      viewModeKey: `${trackPrefix}:viewMode`,
    };
  }, [trackPrefix, doneSetKey, overallProgressKey, globalBlanksKey, localBlanksPrefixKey]);

  // Tell dashboard which lesson is "currently active" (keep base storagePrefix)
  React.useEffect(() => {
    const ptr = parseCurioPtr(storagePrefix);
    if (!ptr) return;

    try {
      window.localStorage.setItem("curio:activeLesson", JSON.stringify(ptr));
      window.dispatchEvent(new Event("curio:activeLesson"));
    } catch {}
  }, [storagePrefix]);

  const EDITOR_KEYS = React.useMemo(() => {
    const prefix = trackPrefix || "lesson";
    return {
      arduinoSketchKey: `${prefix}:editor:arduino:sketch`,
      wokwiUrlKey: `${prefix}:editor:wokwi:url`,
      wokwiDiagramKey: `${prefix}:editor:wokwi:diagram`,
    };
  }, [trackPrefix]);

  const lessonsList = React.useMemo(() => lessonNumbers(activeLessonSteps), [activeLessonSteps]);

  const totalStepsAllLessons = React.useMemo(() => {
    let total = 0;
    for (const ln of lessonsList) total += countCountedStepsForLesson(getLessonEntry, getLessonStepsArray, ln);
    return total;
  }, [lessonsList, getLessonStepsArray]);

  const totalNormalStepsAllLessons = React.useMemo(() => {
    let total = 0;
    for (const ln of lessonsList) {
      const entry = getLessonEntry(ln);
      if (isLessonEntryAdvanced(entry)) continue;
      if (isLessonEntryOptional(entry)) continue;
      total += countCountedStepsForLesson(getLessonEntry, getLessonStepsArray, ln);
    }
    return total;
  }, [lessonsList, getLessonEntry, getLessonStepsArray]);

  const normalLessonNums = React.useMemo(
    () => lessonsList.filter((ln) => !isLessonEntryAdvanced(getLessonEntry(ln))),
    [lessonsList, getLessonEntry]
  );
  const advancedLessonNums = React.useMemo(
    () => lessonsList.filter((ln) => isLessonEntryAdvanced(getLessonEntry(ln))),
    [lessonsList, getLessonEntry]
  );

  const firstNormalLesson = normalLessonNums[0] ?? lessonsList[0] ?? 1;

  const [lesson, setLesson] = React.useState<number>(firstNormalLesson);
  const [stepIndex, setStepIndex] = React.useState<number>(0);

  // When inline-tracks toggle changes, reset navigation inside the page
  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    const fl = (normalLessonNums[0] ?? lessonsList[0]) ?? 1;
    setLesson(fl);
    setStepIndex(0);
    setExpandedLessons([fl]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportsInlineTracks, lessonType]);

  // after mount, load persisted nav (client only)
  React.useEffect(() => {
    const v = storageGetJson<{ lesson: number; stepIndex: number }>(KEYS.navKey);
    if (v && Number.isFinite(v.lesson) && Number.isFinite(v.stepIndex)) {
      setLesson(v.lesson);
      setStepIndex(v.stepIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEYS.navKey]);

  React.useEffect(() => {
    storageSetJson(KEYS.navKey, { lesson, stepIndex });
  }, [KEYS.navKey, lesson, stepIndex]);

  // Done set
  const [doneSet, setDoneSet] = React.useState<Set<string>>(() => new Set());
  const [doneSetLoaded, setDoneSetLoaded] = React.useState(false);

  const doneNormalCount = React.useMemo(() => {
    let n = 0;

    for (const ln of lessonsList) {
      const entry = getLessonEntry(ln);
      if (isLessonEntryAdvanced(entry)) continue;
      if (isLessonEntryOptional(entry)) continue;

      const arr = getLessonStepsArray(ln);
      arr.forEach((_:any, idx:number) => {
        if (!isCountedStep(getLessonEntry, getLessonStepsArray, ln, idx)) return;
        if (doneSet.has(makeStepKey(ln, idx))) n++;
      });
    }

    return n;
  }, [doneSet, lessonsList, getLessonEntry, getLessonStepsArray]);


  const advancedUnlocked =
    totalNormalStepsAllLessons > 0 && doneNormalCount >= totalNormalStepsAllLessons;

  React.useEffect(() => {
    const raw = storageGetJson<string[]>(KEYS.doneSetKey);
    if (Array.isArray(raw)) setDoneSet(new Set(raw));
    setDoneSetLoaded(true);
  }, [KEYS.doneSetKey]);

  React.useEffect(() => {
    if (!doneSetLoaded) return;
    storageSetJson(KEYS.doneSetKey, Array.from(doneSet));
  }, [KEYS.doneSetKey, doneSet, doneSetLoaded]);

  // Hydration-safe sidebar state:
  // - Server and first client render always assume "expanded = true"
  // - After mount, we read localStorage and update (no hydration mismatch)
  const [sidebarExpanded, setSidebarExpanded] = React.useState<boolean>(true);
  const [sidebarLoaded, setSidebarLoaded] = React.useState(false);

  React.useEffect(() => {
    const raw = storageGetJson<boolean>(KEYS.sidebarKey);
    setSidebarExpanded(raw == null ? true : !!raw);
    setSidebarLoaded(true);
  }, [KEYS.sidebarKey]);

  React.useEffect(() => {
    if (!sidebarLoaded) return;
    storageSetJson(KEYS.sidebarKey, sidebarExpanded);
  }, [KEYS.sidebarKey, sidebarExpanded, sidebarLoaded]);

  // View mode (scoped by trackPrefix)
  const readViewMode = React.useCallback((): ViewMode => {
    return coerceViewMode(storageGetString(KEYS.viewModeKey));
  }, [KEYS.viewModeKey]);

  const [viewMode, setViewMode] = React.useState<ViewMode>(() => readViewMode());

  React.useEffect(() => {
    const update = () => setViewMode(readViewMode());

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.viewModeKey) update();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(VIEW_MODE_EVENT, update as any);

    update();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VIEW_MODE_EVENT, update as any);
    };
  }, [KEYS.viewModeKey, readViewMode]);

  // If persisted nav points into an advanced lesson before unlock, snap to first normal lesson
  React.useEffect(() => {
    const entry = getLessonEntry(lesson);
    if (!advancedUnlocked && isLessonEntryAdvanced(entry)) {
      setLesson(firstNormalLesson);
      setStepIndex(0);
    }
  }, [lesson, firstNormalLesson, advancedUnlocked, getLessonEntry]);

  // Current step data
  const steps = getLessonStepsArray(lesson);
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;
  const step = steps[safeStepIndex];
  const entryThisLesson = getLessonEntry(lesson);
const isThisLessonOptional = isLessonEntryOptional(entryThisLesson);
const isCurrentStepOptional = !!step?.optional; // optional steps have optional:true in content


  // sidebar accordion expanded lessons
  const [expandedLessons, setExpandedLessons] = React.useState<number[]>([lesson]);
const [optionalExpandedByLesson, setOptionalExpandedByLesson] = React.useState<Record<number, boolean>>({});



  React.useEffect(() => {
    setExpandedLessons((prev) => (prev.includes(lesson) ? prev : [lesson, ...prev]));
  }, [lesson]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  function toggleOptionalSteps(lessonNum: number) {
  setOptionalExpandedByLesson((prev) => ({
    ...(prev || {}),
    [lessonNum]: !prev?.[lessonNum],
  }));
}


  /* ============================================================
     PROGRESS (UPDATED)
     - Before advancedUnlocked: % uses NORMAL lessons only (can hit 100%)
     - After advancedUnlocked: % uses ALL lessons (normal + advanced)
  ============================================================ */

  const totalStepsForProgress = advancedUnlocked ? totalStepsAllLessons : totalNormalStepsAllLessons;
  const doneCountAllCounted = React.useMemo(() => {
  let n = 0;
  for (const ln of lessonsList) {
    const entry = getLessonEntry(ln);

    // exclude optional lessons always
    if (isLessonEntryOptional(entry)) continue;

    // before unlock, exclude advanced required lessons (advanced + not optional)
    if (!advancedUnlocked && isLessonEntryAdvanced(entry) && !isLessonEntryOptional(entry)) continue;

    const arr = getLessonStepsArray(ln);
    for (let i = 0; i < arr.length; i++) {
      if (!isCountedStep(getLessonEntry, getLessonStepsArray, ln, i)) continue;
      if (doneSet.has(makeStepKey(ln, i))) n++;
    }
  }
  return n;
}, [doneSet, lessonsList, getLessonEntry, getLessonStepsArray, advancedUnlocked]);

const doneCountForProgress = advancedUnlocked ? doneCountAllCounted : doneNormalCount;


  const overallProgress =
    totalStepsForProgress > 0
      ? Math.round((doneCountForProgress / totalStepsForProgress) * 100)
      : 0;

  // Lesson progress
// Lesson progress (counted steps only — excludes optional lessons + optional steps)
const isThisLessonAdvanced = isLessonEntryAdvanced(entryThisLesson);
const lessonStepsCountAll = Array.isArray(steps) ? steps.length : 0;

const countedStepsInThisLesson = React.useMemo(() => {
  // Advanced required lessons are hidden from progress before unlock
  if (!advancedUnlocked && isThisLessonAdvanced && !isThisLessonOptional) return 0;

  // Optional lessons never count toward progress
  if (isThisLessonOptional) return 0;

  let total = 0;
  for (let i = 0; i < steps.length; i++) {
    if (!isCountedStep(getLessonEntry, getLessonStepsArray, lesson, i)) continue;
    total++;
  }
  return total;
}, [
  steps,
  lesson,
  advancedUnlocked,
  isThisLessonAdvanced,
  isThisLessonOptional,
  getLessonEntry,
  getLessonStepsArray,
]);

const doneInThisLessonForProgress = React.useMemo(() => {
  if (!advancedUnlocked && isThisLessonAdvanced && !isThisLessonOptional) return 0;
  if (isThisLessonOptional) return 0;

  let n = 0;
  for (let i = 0; i < steps.length; i++) {
    if (!isCountedStep(getLessonEntry, getLessonStepsArray, lesson, i)) continue;
    if (doneSet.has(makeStepKey(lesson, i))) n++;
  }
  return n;
}, [
  doneSet,
  steps,
  lesson,
  advancedUnlocked,
  isThisLessonAdvanced,
  isThisLessonOptional,
  getLessonEntry,
  getLessonStepsArray,
]);

const lessonProgress =
  countedStepsInThisLesson > 0
    ? Math.round((doneInThisLessonForProgress / countedStepsInThisLesson) * 100)
    : 0;


  React.useEffect(() => {
    if (!doneSetLoaded) return;

    // 1) Always persist THIS page’s effective total steps (matches progress)
    try {
      window.localStorage.setItem(
        `${trackPrefix}:totalStepsAllLessons`,
        JSON.stringify(totalStepsForProgress)
      );
    } catch {}

    // 2) Persist canonical totals (for dashboard combining Coding+Circuits)
    const ptr = parseCurioPtr(storagePrefix);
    if (ptr) {
      const codingPrefix = `curio:${ptr.slug}:${codingLessonSlug}`;
      const circuitsPrefix = `curio:${ptr.slug}:${circuitsLessonSlug}`;

      const isCodingPage = ptr.lessonSlug === codingLessonSlug;
      const isCircuitsPage = ptr.lessonSlug === circuitsLessonSlug;

      try {
        if (isCodingPage) {
          window.localStorage.setItem(
            `${codingPrefix}:totalStepsAllLessons`,
            JSON.stringify(totalStepsForProgress)
          );
        } else if (isCircuitsPage) {
          window.localStorage.setItem(
            `${circuitsPrefix}:totalStepsAllLessons`,
            JSON.stringify(totalStepsForProgress)
          );
        }

        const codingTotal =
          safeJsonParse<number>(
            window.localStorage.getItem(`${codingPrefix}:totalStepsAllLessons`)
          ) ?? 0;

        const circuitsTotal =
          safeJsonParse<number>(
            window.localStorage.getItem(`${circuitsPrefix}:totalStepsAllLessons`)
          ) ?? 0;

        window.localStorage.setItem(
          `curio:${ptr.slug}:totalStepsAllLessons:ALL`,
          JSON.stringify(codingTotal + circuitsTotal)
        );
      } catch {}
    }

    // 3) Persist overall percent for THIS page
    storageSetJson(KEYS.overallProgressKey, overallProgress);

    // 4) Notify dashboard
    try {
      window.dispatchEvent(new Event("curio:progress"));
    } catch {}
  }, [
    doneSetLoaded,
    trackPrefix,
    storagePrefix,
    codingLessonSlug,
    circuitsLessonSlug,
    totalStepsForProgress,
    overallProgress,
    KEYS.overallProgressKey,
  ]);

  // Mark done toggle for current step
  const currentStepKey = makeStepKey(lesson, safeStepIndex);
  const isDone = doneSet.has(currentStepKey);

  const markDone = () => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });
  };

  const unmarkDone = () => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.delete(currentStepKey);
      return next;
    });
  };

  // Step navigation (skip advanced lessons until unlocked)
function isLessonLocked(lessonNum: number) {
  const entry = getLessonEntry(lessonNum);
  const isAdvanced = isLessonEntryAdvanced(entry);
  const isOptional = isLessonEntryOptional(entry);

  // only lock advanced REQUIRED lessons
  return isAdvanced && !isOptional && !advancedUnlocked;
}

  const canPrev = safeStepIndex > 0 || lessonsList.indexOf(lesson) > 0;

  const canNext = (() => {
    // within current lesson
    if (safeStepIndex < lessonStepsCountAll - 1) return true;

    // next lessons
    const idx = lessonsList.indexOf(lesson);
    for (let i = idx + 1; i < lessonsList.length; i++) {
      const ln = lessonsList[i];
      if (!isLessonLocked(ln) && getLessonStepsArray(ln).length > 0) return true;
    }
    return false;
  })();

  const goPrev = () => {
    if (safeStepIndex > 0) {
      setStepIndex(safeStepIndex - 1);
      return;
    }
    const idx = lessonsList.indexOf(lesson);
    if (idx > 0) {
      // find previous unlocked lesson (including normal ones)
      for (let j = idx - 1; j >= 0; j--) {
        const prevLesson = lessonsList[j];
        if (isLessonLocked(prevLesson)) continue;
        const prevSteps = getLessonStepsArray(prevLesson);
        if (!prevSteps.length) continue;
        setLesson(prevLesson);
        setStepIndex(Math.max(0, prevSteps.length - 1));
        return;
      }
    }
  };

  const goNext = () => {
    // try next step in the same lesson
    if (safeStepIndex < lessonStepsCountAll - 1) {
      setStepIndex(safeStepIndex + 1);
      return;
    }

    // move to next unlocked lesson
    const idx = lessonsList.indexOf(lesson);
    if (idx >= 0 && idx < lessonsList.length - 1) {
      for (let j = idx + 1; j < lessonsList.length; j++) {
        const nextLesson = lessonsList[j];
        if (isLessonLocked(nextLesson)) continue;
        const nextSteps = getLessonStepsArray(nextLesson);
        if (!nextSteps.length) continue;
        setLesson(nextLesson);
        setStepIndex(0);
        return;
      }
    }
  };

  /* ============================================================
     GuidedCodeBlock shared state + persistence (per step)
  ============================================================ */

  const localStorageKeyForThisStep = `${KEYS.localBlanksPrefixKey}:${currentStepKey}`;
  const guidedUiKeyForThisStep = `${KEYS.localBlanksPrefixKey}:UI:${currentStepKey}`;

  const [localBlanks, setLocalBlanks] = React.useState<Record<string, any>>({});
  const [globalBlanks, setGlobalBlanks] = React.useState<Record<string, any>>({});

  const [blankStatus, setBlankStatus] = React.useState<Record<string, boolean>>({});
  const [activeBlankHint, setActiveBlankHint] = React.useState<any>(null);

  const [aiHelpByBlank, setAiHelpByBlank] = React.useState<Record<string, string>>({});
  const [aiLoadingKey, setAiLoadingKey] = React.useState<string | null>(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = React.useState<Record<string, number>>(
    {}
  );
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = React.useState<Record<string, number>>({});

  const [checkAttempts, setCheckAttempts] = React.useState<number>(0);
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(KEYS.globalBlanksKey);
    setGlobalBlanks(raw && typeof raw === "object" ? raw : {});
  }, [KEYS.globalBlanksKey]);

  React.useEffect(() => {
    storageSetJson(KEYS.globalBlanksKey, globalBlanks || {});
  }, [KEYS.globalBlanksKey, globalBlanks]);

  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(localStorageKeyForThisStep);
    setLocalBlanks(raw && typeof raw === "object" ? raw : {});

    const ui = storageGetJson<any>(guidedUiKeyForThisStep);

    setBlankStatus(ui?.blankStatus && typeof ui.blankStatus === "object" ? ui.blankStatus : {});
    setActiveBlankHint(ui?.activeBlankHint ?? null);
    setAiHelpByBlank(
      ui?.aiHelpByBlank && typeof ui.aiHelpByBlank === "object" ? ui.aiHelpByBlank : {}
    );
    setAiHintLevelByBlank(
      ui?.aiHintLevelByBlank && typeof ui.aiHintLevelByBlank === "object"
        ? ui.aiHintLevelByBlank
        : {}
    );
    setCheckAttempts(Number.isFinite(ui?.checkAttempts) ? ui.checkAttempts : 0);
    setBlankAttemptsByName(
      ui?.blankAttemptsByName && typeof ui.blankAttemptsByName === "object"
        ? ui.blankAttemptsByName
        : {}
    );

    setAiLoadingKey(null);
    setAiLastRequestAtByKey({});
  }, [localStorageKeyForThisStep, guidedUiKeyForThisStep]);

  React.useEffect(() => {
    storageSetJson(localStorageKeyForThisStep, localBlanks || {});
  }, [localStorageKeyForThisStep, localBlanks]);

  React.useEffect(() => {
    const payload = {
      blankStatus: blankStatus || {},
      activeBlankHint: activeBlankHint ?? null,
      aiHelpByBlank: aiHelpByBlank || {},
      aiHintLevelByBlank: aiHintLevelByBlank || {},
      checkAttempts: checkAttempts || 0,
      blankAttemptsByName: blankAttemptsByName || {},
    };

    const t = window.setTimeout(() => {
      storageSetJson(guidedUiKeyForThisStep, payload);
    }, 150);

    return () => window.clearTimeout(t);
  }, [
    guidedUiKeyForThisStep,
    blankStatus,
    activeBlankHint,
    aiHelpByBlank,
    aiHintLevelByBlank,
    checkAttempts,
    blankAttemptsByName,
  ]);

  const mergedBlanks = React.useMemo(
    () => ({ ...(globalBlanks || {}), ...(localBlanks || {}) }),
    [globalBlanks, localBlanks]
  );

  // PERFORMANCE: inline typing should not trigger parent-wide setState on every keypress
  const [inlineLocalValues, setInlineLocalValues] = React.useState<Record<string, any>>(() =>
    mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {}
  );
  const inlineLocalValuesRef = React.useRef(inlineLocalValues);
  inlineLocalValuesRef.current = inlineLocalValues;

React.useEffect(() => {
  const safeMerged = mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {};
  setInlineLocalValues((prev) => ({ ...(prev || {}), ...safeMerged }));
}, [mergedBlanks]);


  const inlineRafRef = React.useRef<number | null>(null);

  const scheduleInlineParentLocalUpdate = React.useCallback(
    (name: string, value: string) => {
      if (inlineRafRef.current) cancelAnimationFrame(inlineRafRef.current);
      inlineRafRef.current = requestAnimationFrame(() => {
        setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: value }));
      });
    },
    [setLocalBlanks]
  );

  const commitInlineToGlobal = React.useCallback(
    (name: string) => {
      const committed = String((inlineLocalValuesRef.current || {})[name] ?? "");
      setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: committed }));
    },
    [setGlobalBlanks]
  );

  const renderInline = React.useCallback(
    (text: string | null | undefined) => {
      if (!text) return null;

      return renderWithInlineCode(processDesc(String(text)), {
        values: inlineLocalValues,
        onChangeBlank: (name, txt) => {
          setInlineLocalValues((prev) => ({ ...(prev || {}), [name]: txt }));
          scheduleInlineParentLocalUpdate(name, txt);
        },
        onBlurBlank: (name) => {
          commitInlineToGlobal(name);
        },
      });
    },
    [inlineLocalValues, scheduleInlineParentLocalUpdate, commitInlineToGlobal]
  );

  const logBlankAnalytics = React.useCallback((_event: any) => {
    // no-op (wire later)
  }, []);


function renderCustomStep(step: any) {
  const Comp = step?.customComponent;
  if (!Comp) return null;

  // we pass embedded so the component doesn't try to be full-screen
  // and pass navigation hooks if we want the mind map to have buttons
  return (
    <div className="w-full">
      <Comp
        embedded
        onBack={goPrev}
        onContinue={goNext}
        // (optional) can pass the current project pointer too
        // ptr={parseCurioPtr(storagePrefix)}
      />
    </div>
  );
}


function renderImageGrid(grid: any, keyPrefix = "grid") {
  if (!grid || !Array.isArray(grid.items) || grid.items.length === 0) return null;

  const columns = Math.max(1, Number(grid.columns || 3));

  // Allow explicit sizing from lesson content
  const gridW = grid.width != null ? Number(grid.width) : null; // px
  const gridH = grid.height != null ? Number(grid.height) : null; // px

  // If any explicit size is provided, don't stretch tiles
  const useFixedSize = Number.isFinite(gridW) || Number.isFinite(gridH);

  // Responsive tile width when no fixed size is provided
  const widthPct = `${Math.floor(100 / columns)}%`;

  return (
    <div className={styles.imageGridWrap} key={keyPrefix}>
      <div className={styles.imageGrid}>
        {grid.items.map((it: any, idx: number) => {
          const isVideo = !!it?.video;

          // Support both { imageSrc } and { src/uri/url } and also string items
          const src =
            typeof it === "string"
              ? it
              : it?.imageSrc || it?.src || it?.uri || it?.url || "";

          const label = typeof it === "string" ? "" : String(it?.label ?? "");

          // Per-item overrides fall back to grid width/height
          const itemW = it?.width != null ? Number(it.width) : gridW;
          const itemH = it?.height != null ? Number(it.height) : gridH;

          const fixedW = Number.isFinite(itemW) ? itemW : null;
          const fixedH = Number.isFinite(itemH) ? itemH : null;

          const itemUsesFixed = !!(fixedW || fixedH);

          // defaults if only one dimension is provided (matches your old logic)
          const wrapW = itemUsesFixed ? (fixedW ?? 180) : undefined;
          const wrapH = itemUsesFixed ? (fixedH ?? 120) : undefined;

          return (
            <div
              key={`${keyPrefix}-item-${idx}`}
              className={styles.imageGridItem}
              style={{
                // If fixed sizing exists anywhere, use "auto" tile widths so they don't stretch
                width: useFixedSize ? "auto" : widthPct,
              }}
            >

            {!!label ? (
                <div className={styles.imageGridLabel}>{label}</div>
              ) : null}
              <div
                className={styles.imageGridImgWrap}
                style={
                  itemUsesFixed
                    ? {
                        width: wrapW,
                        height: wrapH,
                      }
                    : isVideo
                    ? {
                        aspectRatio: "16 / 9",
                      }
                    : undefined
                }
              >
                +                {/* renderMedia equivalent */}
                {isVideo ? (
                  (() => {
                    // support video as string or object: { src, controls, loop, muted, poster }
                    const videoSrc =
                      typeof it?.video === "string"
                       ? it.video
                     : it?.video?.src || it?.video?.uri || it?.video?.url || src;
                    const videoControls = it?.video?.controls ?? true;
                    const videoLoop = it?.video?.loop ?? false;
                    const videoMuted = it?.video?.muted ?? false;
                    const videoPoster = it?.video?.poster;

                    return (
                      <video
                        className={styles.imageGridVideo}
                      src={videoSrc}
                        controls={videoControls}
                          loop={videoLoop}
                        muted={videoMuted}
                        poster={videoPoster}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    );
                  })()
               ) : src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.imageGridImg}
                    src={src}
                    alt={label || `image-${idx}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      // IMPORTANT: in RN you disabled aspectRatio when fixed.
                      // On web, we simply let the wrapper control dimensions.
                    }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


  if (!lessonsList.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        No lesson steps found.
      </div>
    );
  }

  function renderStepButton(
  lessonNum: number,
  idx: number,
  st: any,
  locked: boolean,
  safeStepIndex: number
) {
  const isActive = lessonNum === lesson && idx === safeStepIndex;
  const stepKey = makeStepKey(lessonNum, idx);
  const isStepDone = doneSet.has(stepKey);

  const isOptional = isStepOptional(st);

  return (
    <button
      key={idx}
      type="button"
      disabled={locked}
      onClick={() => {
        if (locked) return;
        setLesson(lessonNum);
        setStepIndex(idx);
      }}
      className={[
        "w-full text-left text-sm py-1 px-3 rounded transition-colors",
        locked
          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
          : isActive
          ? "bg-indigo-100 text-indigo-700"
          : isStepDone
          ? "bg-transparent text-green-700 hover:bg-gray-100 hover:text-green-800"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <span className={`mr-2 text-s ${isOptional ? "text-gray-400" : "text-gray-600"}`}>
        {idx + 1}.
      </span>
      <span>
        {String(st.title).replace(/^(Step\s*)?\d+\s*:\s*/i, "")}
      </span>
    </button>
  );
}


  const lessonUi = (
    <div className="bg-white flex h-full">
      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-12 py-9">
          <h1 className="mb-2 text-s font-bold text-sky-600">
            {step?.lessonTitle ?? `Lesson ${lesson}`}
          </h1>
          <h2 className="mb-4 text-2xl font-bold text-sky-900">
            {step?.title ?? `Step ${safeStepIndex + 1}`}
          </h2>

          <div className="flex gap-12 items-end">
            <div className="flex-1 max-w-xs">
              <div className="text-sm text-gray-400 mb-2">Overall</div>
              <div className="text-gray-700 mb-2">
                {doneSetLoaded ? `${overallProgress}% complete` : "Loading progress..."}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${doneSetLoaded ? clamp(overallProgress, 0, 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="flex-1 max-w-xs">
              <div className="text-sm text-gray-400 mb-2">This lesson</div>
              <div className="text-gray-700 mb-2">
                {doneSetLoaded ? `${lessonProgress}% of steps` : "Loading progress..."}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${doneSetLoaded ? clamp(lessonProgress, 0, 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={isDone ? unmarkDone : markDone}
                type="button"
                className={`px-5 py-2 rounded-lg border text-sm transition-colors ${
                  isDone
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isDone ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4" /> Done
                  </span>
                ) : (
                  "Mark Done"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="px-12 py-6 w-full">
          <div className="w-full">
            {/* If this step has a custom component (ex: ProjectMindMap), render it instead */}
            {step?.customComponent ? (
              <div className="w-full">
                {(() => {
                  const Comp = step.customComponent;
                  return <Comp embedded onBack={goPrev} onContinue={goNext} />;
                })()}
              </div>
            ) : (
              <>
                {step?.desc ? (
                  <div className={styles.stepDescBlock}>{renderInline(step.desc)}</div>
                ) : null}

                {Array.isArray(step?.codes) && step.codes.length > 0 ? (
                  <div className="space-y-8">
                    {step.codes.map((block: any, idx: number) => (
                      <div key={idx}>
                        {block?.topicTitle ? (
                          <h3 className={styles.blockTopicTitle}>
                            {String(block.topicTitle)}
                          </h3>
                        ) : null}

                        {block?.descBeforeCode ? (
                          <div className={styles.stepDescBlock}>
                            {renderInline(block.descBeforeCode)}
                          </div>
                        ) : null}

                        {block?.descBetweenBeforeAndCode ? (
                          <div className={styles.stepDescBlock}>
                            {renderInline(block.descBetweenBeforeAndCode)}
                          </div>
                        ) : null}

                        {block?.imageGridBeforeCode
                          ? renderImageGrid(block.imageGridBeforeCode, `b-${idx}-before`)
                          : null}

                        {block?.code ? (
                          <GuidedCodeBlock
                            step={step}
                            block={block}
                            blockIndex={idx}
                            storageKey={localStorageKeyForThisStep}
                            globalKey={KEYS.globalBlanksKey}
                            apiBaseUrl={apiBaseUrl}
                            analyticsTag={analyticsTag}
                            mergedBlanks={mergedBlanks}
                            setLocalBlanks={setLocalBlanks}
                            setGlobalBlanks={setGlobalBlanks}
                            blankStatus={blankStatus}
                            setBlankStatus={setBlankStatus}
                            activeBlankHint={activeBlankHint}
                            setActiveBlankHint={setActiveBlankHint}
                            aiHelpByBlank={aiHelpByBlank}
                            setAiHelpByBlank={setAiHelpByBlank}
                            aiLoadingKey={aiLoadingKey}
                            setAiLoadingKey={setAiLoadingKey}
                            aiLastRequestAtByKey={aiLastRequestAtByKey}
                            setAiLastRequestAtByKey={setAiLastRequestAtByKey}
                            aiHintLevelByBlank={aiHintLevelByBlank}
                            setAiHintLevelByBlank={setAiHintLevelByBlank}
                            checkAttempts={checkAttempts}
                            setCheckAttempts={setCheckAttempts}
                            blankAttemptsByName={blankAttemptsByName}
                            setBlankAttemptsByName={setBlankAttemptsByName}
                            logBlankAnalytics={logBlankAnalytics}
                          />
                        ) : null}

                        {block?.descAfterCode ? (
                          <div className={styles.stepDescBlock}>
                            {renderInline(block.descAfterCode)}
                          </div>
                        ) : null}

                        {block?.imageGridAfterCode
                          ? renderImageGrid(block.imageGridAfterCode, `b-${idx}-after`)
                          : null}

                        {block?.descAfterImage ? (
                          <div className={styles.stepDescBlock}>
                            {renderInline(block.descAfterImage)}
                          </div>
                        ) : null}

                        {block?.hint ? (
                          <div className={styles.hintBox}>
                            <div className={styles.hintTitle}>Hint</div>
                            <div className={styles.hintText}>{String(block.hint)}</div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            <div className="flex justify-between pt-10 border-t border-gray-200 mt-12">
              <button
                onClick={goPrev}
                disabled={!canPrev}
                type="button"
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Step
              </button>

              <button
                onClick={goNext}
                disabled={!canNext}
                type="button"
                className="px-8 py-3 bg-sky-800 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Sidebar */}
      {sidebarExpanded ? (
        <div className={`w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto ${styles.hideScrollbar}`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectCircuits}
                  className={[
                    "px-3 py-1 rounded-full text-sm border transition-colors",
                    (() => {
                      if (supportsInlineTracks) return lessonType === "circuits";
                        const ptr = parseCurioPtr(storagePrefix);
                        const target = ptr ? siblingLessonSlug(ptr.lessonSlug, "circuits") : null;
                        return ptr?.lessonSlug === (target ?? circuitsLessonSlug);
                    })()
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100",
                  ].join(" ")}
                >
                  Circuits
                </button>

                <button
                  type="button"
                  onClick={onSelectCoding}
                  className={[
                    "px-3 py-1 rounded-full text-sm border transition-colors",
                    (() => {
                      if (supportsInlineTracks) return lessonType === "coding";
                        const ptr = parseCurioPtr(storagePrefix);
                        const target = ptr ? siblingLessonSlug(ptr.lessonSlug, "coding") : null;
                        return ptr?.lessonSlug === (target ?? codingLessonSlug);

                    })()
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100",
                  ].join(" ")}
                >
                  Coding
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSidebarExpanded(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>

            {/* ========= LESSON LIST (NORMAL then ADVANCED OPTIONAL) ========= */}
            <div className="space-y-4">
              {normalLessonNums.map((lessonNum) => {
                const entry = getLessonEntry(lessonNum);
                const lessonStepsArr = getLessonStepsArray(lessonNum);
                const expanded = expandedLessons.includes(lessonNum);
                const lessonSubtitle = getLessonPhrase(lessonNum);

                const isLessonActive = lessonNum === lesson;
                const allStepsDone =
                  lessonStepsArr.length > 0 &&
                  lessonStepsArr.every((_: any, idx: number) =>
                    doneSet.has(makeStepKey(lessonNum, idx))
                  );

                const locked = false;

                return (
                  <div
                    key={lessonNum}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleLesson(lessonNum)}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                        isLessonActive
                          ? "bg-indigo-50 hover:bg-indigo-100"
                          : allStepsDone
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-white"
                      }`}
                    >
                      <div className="text-left">
                        <div className={`text-sm mb-1 ${isLessonActive ? "text-indigo-600" : "text-gray-900"}`}>
                          {isLessonEntryOptional(entry) ? "Optional Lesson" : "Lesson"} {lessonNum}
                        </div>
                        {lessonSubtitle ? (
                          <div className={`text-xs ${isLessonActive ? "text-indigo-500" : "text-gray-500"}`}>
                            {lessonSubtitle}
                          </div>
                        ) : null}
                      </div>

                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                      {expanded ? (
                        <div className="px-4 pb-4 pt-3 space-y-1">
                          {(() => {
                            const split = splitStepsForOptionalDropdown(lessonStepsArr);
                            const optOpen = !!optionalExpandedByLesson[lessonNum];

                            return (
                              <>
                                {/* BEFORE optional */}
                                {split.before.map(({ st, idx }: any) =>
                                  renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                )}

                                {/* OPTIONAL dropdown */}
                                {split.hasOptional && split.optionalBlock.length > 0 ? (
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleOptionalSteps(lessonNum)}
                                      className="w-full flex items-center justify-between py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
                                    >
                                      <span className="font-medium">Optional Steps</span>
                                      {optOpen ? (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                      )}
                                    </button>

                                    {optOpen ? (
                                      <div className="mt-1 space-y-1 pl-2 border-l border-gray-200">
                                        {split.optionalBlock.map(({ st, idx }: any) =>
                                          renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}

                                {/* AFTER optional */}
                                {split.after.map(({ st, idx }: any) =>
                                  renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : null}

                  </div>
                );
              })}

              {advancedLessonNums.length > 0 ? (
                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-3">
                    Advanced (Optional)
                  </div>

                  <div className="space-y-4">
                    {advancedLessonNums.map((lessonNum) => {
                      const entry = getLessonEntry(lessonNum);
                      const lessonStepsArr = getLessonStepsArray(lessonNum);
                      const expanded = expandedLessons.includes(lessonNum);
                      const lessonSubtitle = getLessonPhrase(lessonNum);

                      const isLessonActive = lessonNum === lesson;
                      const allStepsDone =
                        lessonStepsArr.length > 0 &&
                        lessonStepsArr.every((_: any, idx: number) =>
                          doneSet.has(makeStepKey(lessonNum, idx))
                        );

                      const locked = !advancedUnlocked;

                      return (
                        <div
                          key={lessonNum}
                          className={[
                            "bg-white rounded-lg border overflow-hidden",
                            locked ? "border-gray-200 opacity-70" : "border-gray-200",
                          ].join(" ")}
                        >
                          <button
                            onClick={() => toggleLesson(lessonNum)}
                            type="button"
                            className={[
                              "w-full flex items-center justify-between p-4 transition-colors",
                              locked ? "bg-gray-100 hover:bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50",
                              isLessonActive && !locked ? "bg-indigo-50 hover:bg-indigo-100" : "",
                              allStepsDone && !locked ? "bg-green-50 hover:bg-green-100" : "",
                            ].join(" ")}
                            disabled={locked}
                            title={locked ? "Finish all normal lessons to unlock Advanced (Optional)." : ""}
                          >
                            <div className="text-left">
                              <div className={`text-sm mb-1 ${locked ? "text-gray-400" : isLessonActive ? "text-indigo-600" : "text-gray-900"}`}>
                                {isLessonEntryOptional(entry) ? "Optional Lesson" : "Lesson"} {lessonNum}
                              </div>
                              {lessonSubtitle ? (
                                <div className={`text-xs ${locked ? "text-gray-400" : isLessonActive ? "text-indigo-500" : "text-gray-500"}`}>
                                  {lessonSubtitle}
                                </div>
                              ) : null}
                            </div>

                            {expanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          {expanded ? (
                            <div className="px-4 pb-4 pt-3 space-y-1">
                              {(() => {
                                const split = splitStepsForOptionalDropdown(lessonStepsArr);
                                const optOpen = !!optionalExpandedByLesson[lessonNum];

                                return (
                                  <>
                                    {/* BEFORE optional */}
                                    {split.before.map(({ st, idx }: any) =>
                                      renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                    )}

                                    {/* OPTIONAL dropdown */}
                                    {split.hasOptional && split.optionalBlock.length > 0 ? (
                                      <div className="mt-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleOptionalSteps(lessonNum)}
                                          className="w-full flex items-center justify-between py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
                                        >
                                          <span className="font-medium">Optional Steps</span>
                                          {optOpen ? (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                          )}
                                        </button>

                                        {optOpen ? (
                                          <div className="mt-1 space-y-1 pl-2 border-l border-gray-200">
                                            {split.optionalBlock.map(({ st, idx }: any) =>
                                              renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}

                                    {/* AFTER optional */}
                                    {split.after.map(({ st, idx }: any) =>
                                      renderStepButton(lessonNum, idx, st, locked, safeStepIndex)
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}

                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-6 bg-gray-50 border-l border-gray-200 flex items-start justify-center py-4">
          <button
            type="button"
            onClick={() => setSidebarExpanded(true)}
            className="text-xs text-gray-500 hover:text-gray-700 rotate-90 origin-center"
            title="Show sidebar"
          >
            Show
          </button>
        </div>
      )}
    </div>
  );

  const editorPane = (
    <div style={{ height: "100%", overflow: "hidden" }}>
      {viewMode === "circuit" ? (
        <CircuitEditor
          screenTitle="Circuit"
          wokwiUrlKey={EDITOR_KEYS.wokwiUrlKey}
          codeKey={EDITOR_KEYS.arduinoSketchKey}
          diagramKey={EDITOR_KEYS.wokwiDiagramKey}
          defaultWokwiUrl=""
        />
      ) : (
        <ArduinoEditor apiBaseUrl={apiBaseUrl} />
      )}
    </div>
  );

  return (
    <div className="h-full w-full bg-white overflow-hidden">
      {viewMode === "lesson" ? (
        lessonUi
      ) : (
        <SplitView
          persistKey={KEYS.splitKey}
          initialLeftRatio={0.62}
          minLeftRatio={0.45}
          maxLeftRatio={0.78}
          minLeftPx={520}
          minRightPx={420}
          handleWidth={12}
          left={lessonUi}
          right={editorPane}
        />
      )}
    </div>
  );
}
