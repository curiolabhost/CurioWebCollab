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

/** Supports both:
 *  lessonSteps = { 1: Step[], 2: Step[] }
 *  lessonSteps = { 1: { phrase, steps: Step[] }, 2: { phrase, steps: Step[] } }
 */
function countTotalStepsFlexible(lessonSteps: Record<string, any>) {
  const vals = Object.values(lessonSteps || {});
  let total = 0;
  for (const v of vals) {
    if (Array.isArray(v)) total += v.length;
    else if (Array.isArray(v?.steps)) total += v.steps.length;
  }
  return total;
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

function renderWithInlineCode(
  text: string | null | undefined,
  opts: {
    mergedBlanks: Record<string, any>;
    onChangeBlank: (name: string, value: string) => void;
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
            const value = opts.mergedBlanks?.[name] ?? "";

            return (
              <input
                key={`blank-${lineIdx}-${idx}`}
                value={value}
                onChange={(e) => opts.onChangeBlank(name, e.target.value)}
                className={styles.inlineBlankInput}
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

function hasAnySteps(obj: any) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).length > 0;
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

  // ✅ NEW: route targets for your “separate pages” setup
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

  // Only read persisted track if inline-tracks mode is actually enabled
  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    const raw = storageGetString(LESSON_TYPE_KEY);
    const next: LessonType = raw === "circuits" ? "circuits" : "coding";
    setLessonType(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportsInlineTracks, LESSON_TYPE_KEY]);

  // Persist track selection (only meaningful in inline-tracks mode)
  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    storageSetString(LESSON_TYPE_KEY, lessonType);
  }, [supportsInlineTracks, LESSON_TYPE_KEY, lessonType]);

  // ✅ Route-based switching when circuits are separate lesson pages
  const onSelectCircuits = React.useCallback(() => {
    if (supportsInlineTracks) {
      setLessonType("circuits");
      return;
    }
    const ptr = parseCurioPtr(storagePrefix);
    if (!ptr) return;
    if (ptr.lessonSlug === circuitsLessonSlug) return;
    router.push(`/projects/${ptr.slug}/lessons/${circuitsLessonSlug}`);
  }, [supportsInlineTracks, storagePrefix, circuitsLessonSlug, router]);

  const onSelectCoding = React.useCallback(() => {
    if (supportsInlineTracks) {
      setLessonType("coding");
      return;
    }
    const ptr = parseCurioPtr(storagePrefix);
    if (!ptr) return;
    if (ptr.lessonSlug === codingLessonSlug) return;
    router.push(`/projects/${ptr.slug}/lessons/${codingLessonSlug}`);
  }, [supportsInlineTracks, storagePrefix, codingLessonSlug, router]);

  // Use a per-track prefix so Coding and Circuits don't overwrite each other
  const trackPrefix = React.useMemo(() => {
    // in “separate page” mode, trackPrefix should NOT change,
    // because each page already has its own storagePrefix (curio:slug:lessonSlug)
    if (!supportsInlineTracks) return storagePrefix;
    return `${storagePrefix}:${lessonType}`;
  }, [supportsInlineTracks, storagePrefix, lessonType]);

  // Choose steps:
  // - inline-tracks mode: switch between lessonSteps and circuitLessonSteps
  // - separate-page mode: always use lessonSteps (because circuit page passes its own lessonSteps)
  const activeLessonSteps = React.useMemo(() => {
    if (!supportsInlineTracks) return lessonSteps || {};
    return lessonType === "circuits" ? (circuitLessonSteps || {}) : (lessonSteps || {});
  }, [supportsInlineTracks, lessonType, lessonSteps, circuitLessonSteps]);

  const getLessonStepsArray = React.useCallback(
    (lessonNum: number) => {
      const entry = (activeLessonSteps as any)?.[lessonNum];
      if (Array.isArray(entry)) return entry; // backward compatibility
      return Array.isArray(entry?.steps) ? entry.steps : [];
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
  }, [
    trackPrefix,
    doneSetKey,
    overallProgressKey,
    globalBlanksKey,
    localBlanksPrefixKey,
  ]);

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

  const totalStepsAllLessons = React.useMemo(
    () => countTotalStepsFlexible(activeLessonSteps),
    [activeLessonSteps]
  );

  const lessonsList = React.useMemo(() => lessonNumbers(activeLessonSteps), [activeLessonSteps]);

  const firstLesson = lessonsList[0] ?? 1;
  const [lesson, setLesson] = React.useState<number>(firstLesson);
  const [stepIndex, setStepIndex] = React.useState<number>(0);

  // When inline-tracks toggle changes, reset navigation inside the page
  React.useEffect(() => {
    if (!supportsInlineTracks) return;
    const fl = lessonsList[0] ?? 1;
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

  React.useEffect(() => {
    const raw = storageGetJson<string[]>(KEYS.doneSetKey);
    if (Array.isArray(raw)) setDoneSet(new Set(raw));
    setDoneSetLoaded(true);
  }, [KEYS.doneSetKey]);

  React.useEffect(() => {
    if (!doneSetLoaded) return;
    storageSetJson(KEYS.doneSetKey, Array.from(doneSet));
  }, [KEYS.doneSetKey, doneSet, doneSetLoaded]);

  // Sidebar expanded persisted
  const [sidebarExpanded, setSidebarExpanded] = React.useState<boolean>(() => {
    const raw = storageGetJson<boolean>(KEYS.sidebarKey);
    return raw == null ? true : !!raw;
  });

  React.useEffect(() => {
    storageSetJson(KEYS.sidebarKey, sidebarExpanded);
  }, [KEYS.sidebarKey, sidebarExpanded]);

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

  // Current step data
  const steps = getLessonStepsArray(lesson);
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;
  const step = steps[safeStepIndex];

  // sidebar accordion expanded lessons
  const [expandedLessons, setExpandedLessons] = React.useState<number[]>([lesson]);

  React.useEffect(() => {
    setExpandedLessons((prev) => (prev.includes(lesson) ? prev : [lesson, ...prev]));
  }, [lesson]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  // Progress %s
  const doneCount = doneSet.size;
  const overallProgress =
    totalStepsAllLessons > 0 ? Math.round((doneCount / totalStepsAllLessons) * 100) : 0;

  const lessonStepsCount = Array.isArray(steps) ? steps.length : 0;
  const doneInThisLesson = React.useMemo(() => {
    let n = 0;
    for (let i = 0; i < lessonStepsCount; i++) {
      const k = makeStepKey(lesson, i);
      if (doneSet.has(k)) n++;
    }
    return n;
  }, [doneSet, lesson, lessonStepsCount]);

  const lessonProgress =
    lessonStepsCount > 0 ? Math.round((doneInThisLesson / lessonStepsCount) * 100) : 0;

React.useEffect(() => {
  if (!doneSetLoaded) return;

  // 1) Always persist THIS page’s total steps
  try {
    window.localStorage.setItem(
      `${trackPrefix}:totalStepsAllLessons`,
      JSON.stringify(totalStepsAllLessons)
    );
  } catch {}

  // 2) Persist canonical totals
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
          JSON.stringify(totalStepsAllLessons)
        );
      } else if (isCircuitsPage) {
        window.localStorage.setItem(
          `${circuitsPrefix}:totalStepsAllLessons`,
          JSON.stringify(totalStepsAllLessons)
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
  totalStepsAllLessons,
  KEYS.overallProgressKey,
  overallProgress,
  storagePrefix,
  codingLessonSlug,
  circuitsLessonSlug,
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

  // Step navigation
  const canPrev = safeStepIndex > 0 || lessonsList.indexOf(lesson) > 0;
  const canNext =
    safeStepIndex < lessonStepsCount - 1 || lessonsList.indexOf(lesson) < lessonsList.length - 1;

  const goPrev = () => {
    if (safeStepIndex > 0) {
      setStepIndex(safeStepIndex - 1);
      return;
    }
    const idx = lessonsList.indexOf(lesson);
    if (idx > 0) {
      const prevLesson = lessonsList[idx - 1];
      const prevSteps = getLessonStepsArray(prevLesson);
      setLesson(prevLesson);
      setStepIndex(Math.max(0, prevSteps.length - 1));
    }
  };

  const goNext = () => {
    if (safeStepIndex < lessonStepsCount - 1) {
      setStepIndex(safeStepIndex + 1);
      return;
    }
    const idx = lessonsList.indexOf(lesson);
    if (idx >= 0 && idx < lessonsList.length - 1) {
      const nextLesson = lessonsList[idx + 1];
      setLesson(nextLesson);
      setStepIndex(0);
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

  const logBlankAnalytics = React.useCallback((_event: any) => {
    // no-op (wire later)
  }, []);

  function renderImageGrid(images: any, keyPrefix: string) {
    if (!images) return null;

    const items = Array.isArray(images) ? images : [images];

    return (
      <div className={styles.imageGrid}>
        {items.map((img: any, idx: number) => {
          const src = typeof img === "string" ? img : img?.src || img?.uri || img?.url || "";
          const caption = typeof img === "string" ? "" : String(img?.caption ?? "");

          if (!src) return null;

          return (
            <div key={`${keyPrefix}-${idx}`} className={styles.imageGridItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={caption || `img-${idx}`} className={styles.imageGridImg} />
              {caption ? <div className={styles.imageGridCaption}>{caption}</div> : null}
            </div>
          );
        })}
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

  const lessonUi = (
    <div className="bg-white flex h-full">
      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-12 py-8">
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
            {step?.desc ? (
              <div className={styles.stepDescBlock}>
                {renderWithInlineCode(step.desc, {
                  mergedBlanks,
                  onChangeBlank: (name, txt) => {
                    setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                    setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                  },
                })}
              </div>
            ) : null}

            {Array.isArray(step?.codes) && step.codes.length > 0 ? (
              <div className="space-y-8">
                {step.codes.map((block: any, idx: number) => (
                  <div key={idx}>
                    {block?.descBeforeCode ? (
                      <div className={styles.stepDescBlock}>
                        {renderWithInlineCode(block.descBeforeCode, {
                          mergedBlanks,
                          onChangeBlank: (name, txt) => {
                            setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                            setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                          },
                        })}
                      </div>
                    ) : null}

                    {block?.topicTitle ? (
                      <h3 className={styles.blockTopicTitle}>{String(block.topicTitle)}</h3>
                    ) : null}

                    {block?.descBetweenBeforeAndCode ? (
                      <div className={styles.stepDescBlock}>
                        {renderWithInlineCode(block.descBetweenBeforeAndCode, {
                          mergedBlanks,
                          onChangeBlank: (name, txt) => {
                            setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                            setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                          },
                        })}
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
                        {renderWithInlineCode(block.descAfterCode, {
                          mergedBlanks,
                          onChangeBlank: (name, txt) => {
                            setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                            setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                          },
                        })}
                      </div>
                    ) : null}

                    {block?.imageGridAfterCode
                      ? renderImageGrid(block.imageGridAfterCode, `b-${idx}-after`)
                      : null}

                    {block?.descAfterImage ? (
                      <div className={styles.stepDescBlock}>
                        {renderWithInlineCode(block.descAfterImage, {
                          mergedBlanks,
                          onChangeBlank: (name, txt) => {
                            setLocalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                            setGlobalBlanks((prev: any) => ({ ...(prev || {}), [name]: txt }));
                          },
                        })}
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
                    // highlight based on either inline toggle OR route
                    (() => {
                      if (supportsInlineTracks) return lessonType === "circuits";
                      const ptr = parseCurioPtr(storagePrefix);
                      return ptr?.lessonSlug === circuitsLessonSlug;
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
                      return ptr?.lessonSlug === codingLessonSlug;
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

            <div className="space-y-4">
              {lessonsList.map((lessonNum) => {
                const lessonStepsArr = getLessonStepsArray(lessonNum);
                const expanded = expandedLessons.includes(lessonNum);
                const lessonSubtitle = getLessonPhrase(lessonNum);

                const isLessonActive = lessonNum === lesson;
                const allStepsDone =
                  lessonStepsArr.length > 0 &&
                  lessonStepsArr.every((_: any, idx: number) =>
                    doneSet.has(makeStepKey(lessonNum, idx))
                  );

                return (
                  <div key={lessonNum} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                          Lesson {lessonNum}
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
                        {lessonStepsArr.map((st: any, idx: number) => {
                          const isActive = lessonNum === lesson && idx === safeStepIndex;
                          const stepKey = makeStepKey(lessonNum, idx);
                          const isStepDone = doneSet.has(stepKey);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setLesson(lessonNum);
                                setStepIndex(idx);
                              }}
                              className={`w-full text-left text-sm py-1 px-3 rounded transition-colors ${
                                isActive
                                  ? "bg-indigo-100 text-indigo-700"
                                  : isStepDone
                                  ? "bg-transparent text-green-700 hover:bg-gray-100 hover:text-green-800"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              <span className="mr-2 text-s text-gray-600">{idx + 1}.</span>
                              <span>{String(st.title).replace(/^(Step\s*)?\d+\s*:\s*/i, "")}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
        <ArduinoEditor apiBaseUrl={apiBaseUrl} storageKey={EDITOR_KEYS.arduinoSketchKey} />
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
