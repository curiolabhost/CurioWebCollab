"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import SplitView from "./SplitView";
import ArduinoEditor from "./ArduinoEditor";
import CircuitEditor from "./CircuitEditor";
import { useEditorToggle } from "./useEditorToggle";
import GuidedCodeBlock from "./GuidedCodeBlock";

import S from "./CodeLessonBase.module.css";

/* ============================================================
   Helpers
============================================================ */

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

const getTotalLessons = (stepsObj: Record<string, any[]>) =>
  Object.keys(stepsObj || {}).length;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function storageGet<T>(key: string): T | null {
  if (!key) return null;
  if (typeof window === "undefined") return null;
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function storageSet(key: string, value: any) {
  if (!key) return;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function countTotalSteps(lessonSteps: Record<string, any[]>) {
  return Object.values(lessonSteps || {}).reduce((sum, arr) => {
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
}

function defaultKeys(storagePrefix: string) {
  return {
    doneSetKey: `${storagePrefix}:doneSet`,
    overallProgressKey: `${storagePrefix}:overallProgress`, // optional; we compute anyway
    globalBlanksKey: `${storagePrefix}:blanks:GLOBAL`,
    localBlanksPrefixKey: `${storagePrefix}:blanks:LOCAL`,
    navKey: `${storagePrefix}:nav`,
  };
}

/* ============================================================
   Sidebar
============================================================ */

function LessonSidebar({
  lessonSteps,
  currentLesson,
  currentStepIndex,
  onSelectStep,
  fullWidth,
  isStepDone,
}: {
  lessonSteps: Record<string, any[]>;
  currentLesson: number;
  currentStepIndex: number;
  onSelectStep: (lessonNumber: number, stepIdx: number) => void;
  fullWidth?: boolean;
  isStepDone: (lessonNumber: number, stepIdx: number) => boolean;
}) {
  const lessonNums = Object.keys(lessonSteps || {})
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  return (
    <aside className={`${S.lessonSidebar} ${fullWidth ? S.sidebarExpanded : ""}`}>
      <div className={S.sidebarTitle}>Lessons</div>

      {lessonNums.map((lessonNum) => {
        const steps = lessonSteps[String(lessonNum)] || [];
        const isLessonActive = lessonNum === currentLesson;

        return (
          <div key={lessonNum} className={S.sidebarLessonBlock}>
            <div
              className={`${S.sidebarLessonTitle} ${
                isLessonActive ? S.sidebarLessonTitleActive : ""
              }`}
            >
              Lesson {lessonNum}
            </div>

            <div>
              {steps.map((step: any, idx: number) => {
                const isActive = isLessonActive && idx === currentStepIndex;
                const done = isStepDone(lessonNum, idx);

                return (
                  <button
                    key={`${lessonNum}-${idx}`}
                    className={[
                      S.sidebarStepRow,
                      isActive ? S.sidebarStepRowActive : "",
                      !isActive && done ? S.sidebarStepRowDone : "",
                    ].join(" ")}
                    onClick={() => onSelectStep(lessonNum, idx)}
                    type="button"
                    title={step?.title || `Step ${idx + 1}`}
                  >
                    <span
                      className={[
                        S.sidebarStepText,
                        isActive ? S.sidebarStepTextActive : "",
                        !isActive && done ? S.sidebarStepTextDone : "",
                      ].join(" ")}
                    >
                      {step?.title ?? `Step ${idx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

/* ============================================================
   Step Card (left content)
============================================================ */

function StepCard({
  step,
  storageKey,
  globalKey,
  apiBaseUrl,
  analyticsTag,
}: any) {
  const [localBlanks, setLocalBlanks] = React.useState<Record<string, string>>(
    {}
  );
  const [globalBlanks, setGlobalBlanks] = React.useState<Record<string, string>>(
    {}
  );
  const [blankStatus, setBlankStatus] = React.useState<Record<string, any>>({});
  const [activeBlankHint, setActiveBlankHint] = React.useState<any>(null);

  const [aiHelpByBlank, setAiHelpByBlank] = React.useState<Record<string, string>>(
    {}
  );
  const [aiLoadingKey, setAiLoadingKey] = React.useState<string | null>(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = React.useState<
    Record<string, number>
  >({});
  const [checkAttempts, setCheckAttempts] = React.useState(0);
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = React.useState<
    Record<string, number>
  >({});
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState<
    Record<string, number>
  >({});

  /* ---------- analytics ---------- */
  const logBlankAnalytics = async (event: any) => {
    try {
      await fetch(`${apiBaseUrl}/api/blank-analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          analyticsTag,
          stepId: step?.id,
          stepTitle: step?.title,
          storageKey,
        }),
      });
    } catch {
      // ignore
    }
  };

  /* ---------- load persisted blanks ---------- */
  React.useEffect(() => {
    const g = storageGet<Record<string, string>>(globalKey);
    if (g) setGlobalBlanks(g);
  }, [globalKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    const l = storageGet<Record<string, string>>(storageKey);
    if (l) setLocalBlanks(l);
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    storageSet(storageKey, localBlanks);
  }, [storageKey, localBlanks]);

  React.useEffect(() => {
    storageSet(globalKey, globalBlanks);
  }, [globalKey, globalBlanks]);

  const mergedBlanks = { ...localBlanks, ...globalBlanks };

  /* ---------- rich text renderer (with inline blanks) ---------- */
  const renderWithInlineCode = (text?: string) => {
    if (!text) return null;

    return text.split("\n").map((line, i) => (
      <p key={i} className={S.richTextLine}>
        {line
          .split(/(__BLANK\[[A-Z0-9_]+\]__|`[^`]+`|\*\*[^*]+\*\*)/g)
          .filter((x) => x !== "")
          .map((part, j) => {
            const blank = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
            if (blank) {
              const name = blank[1];
              const value = mergedBlanks[name] ?? "";
              return (
                <input
                  key={j}
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocalBlanks((p) => ({ ...(p || {}), [name]: v }));
                    setGlobalBlanks((p) => ({ ...(p || {}), [name]: v }));
                  }}
                  className={S.inlineBlankInput}
                />
              );
            }

            if (part.startsWith("`")) {
              return (
                <code key={j} className={S.inlineCode}>
                  {part.slice(1, -1)}
                </code>
              );
            }

            if (part.startsWith("**")) {
              return (
                <strong key={j} className={S.boldGeneral}>
                  {part.slice(2, -2)}
                </strong>
              );
            }

            return <span key={j}>{part}</span>;
          })}
      </p>
    ));
  };

  /* ---------- image grid ---------- */
  const grid = step?.imageGrid;
  const renderImageGrid = () => {
    if (!grid || !Array.isArray(grid.items)) return null;

    return (
      <div className={S.imageGridWrap}>
        <div className={S.imageGrid}>
          {grid.items.map((it: any, idx: number) => {
            const src = it?.image?.src ?? it?.image ?? it?.src ?? null;
            return (
              <div key={idx} className={S.imageGridItem}>
                <div className={S.imageGridImgWrap}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={S.imageGridImg} src={src} alt={it?.label ?? "image"} />
                  ) : (
                    <div className={S.imageGridImgPlaceholder} />
                  )}
                </div>
                {it?.label ? <div className={S.imageGridLabel}>{it.label}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={S.stepOuter}>
      <div className={S.stepCard}>
        <div className={S.stepHeaderRow}>
          <h3 className={S.h2}>{step?.title}</h3>
        </div>

        {step?.desc ? <div className={S.stepDescBlock}>{renderWithInlineCode(step.desc)}</div> : null}

        {renderImageGrid()}

        {Array.isArray(step?.codes) &&
          step.codes.map((block: any, idx: number) => (
            <div key={idx} style={{ marginTop: 16 }}>
              {block?.descBeforeCode ? renderWithInlineCode(block.descBeforeCode) : null}

              {block?.code ? (
                <GuidedCodeBlock
                  step={step}
                  block={block}
                  blockIndex={idx}
                  storageKey={storageKey}
                  globalKey={globalKey}
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

              {block?.descAfterCode ? renderWithInlineCode(block.descAfterCode) : null}
            </div>
          ))}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN SCREEN (FULL UI)
============================================================ */

export default function CodeLessonBase({
  screenTitle = "Coding",
  lessonSteps = {},
  storagePrefix = "lesson",

  // Optional explicit keys (restored from your original)
  doneSetKey,
  overallProgressKey,
  globalBlanksKey,
  localBlanksPrefixKey,

  analyticsTag = "lesson",
  apiBaseUrl = "http://localhost:4000",
  backRoute = "", // if blank -> router.back()
}: any) {
  const router = useRouter();

  const KEYS = React.useMemo(() => {
    const d = defaultKeys(storagePrefix);
    return {
      doneSet: doneSetKey ?? d.doneSetKey,
      overallProgress: overallProgressKey ?? d.overallProgressKey,
      globalBlanks: globalBlanksKey ?? d.globalBlanksKey,
      localBlanksPrefix: localBlanksPrefixKey ?? d.localBlanksPrefixKey,
      navKey: d.navKey,
    };
  }, [storagePrefix, doneSetKey, overallProgressKey, globalBlanksKey, localBlanksPrefixKey]);

  const TOTAL_LESSONS = getTotalLessons(lessonSteps);
  const totalSteps = countTotalSteps(lessonSteps);

  // Editor toggles
  const { showEditor, toggle: toggleEditor } = useEditorToggle();
  const [showCircuit, setShowCircuit] = React.useState(false);
  const [showBoth, setShowBoth] = React.useState(false);

  // Navigation state (persisted)
  const [lesson, setLesson] = React.useState(1);
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    const nav = storageGet<{ lesson?: number; stepIndex?: number }>(KEYS.navKey);
    if (nav?.lesson != null) setLesson(nav.lesson);
    if (nav?.stepIndex != null) setStepIndex(nav.stepIndex);
  }, [KEYS.navKey]);

  React.useEffect(() => {
    storageSet(KEYS.navKey, { lesson, stepIndex });
  }, [KEYS.navKey, lesson, stepIndex]);

  // Done set (persisted)
  const [doneSet, setDoneSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const ids = storageGet<string[]>(KEYS.doneSet);
    if (Array.isArray(ids)) setDoneSet(new Set(ids));
  }, [KEYS.doneSet]);

  React.useEffect(() => {
    storageSet(KEYS.doneSet, Array.from(doneSet));
  }, [KEYS.doneSet, doneSet]);

  const steps = lessonSteps[String(lesson)] || [];
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;

  const makeStepKey = (lessonNumber: number, stepIdx: number) => `L${lessonNumber}-S${stepIdx}`;
  const currentStepKey = makeStepKey(lesson, safeStepIndex);

  const isDone = doneSet.has(currentStepKey);

  const markDone = () =>
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });

  const unmarkDone = () =>
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.delete(currentStepKey);
      return next;
    });

  const handleSelectStep = (lessonNumber: number, stepIdx: number) => {
    setLesson(lessonNumber);
    setStepIndex(stepIdx);
    // Scroll top for the left pane
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Progress
  const overallProgress = totalSteps > 0 ? Math.round((doneSet.size / totalSteps) * 100) : 0;

  const stepsInLesson = steps.length || 0;
  const doneInLesson =
    stepsInLesson > 0
      ? Array.from({ length: stepsInLesson }).reduce((acc: number, _, i) => {
          return acc + (doneSet.has(makeStepKey(lesson, i)) ? 1 : 0);
        }, 0)
      : 0;

  const lessonProgress = stepsInLesson > 0 ? Math.round((doneInLesson / stepsInLesson) * 100) : 0;

  // Header topic
  const headerTopic =
    steps.length > 0 && steps[0]?.title
      ? String(steps[0].title).replace(/^Step \d+:\s*/, "")
      : "";

  // Left pane (FULL UI)
  const leftPane = (
    <div className={S.leftPane}>
      {/* Fixed header (inside lesson UI) */}
      <div className={S.headerRow}>
        <button
          className={S.backBtn}
          onClick={() => {
            if (backRoute) router.push(backRoute);
            else router.back();
          }}
          type="button"
        >
          ← Back
        </button>

        <div className={S.headerTitles}>
          <div className={S.h1}>{screenTitle}</div>
          <div className={S.headerSub}>{headerTopic}</div>
        </div>

        <div className={S.headerActions}>
          <button
            className={`${S.iconBtn} ${showBoth ? S.iconBtnActive : ""}`}
            onClick={() => {
              setShowBoth((p) => !p);
              // if enabling both, ensure editor is visible-ish
              if (!showEditor) toggleEditor();
            }}
            type="button"
            title="Show Circuit + Code"
          >
            Both
          </button>

          <button
            className={`${S.iconBtn} ${showCircuit ? S.iconBtnActive : ""}`}
            onClick={() => {
              setShowCircuit((p) => !p);
              setShowBoth(false);
            }}
            type="button"
            title="Toggle Circuit"
          >
            Circuit
          </button>

          <button
            className={`${S.iconBtn} ${showEditor ? S.iconBtnActive : ""}`}
            onClick={() => {
              toggleEditor();
              setShowBoth(false);
            }}
            type="button"
            title="Toggle Code Editor"
          >
            Editor
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className={S.progressWrap}>
        <div className={S.progressRow}>
          <div className={`${S.progressGroup} ${S.progressHalf}`}>
            <div className={S.progressHeader}>Overall progress</div>
            <div className={S.progressBarWrap}>
              <div className={S.progressBarFill} style={{ width: `${clamp(overallProgress, 0, 100)}%` }} />
            </div>
            <div className={S.progressLabel}>{overallProgress}% complete</div>
          </div>

          <div className={`${S.progressGroup} ${S.progressHalf}`}>
            <div className={S.progressHeader}>This lesson</div>
            <div className={S.progressBarWrap}>
              <div
                className={S.progressBarFillSecondary}
                style={{ width: `${clamp(lessonProgress, 0, 100)}%` }}
              />
            </div>
            <div className={S.progressLabel}>{lessonProgress}% of steps</div>
          </div>
        </div>
      </div>

      {/* Content + Sidebar */}
      {steps.length > 0 ? (
        <div className={S.lessonLayoutRow}>
          <div className={S.stepCol}>
            <div className={S.containerScroll}>
              <StepCard
                step={steps[safeStepIndex]}
                storageKey={`${KEYS.localBlanksPrefix}:L${lesson}-S${safeStepIndex}`}
                globalKey={KEYS.globalBlanks}
                apiBaseUrl={apiBaseUrl}
                analyticsTag={analyticsTag}
              />

              <div className={S.stepActionOuter}>
                <div className={S.stepActionCard}>
                  <button
                    className={`${S.markDoneBtnFixed} ${isDone ? S.markDoneBtnFixedDone : ""}`}
                    onClick={isDone ? unmarkDone : markDone}
                    type="button"
                  >
                    <span className={`${S.markDoneText} ${isDone ? S.markDoneTextDone : ""}`}>
                      {isDone ? "Done" : "Mark Done"}
                    </span>
                  </button>
                </div>
              </div>

              {/* spacer */}
              <div style={{ height: 24 }} />
            </div>
          </div>

          <LessonSidebar
            lessonSteps={lessonSteps}
            currentLesson={lesson}
            currentStepIndex={safeStepIndex}
            onSelectStep={handleSelectStep}
            fullWidth={!showEditor}
            isStepDone={(lessonNumber, stepIdx) => doneSet.has(makeStepKey(lessonNumber, stepIdx))}
          />
        </div>
      ) : (
        <div className={S.emptyState}>No steps found for this lesson.</div>
      )}

      {/* kept for parity */}
      <div style={{ display: "none" }}>{TOTAL_LESSONS}</div>
    </div>
  );

  // Split behavior (matches your RN intent)
  const CIRCUIT_FIXED_WIDTH = 800;

  const BOTH_MIN_LEFT_RATIO = 0.35;
  const BOTH_MAX_LEFT_RATIO = 0.65;
  const BOTH_MIN_PX = 320;

  const CODE_ONLY_DEFAULT_LEFT_RATIO = 0.6;
  const SPLIT_PERSIST_CODE_ONLY = "lesson:split:codeOnly:leftRatio:v2";
  const SPLIT_PERSIST_BOTH = "lesson:split:both:leftRatio:v2";

  return (
    <div className={S.screen}>
      {showBoth ? (
        <SplitView
          left={<CircuitEditor showExit onExit={() => setShowBoth(false)} wokwiUrlKey="" codeKey="" diagramKey="" />}
          right={<ArduinoEditor />}
          initialLeftRatio={0.55}
          persistKey={SPLIT_PERSIST_BOTH}
          minLeftRatio={BOTH_MIN_LEFT_RATIO}
          maxLeftRatio={BOTH_MAX_LEFT_RATIO}
          minLeftPx={BOTH_MIN_PX}
          minRightPx={BOTH_MIN_PX}
        />
      ) : showEditor || showCircuit ? (
        <SplitView
          left={leftPane}
          right={
            showCircuit ? (
              <CircuitEditor showExit onExit={() => setShowCircuit(false)} wokwiUrlKey="" codeKey="" diagramKey="" />
            ) : (
              <ArduinoEditor />
            )
          }
          initialLeftRatio={!showCircuit && showEditor ? CODE_ONLY_DEFAULT_LEFT_RATIO : 0.6}
          persistKey={!showCircuit && showEditor ? SPLIT_PERSIST_CODE_ONLY : null}
          minRightPx={!showCircuit && showEditor ? 420 : 0}
          maxLeftRatio={!showCircuit && showEditor ? 0.9 : 0.85}
          fixedRightPx={showCircuit && !showEditor ? CIRCUIT_FIXED_WIDTH : null}
        />
      ) : (
        leftPane
      )}
    </div>
  );
}
