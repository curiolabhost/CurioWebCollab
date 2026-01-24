"use client";

import { LESSON_STEPS_BEGINNER } from "@/src/projects/electric-status-board/lessons/codeBeg";
import * as React from "react";

const STORAGE_PREFIX = "curio:esb:code-beg";

/** ---------------------------
 * Types
 * -------------------------- */
type GuidedUiPayload = {
  blankStatus?: Record<string, boolean>;
  blankAttemptsByName?: Record<string, number>; // wrong-only
  aiHintLevelByBlank?: Record<string, number>;  // `${blockIndex}:${blankName}` -> level
};

type StepUi = {
  stepKey: string;      // "L1-S0"
  lessonIndex: number;  // Lx
  stepIndex: number;    // Sy (local within lesson)
  ui: GuidedUiPayload;
};

type BlankStat = {
  id: string;       // `${stepKey}::${blankName}`
  stepKey: string;
  blankName: string;
  completed: boolean;
  wrong: number;
  ai: number;
};

type LessonStats = {
  lessonId: number;      // 1..8 (from LESSON_STEPS_BEGINNER keys)
  lessonTitle: string;   // phrase
  stepKeys: string[];    // expected stepKeys in this lesson
  blanks: BlankStat[];   // expected blanks w/ observed overlay
  totalBlanks: number;
  completedBlanks: number;
  wrongTotal: number;
  aiTotal: number;
};

/** ---------------------------
 * Helpers: localStorage scan
 * -------------------------- */
function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseStepKey(stepKey: string): { lessonIndex: number; stepIndex: number } | null {
  const m = /^L(\d+)-S(\d+)$/.exec(stepKey);
  if (!m) return null;
  return { lessonIndex: Number(m[1]), stepIndex: Number(m[2]) };
}

function readAllStepUis(storagePrefix: string): StepUi[] {
  const out: StepUi[] = [];
  if (typeof window === "undefined") return out;

  const marker = `${storagePrefix}:blanks:LOCAL:UI:`;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(marker)) continue;

    const stepKey = k.slice(marker.length); // "L1-S0"
    const parsed = parseStepKey(stepKey);
    if (!parsed) continue;

    const ui = safeJsonParse<GuidedUiPayload>(window.localStorage.getItem(k));
    if (!ui) continue;

    out.push({
      stepKey,
      lessonIndex: parsed.lessonIndex,
      stepIndex: parsed.stepIndex,
      ui,
    });
  }

  out.sort((a, b) => a.stepKey.localeCompare(b.stepKey));
  return out;
}

/** ---------------------------
 * Expected blanks extraction
 * - DO NOT rely only on answerKey (many are `{}` in your content)
 * - Parse __BLANK[...]__ from code + desc fields too
 * -------------------------- */
function extractBlankNamesFromText(text: any): string[] {
  const s = String(text ?? "");
  if (!s) return [];
  const out: string[] = [];
  const re = /__BLANK\[(.+?)\]__/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const name = (m[1] ?? "").trim();
    if (name) out.push(name);
  }
  return out;
}

function extractExpectedBlankNamesFromSubStep(subStep: any): string[] {
  const names = new Set<string>();

  const codes = Array.isArray(subStep?.codes) ? subStep.codes : [];
  for (const cb of codes) {
    // (1) answerKey keys (if present)
    const ak = cb?.answerKey;
    if (ak && typeof ak === "object") {
      for (const k of Object.keys(ak)) names.add(k);
    }

    // (2) parse from text fields
    for (const t of [cb?.code, cb?.descAfterCode, cb?.descBeforeCode, cb?.topicTitle]) {
      for (const k of extractBlankNamesFromText(t)) names.add(k);
    }
  }

  // also scan step-level text
  for (const t of [subStep?.title, subStep?.desc, subStep?.descAfterCode, subStep?.descBeforeCode]) {
    for (const k of extractBlankNamesFromText(t)) names.add(k);
  }

  return Array.from(names);
}

/**
 * Build expected blanks per lesson based on LESSON_STEPS_BEGINNER:
 * lessonId -> steps[] -> codes[] -> blanks
 *
 * IMPORTANT: stepKey L-index may be 0-based or 1-based.
 * We infer offset from observed L indices in localStorage:
 * - if we see L0 anywhere => offset=1 (lessonId = lessonIndex + 1)
 * - else offset=0 (lessonId = lessonIndex)
 */
type ExpectedBlank = { id: string; stepKey: string; blankName: string };

function inferOffsetFromObservedLessonIndices(observedLessonIndices: number[]): number {
  const min = Math.min(...observedLessonIndices);
  return Number.isFinite(min) && min === 0 ? 1 : 0;
}

function buildExpectedByLesson(offset: number): Map<number, ExpectedBlank[]> {
  const lessonIds = Object.keys(LESSON_STEPS_BEGINNER)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const expectedByLesson = new Map<number, ExpectedBlank[]>();

  for (const lessonId of lessonIds) {
    const lesson = (LESSON_STEPS_BEGINNER as any)[lessonId];
    const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];

    const lessonIndexInStepKey = lessonId - offset; // if offset=0 => L1 for lessonId=1; if offset=1 => L0 for lessonId=1
    const list: ExpectedBlank[] = [];

    steps.forEach((subStep: any, subStepIndex: number) => {
      const stepKey = `L${lessonIndexInStepKey}-S${subStepIndex}`;
      const blankNames = extractExpectedBlankNamesFromSubStep(subStep);

      for (const blankName of blankNames) {
        list.push({
          stepKey,
          blankName,
          id: `${stepKey}::${blankName}`,
        });
      }
    });

    expectedByLesson.set(lessonId, list);
  }

  return expectedByLesson;
}

/** ---------------------------
 * Observed blanks (from localStorage UI)
 * -------------------------- */
function aiMapToByBlank(aiHintLevelByBlank?: Record<string, number>): Record<string, number> {
  const byBlank: Record<string, number> = {};
  const m = aiHintLevelByBlank || {};
  for (const [k, lvl] of Object.entries(m)) {
    const parts = String(k).split(":");
    const blankName = parts.slice(1).join(":");
    if (!blankName) continue;
    byBlank[blankName] = Math.max(byBlank[blankName] || 0, Number(lvl) || 0);
  }
  return byBlank;
}

function blanksFromStepUi(stepKey: string, ui: GuidedUiPayload): BlankStat[] {
  const status = ui.blankStatus || {};
  const wrong = ui.blankAttemptsByName || {};
  const ai = aiMapToByBlank(ui.aiHintLevelByBlank);

  const names = new Set<string>([
    ...Object.keys(status),
    ...Object.keys(wrong),
    ...Object.keys(ai),
  ]);

  return Array.from(names).map((blankName) => {
    const id = `${stepKey}::${blankName}`;
    return {
      id,
      stepKey,
      blankName,
      completed: status[blankName] === true,
      wrong: Number(wrong[blankName] || 0),
      ai: Number(ai[blankName] || 0),
    };
  });
}

/** ---------------------------
 * Build lesson stats:
 * expected (from codeBeg content) + observed overlay (from localStorage)
 * Grouping is by lessonId (1..8) — NOT by global stepIndex.
 * -------------------------- */
function buildLessonStats(storagePrefix: string): LessonStats[] {
  const stepUis = readAllStepUis(storagePrefix);
  const observedLessonIndices = stepUis.map((s) => s.lessonIndex);
  const offset = observedLessonIndices.length ? inferOffsetFromObservedLessonIndices(observedLessonIndices) : 0;

  const expectedByLesson = buildExpectedByLesson(offset);

  // observed overlay by id (stepKey::blankName)
  const observedById = new Map<string, { completed: boolean; wrong: number; ai: number }>();
  for (const s of stepUis) {
    for (const b of blanksFromStepUi(s.stepKey, s.ui)) {
      const cur = observedById.get(b.id) ?? { completed: false, wrong: 0, ai: 0 };
      cur.completed ||= b.completed;
      cur.wrong += b.wrong;
      cur.ai = Math.max(cur.ai, b.ai);
      observedById.set(b.id, cur);
    }
  }

  const lessonIds = Object.keys(LESSON_STEPS_BEGINNER)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const out: LessonStats[] = [];

  for (const lessonId of lessonIds) {
    const lessonTitle = (LESSON_STEPS_BEGINNER as any)[lessonId]?.phrase ?? `Lesson ${lessonId}`;
    const expected = expectedByLesson.get(lessonId) ?? [];

    const blanks: BlankStat[] = expected.map((e) => {
      const obs = observedById.get(e.id);
      return {
        id: e.id,
        stepKey: e.stepKey,
        blankName: e.blankName,
        completed: obs?.completed ?? false,
        wrong: obs?.wrong ?? 0,
        ai: obs?.ai ?? 0,
      };
    });

    const totalBlanks = blanks.length;
    const completedBlanks = blanks.filter((x) => x.completed).length;
    const wrongTotal = blanks.reduce((s, x) => s + x.wrong, 0);
    const aiTotal = blanks.reduce((s, x) => s + x.ai, 0);
    const stepKeys = Array.from(new Set(expected.map((x) => x.stepKey))).sort();

    out.push({
      lessonId,
      lessonTitle,
      stepKeys,
      blanks: blanks.sort((a, b) => (b.wrong * 2 + b.ai) - (a.wrong * 2 + a.ai)),
      totalBlanks,
      completedBlanks,
      wrongTotal,
      aiTotal,
    });
  }

  return out;
}

/** ---------------------------
 * UI helpers
 * -------------------------- */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 10, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
      <div style={{ height: 10, width: `${pct}%`, background: "#111" }} />
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: any }) {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        border: "1px solid #eee",
        borderRadius: 999,
        padding: "4px 8px",
        fontSize: 12,
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}:</span>
      <b>{value}</b>
    </span>
  );
}

/** ---------------------------
 * Page
 * -------------------------- */
export default function TestGuidedAnalyticsByLesson() {
  const [lessonStats, setLessonStats] = React.useState<LessonStats[]>([]);
  const [stepCount, setStepCount] = React.useState<number>(0);

  const refresh = React.useCallback(() => {
    const allStepUis = readAllStepUis(STORAGE_PREFIX);
    setStepCount(allStepUis.length);
    setLessonStats(buildLessonStats(STORAGE_PREFIX));
  }, []);

  React.useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 800);
    return () => window.clearInterval(t);
  }, [refresh]);

  const overallTotal = lessonStats.reduce((s, n) => s + n.totalBlanks, 0);
  const overallDone = lessonStats.reduce((s, n) => s + n.completedBlanks, 0);
  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  return (
    <main style={{ padding: 20, background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Analytics (Lesson 1..8)</h1>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Source: {STORAGE_PREFIX}:blanks:LOCAL:UI:Lx-Sy
            </div>
          </div>
          <button onClick={refresh} style={{ padding: "6px 10px" }}>Refresh</button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <b style={{ fontSize: 14 }}>Overall progress</b>
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              {overallDone}/{overallTotal} blanks · {overallPct}%
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar pct={overallPct} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <StatPill label="UI steps captured" value={stepCount} />
          <StatPill label="lessons" value={lessonStats.length} />
        </div>
      </div>

      <section style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>By lesson</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {lessonStats.map((L) => {
            const pct = L.totalBlanks ? Math.round((L.completedBlanks / L.totalBlanks) * 100) : 0;
            return (
              <div key={L.lessonId} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>
                      Lesson {L.lessonId}: {L.lessonTitle}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      expected steps: {L.stepKeys.length} · expected blanks: {L.totalBlanks}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, textAlign: "right" }}>
                    <div><b>{pct}%</b></div>
                    <div>done {L.completedBlanks}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <ProgressBar pct={pct} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <StatPill label="completed" value={`${L.completedBlanks}/${L.totalBlanks}`} />
                    <StatPill label="wrong total" value={L.wrongTotal} />
                    <StatPill label="AI total" value={L.aiTotal} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 13 }}>show blanks</summary>

                    <div style={{ marginTop: 10 }}>
                      {L.blanks.length === 0 ? (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>No expected blanks for this lesson (check content).</div>
                      ) : (
                        L.blanks.slice(0, 120).map((b) => (
                          <div
                            key={b.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              padding: "5px 0",
                              borderBottom: "1px solid #f3f3f3",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <code style={{ fontSize: 12 }}>{b.blankName}</code>
                              <div style={{ fontSize: 11, opacity: 0.7 }}>
                                step {b.stepKey} · {b.completed ? "done" : "not done"}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              wrong {b.wrong} · AI {b.ai}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}