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
    // keep blank lines
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
          // __BLANK[NAME]__
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

          // `inline code`
          if (part.startsWith("`") && part.endsWith("`")) {
            const code = part.slice(1, -1);

            // `***strong***` inside backticks (your old behavior)
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

          // **bold**
          if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return (
              <span key={`bold-${lineIdx}-${idx}`} className={styles.boldGeneral}>
                {boldText}
              </span>
            );
          }

          // normal text
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

export default function CodeLessonBase({
  lessonSteps = {},
  storagePrefix = "lesson",

  doneSetKey,
  overallProgressKey,
  globalBlanksKey,
  localBlanksPrefixKey,

  analyticsTag = "lesson",
  apiBaseUrl = "http://localhost:4000",

  backRoute = "",
}: any) {
  const router = useRouter();

  const getLessonStepsArray = React.useCallback(
    (lessonNum: number) => {
      const entry = (lessonSteps as any)?.[lessonNum];
      if (Array.isArray(entry)) return entry; // backward compatibility
      return Array.isArray(entry?.steps) ? entry.steps : [];
    },
    [lessonSteps]
  );

  const getLessonPhrase = React.useCallback(
    (lessonNum: number) => {
      const entry = (lessonSteps as any)?.[lessonNum];
      return typeof entry?.phrase === "string" ? entry.phrase : "";
    },
    [lessonSteps]
  );

  const KEYS = React.useMemo(() => {
    const d = defaultKeys(storagePrefix);
    return {
      doneSetKey: doneSetKey || d.doneSetKey,
      overallProgressKey: overallProgressKey || d.overallProgressKey,
      globalBlanksKey: globalBlanksKey || d.globalBlanksKey,
      localBlanksPrefixKey: localBlanksPrefixKey || d.localBlanksPrefixKey,
      navKey: d.navKey,
      sidebarKey: d.sidebarKey,
      splitKey: d.splitKey,
      viewModeKey: `${storagePrefix}:viewMode`,
    };
  }, [
    storagePrefix,
    doneSetKey,
    overallProgressKey,
    globalBlanksKey,
    localBlanksPrefixKey,
  ]);

  const EDITOR_KEYS = React.useMemo(() => {
    const prefix = storagePrefix || "lesson";
    return {
      arduinoSketchKey: `${prefix}:editor:arduino:sketch`,
      wokwiUrlKey: `${prefix}:editor:wokwi:url`,
      wokwiDiagramKey: `${prefix}:editor:wokwi:diagram`,
    };
  }, [storagePrefix]);

  const totalStepsAllLessons = React.useMemo(
    () => countTotalStepsFlexible(lessonSteps),
    [lessonSteps]
  );

  const lessonsList = React.useMemo(() => lessonNumbers(lessonSteps), [lessonSteps]);

  // Read persisted navigation (lesson + step) from localStorage
  
const firstLesson = lessonsList[0] ?? 1;

// deterministic initial render (server + client match)
const [lesson, setLesson] = React.useState<number>(firstLesson);
const [stepIndex, setStepIndex] = React.useState<number>(0);

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
  if (!doneSetLoaded) return; // IMPORTANT: prevent wiping storage on mount
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

  // View mode (scoped by storagePrefix)
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

    // keep state in sync if KEY changes
    update();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VIEW_MODE_EVENT, update as any);
    };
  }, [KEYS.viewModeKey, readViewMode]);

  const showSplit = viewMode === "code" || viewMode === "circuit";

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

  // per-step local blanks key
  const localStorageKeyForThisStep = `${KEYS.localBlanksPrefixKey}:${currentStepKey}`;

  // per-step guided UI state key
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

  // Load GLOBAL blanks once
  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(KEYS.globalBlanksKey);
    setGlobalBlanks(raw && typeof raw === "object" ? raw : {});
  }, [KEYS.globalBlanksKey]);

  // Persist GLOBAL blanks
  React.useEffect(() => {
    storageSetJson(KEYS.globalBlanksKey, globalBlanks || {});
  }, [KEYS.globalBlanksKey, globalBlanks]);

  // Load LOCAL blanks + GUIDED UI whenever step changes (key changes)
  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(localStorageKeyForThisStep);
    setLocalBlanks(raw && typeof raw === "object" ? raw : {});

    const ui = storageGetJson<any>(guidedUiKeyForThisStep);

    setBlankStatus(ui?.blankStatus && typeof ui.blankStatus === "object" ? ui.blankStatus : {});
    setActiveBlankHint(ui?.activeBlankHint ?? null);
    setAiHelpByBlank(ui?.aiHelpByBlank && typeof ui.aiHelpByBlank === "object" ? ui.aiHelpByBlank : {});
    setAiHintLevelByBlank(
      ui?.aiHintLevelByBlank && typeof ui.aiHintLevelByBlank === "object" ? ui.aiHintLevelByBlank : {}
    );
    setCheckAttempts(Number.isFinite(ui?.checkAttempts) ? ui.checkAttempts : 0);
    setBlankAttemptsByName(
      ui?.blankAttemptsByName && typeof ui.blankAttemptsByName === "object" ? ui.blankAttemptsByName : {}
    );

    // ephemeral (do not persist)
    setAiLoadingKey(null);
    setAiLastRequestAtByKey({});
  }, [localStorageKeyForThisStep, guidedUiKeyForThisStep]);

  // Persist LOCAL blanks for this step
  React.useEffect(() => {
    storageSetJson(localStorageKeyForThisStep, localBlanks || {});
  }, [localStorageKeyForThisStep, localBlanks]);

  // Persist GUIDED UI state for this step (debounced)
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

  // What GuidedCodeBlock should render from
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
          const src =
            typeof img === "string" ? img : img?.src || img?.uri || img?.url || "";

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
              <h3 className="text-gray-900 font-bold">Lessons & Steps</h3>
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
                  lessonStepsArr.every((_: any, idx: number) => doneSet.has(makeStepKey(lessonNum, idx)));

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
                        <div
                          className={`text-sm mb-1 ${
                            isLessonActive ? "text-indigo-600" : "text-gray-900"
                          }`}
                        >
                          Lesson {lessonNum}
                        </div>
                        {lessonSubtitle ? (
                          <div
                            className={`text-xs ${
                              isLessonActive ? "text-indigo-500" : "text-gray-500"
                            }`}
                          >
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
                              <span>
                                {String(st.title).replace(/^(Step\s*)?\d+\s*:\s*/i, "")}
                              </span>
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
