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

function countTotalSteps(lessonSteps: Record<string, any[]>) {
  return Object.values(lessonSteps || {}).reduce((sum, arr) => {
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function lessonNumbers(lessonSteps: Record<string, any[]>) {
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
                <span key={`code-strong-${lineIdx}-${idx}`} className={styles.inlineCodeStrong}>
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
   View mode wiring (LessonHeaderControls writes this)
============================================================ */

type ViewMode = "lesson" | "code" | "circuit";
const VIEW_MODE_KEY = "esb:viewMode";
const VIEW_MODE_EVENT = "curio:viewMode";

function readViewMode(): ViewMode {
  const raw = storageGetString(VIEW_MODE_KEY);
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
    };
  }, [
    storagePrefix,
    doneSetKey,
    overallProgressKey,
    globalBlanksKey,
    localBlanksPrefixKey,
  ]);

  const totalStepsAllLessons = React.useMemo(
    () => countTotalSteps(lessonSteps),
    [lessonSteps]
  );

  const lessonsList = React.useMemo(
    () => lessonNumbers(lessonSteps),
    [lessonSteps]
  );

  // Read persisted navigation (lesson + step) from localStorage
  const initialNav = React.useMemo(() => {
    const v = storageGetJson<{ lesson: number; stepIndex: number }>(KEYS.navKey);
    if (v && Number.isFinite(v.lesson) && Number.isFinite(v.stepIndex)) return v;
    const firstLesson = lessonsList[0] ?? 1;
    return { lesson: firstLesson, stepIndex: 0 };
  }, [KEYS.navKey, lessonsList]);

  const [lesson, setLesson] = React.useState<number>(initialNav.lesson);
  const [stepIndex, setStepIndex] = React.useState<number>(initialNav.stepIndex);

  React.useEffect(() => {
    storageSetJson(KEYS.navKey, { lesson, stepIndex });
  }, [KEYS.navKey, lesson, stepIndex]);

  // Done set
  const [doneSet, setDoneSet] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const raw = storageGetJson<string[]>(KEYS.doneSetKey);
    if (Array.isArray(raw)) setDoneSet(new Set(raw));
  }, [KEYS.doneSetKey]);

  React.useEffect(() => {
    storageSetJson(KEYS.doneSetKey, Array.from(doneSet));
  }, [KEYS.doneSetKey, doneSet]);

  // Sidebar expanded persisted (optional)
  const [sidebarExpanded, setSidebarExpanded] = React.useState<boolean>(() => {
    const raw = storageGetJson<boolean>(KEYS.sidebarKey);
    return raw == null ? true : !!raw;
  });

  React.useEffect(() => {
    storageSetJson(KEYS.sidebarKey, sidebarExpanded);
  }, [KEYS.sidebarKey, sidebarExpanded]);

  // ✅ View mode: initialize from storage immediately
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => readViewMode());

  React.useEffect(() => {
    const update = () => setViewMode(readViewMode());

    // cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === VIEW_MODE_KEY) update();
    };

    window.addEventListener("storage", onStorage);
    // same-tab updates from header controls
    window.addEventListener(VIEW_MODE_EVENT, update as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VIEW_MODE_EVENT, update as any);
    };
  }, []);

  const showSplit = viewMode === "code" || viewMode === "circuit";

  // Current step data
  const steps = lessonSteps[String(lesson)] || [];
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;
  const step = steps[safeStepIndex];

  // sidebar accordion expanded lessons
  const [expandedLessons, setExpandedLessons] = React.useState<number[]>([lesson]);

  React.useEffect(() => {
    setExpandedLessons((prev) => (prev.includes(lesson) ? prev : [lesson, ...prev]));
  }, [lesson]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  // Progress %s
  const doneCount = doneSet.size;
  const overallProgress =
    totalStepsAllLessons > 0
      ? Math.round((doneCount / totalStepsAllLessons) * 100)
      : 0;

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
    lessonStepsCount > 0
      ? Math.round((doneInThisLesson / lessonStepsCount) * 100)
      : 0;

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
    safeStepIndex < lessonStepsCount - 1 ||
    lessonsList.indexOf(lesson) < lessonsList.length - 1;

  const goPrev = () => {
    if (safeStepIndex > 0) {
      setStepIndex(safeStepIndex - 1);
      return;
    }
    const idx = lessonsList.indexOf(lesson);
    if (idx > 0) {
      const prevLesson = lessonsList[idx - 1];
      const prevSteps = lessonSteps[String(prevLesson)] || [];
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
    ONLY ADDITION: GuidedCodeBlock shared state + persistence
     (no other behavior changes)
============================================================ */

  // per-step local blanks key (exactly what you were already passing)
  const localStorageKeyForThisStep = `${KEYS.localBlanksPrefixKey}:${currentStepKey}`;

  const [localBlanks, setLocalBlanks] = React.useState<Record<string, any>>({});
  const [globalBlanks, setGlobalBlanks] = React.useState<Record<string, any>>({});

  const [blankStatus, setBlankStatus] = React.useState<Record<string, boolean>>({});
  const [activeBlankHint, setActiveBlankHint] = React.useState<any>(null);

  const [aiHelpByBlank, setAiHelpByBlank] = React.useState<Record<string, string>>(
    {}
  );
  const [aiLoadingKey, setAiLoadingKey] = React.useState<string | null>(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = React.useState<
    Record<string, number>
  >({});
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = React.useState<
    Record<string, number>
  >({});

  const [checkAttempts, setCheckAttempts] = React.useState<number>(0);
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState<
    Record<string, number>
  >({});

  // Load GLOBAL blanks once (on mount / when key changes)
  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(KEYS.globalBlanksKey);
    setGlobalBlanks(raw && typeof raw === "object" ? raw : {});
  }, [KEYS.globalBlanksKey]);

  // Persist GLOBAL blanks
  React.useEffect(() => {
    storageSetJson(KEYS.globalBlanksKey, globalBlanks || {});
  }, [KEYS.globalBlanksKey, globalBlanks]);

  // Load LOCAL blanks whenever you change step (key changes)
  React.useEffect(() => {
    const raw = storageGetJson<Record<string, any>>(localStorageKeyForThisStep);
    setLocalBlanks(raw && typeof raw === "object" ? raw : {});

    // keep GuidedCodeBlock UI scoped per-step
    setBlankStatus({});
    setActiveBlankHint(null);
    setAiHelpByBlank({});
    setAiLoadingKey(null);
    setAiLastRequestAtByKey({});
    setAiHintLevelByBlank({});
    setCheckAttempts(0);
    setBlankAttemptsByName({});
  }, [localStorageKeyForThisStep]);

  // Persist LOCAL blanks for this step
  React.useEffect(() => {
    storageSetJson(localStorageKeyForThisStep, localBlanks || {});
  }, [localStorageKeyForThisStep, localBlanks]);

  // What GuidedCodeBlock should render from
  const mergedBlanks = React.useMemo(
    () => ({ ...(globalBlanks || {}), ...(localBlanks || {}) }),
    [globalBlanks, localBlanks]
  );

  const logBlankAnalytics = React.useCallback((_event: any) => {
    // no-op (you can wire analytics later)
  }, []);


/* ============================================================
     END ONLY ADDITION
============================================================ */

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
          <button
            onClick={() => {
              if (backRoute) router.push(backRoute);
              else router.back();
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back to Project</span>
          </button>

          <h1 className="mb-3 text-2xl font-extrabold text-gray-900">
            {step?.lessonTitle ?? `Lesson ${lesson}`}
          </h1>
          <p className="text-gray-500 mb-8">
            {step?.lessonSubtitle ?? "Learn by completing each step below."}
          </p>

          <div className="flex gap-12 items-end">
            <div className="flex-1 max-w-xs">
              <div className="text-sm text-gray-400 mb-2">Overall progress</div>
              <div className="text-gray-700 mb-2">{overallProgress}% complete</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${clamp(overallProgress, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex-1 max-w-xs">
              <div className="text-sm text-gray-400 mb-2">This lesson</div>
              <div className="text-gray-700 mb-2">{lessonProgress}% of steps</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${clamp(lessonProgress, 0, 100)}%` }}
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
        <div className="px-12 py-12 w-full">
          <div className="w-full">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {step?.title ?? `Step ${safeStepIndex + 1}`}
            </h2>
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
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarExpanded ? (
        <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-gray-900 font-extrabold">Lessons & Steps</h3>
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
                const lessonStepsArr = lessonSteps[String(lessonNum)] || [];
                const expanded = expandedLessons.includes(lessonNum);

                const lessonSubtitle =
                  lessonStepsArr?.[0]?.title ? String(lessonStepsArr[0].title) : "";

                const isLessonActive = lessonNum === lesson;
                const allStepsDone =
                    lessonStepsArr.length > 0 &&
                    lessonStepsArr.every((_, idx) =>
                        doneSet.has(makeStepKey(lessonNum, idx))
  );

                return (
                  <div
                    key={lessonNum}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleLesson(lessonNum)}
                      type="button"
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                        isLessonActive ? 
                         "bg-indigo-50 hover:bg-indigo-100"
                        :allStepsDone
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
                                     ? "bg-transparent text-green-700 hover:bg-gray-100 hover: text-green-800"
                                     : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {st?.title ? String(st.title) : `Step ${idx + 1}`}
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
          wokwiUrlKey="esb:wokwi:url"
          codeKey="esb:arduino:sketch"
          diagramKey="esb:wokwi:diagram"
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
        persistKey={KEYS.splitPersistKey ?? null}
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
