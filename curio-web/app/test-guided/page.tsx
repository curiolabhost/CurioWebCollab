"use client";

import * as React from "react";

// ✅ 改成你项目里 lessonMapBeg（或 mindMapBeg）真实路径
import { mindmapNodes } from "@/src/projects/electric-status-board/assets/mindMapBeg"; // 或 lessonMapBeg
// mindmapNodes 的 shape 见你贴的文件：[{id,title,description,type,connections,...}] :contentReference[oaicite:1]{index=1}

/**
 * =========================
 * Config: storage prefix + mapping
 * =========================
 */

// 你现在嵌在 /test-guided 的 lesson base 用的是这个
const STORAGE_PREFIX = "test-guided";

// ✅ 关键：把 CodeLessonBase 的 stepIndex 映射到 mindmap nodeId
// stepKey 是 Lx-Sy，Sy 就是 stepIndex（从 0 开始）
// 你需要按你真实 lessonSteps 的顺序填一下这个表
const STEP_TO_NODE: Record<number, string> = {
  0: "setup",
  1: "main-menu",
  2: "status-menu",
  3: "status-display",
  4: "clock-screen",
  // 继续填：5,6,7... 直到你 lesson base 里全部 step 覆盖
};

/**
 * =========================
 * Types
 * =========================
 */

type GuidedUiPayload = {
  blankStatus?: Record<string, boolean>;
  blankAttemptsByName?: Record<string, number>; // wrong-only count
  aiHintLevelByBlank?: Record<string, number>; // key: `${blockIndex}:${blankName}` => level
};

type StepUi = {
  stepKey: string; // e.g., "L1-S0"
  lessonIndex: number; // from "Lx"
  stepIndex: number; // from "Sy"
  ui: GuidedUiPayload;
};

type BlankStat = {
  blankName: string;
  completed: boolean;
  wrong: number;
  ai: number;
};

type NodeStats = {
  nodeId: string;
  title: string;
  description: string;
  stepKeys: string[]; // which steps mapped here
  blanks: BlankStat[];
  totalBlanks: number;
  completedBlanks: number;
  wrongTotal: number;
  aiTotal: number;
};

/**
 * =========================
 * LocalStorage scan helpers
 * =========================
 */

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseStepKey(stepKey: string): { lessonIndex: number; stepIndex: number } | null {
  // expected: "L1-S0"
  const m = /^L(\d+)-S(\d+)$/.exec(stepKey);
  if (!m) return null;
  return { lessonIndex: Number(m[1]), stepIndex: Number(m[2]) };
}

function readAllStepUis(storagePrefix: string): StepUi[] {
  const out: StepUi[] = [];
  if (typeof window === "undefined") return out;

  // ✅ 你已经验证过的 key pattern
  // `${storagePrefix}:blanks:LOCAL:UI:${stepKey}`
  const marker = `${storagePrefix}:blanks:LOCAL:UI:`;

  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(marker)) continue;

    const stepKey = k.slice(marker.length); // "L1-S0"
    const parsed = parseStepKey(stepKey);
    if (!parsed) continue;

    const raw = window.localStorage.getItem(k);
    const ui = safeJsonParse<GuidedUiPayload>(raw);
    if (!ui) continue;

    out.push({
      stepKey,
      lessonIndex: parsed.lessonIndex,
      stepIndex: parsed.stepIndex,
      ui,
    });
  }

  // stable order
  out.sort((a, b) => a.stepKey.localeCompare(b.stepKey));
  return out;
}

/**
 * =========================
 * Build stats: step -> node -> blanks
 * =========================
 */

function aiMapToByBlank(aiHintLevelByBlank?: Record<string, number>): Record<string, number> {
  // aiHintLevelByBlank uses key `${blockIndex}:${blankName}`
  // We'll aggregate by blankName taking max level as "usage"
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

function mergeBlankStatsFromUi(ui: GuidedUiPayload): BlankStat[] {
  const status = ui.blankStatus || {};
  const wrong = ui.blankAttemptsByName || {};
  const aiByBlank = aiMapToByBlank(ui.aiHintLevelByBlank);

  const names = new Set<string>([
    ...Object.keys(status),
    ...Object.keys(wrong),
    ...Object.keys(aiByBlank),
  ]);

  return Array.from(names)
    .sort()
    .map((blankName) => ({
      blankName,
      completed: status[blankName] === true,
      wrong: Number(wrong[blankName] || 0),
      ai: Number(aiByBlank[blankName] || 0),
    }));
}

function buildNodeStats(stepUis: StepUi[], selectedLessonIndex: number | "all"): NodeStats[] {
  // Build a quick lookup for node meta
  const nodeMeta = new Map(
    (mindmapNodes || []).map((n: any) => [
      n.id,
      { title: n.title, description: n.description },
    ])
  );

  // Init buckets for each node
  const buckets = new Map<string, { stepKeys: string[]; blanks: BlankStat[] }>();

  // include all known nodes first
  for (const n of mindmapNodes as any[]) {
    buckets.set(n.id, { stepKeys: [], blanks: [] });
  }
  // add an "unknown" bucket for unmapped steps
  buckets.set("__unknown__", { stepKeys: [], blanks: [] });

  for (const s of stepUis) {
    if (selectedLessonIndex !== "all" && s.lessonIndex !== selectedLessonIndex) continue;

    const nodeId = STEP_TO_NODE[s.stepIndex] || "__unknown__";
    const b = buckets.get(nodeId) || { stepKeys: [], blanks: [] };

    b.stepKeys.push(s.stepKey);
    b.blanks.push(...mergeBlankStatsFromUi(s.ui));

    buckets.set(nodeId, b);
  }

  // Reduce duplicates: same blankName might appear multiple times across steps;
  // for node-level display, we aggregate by blankName with:
  // - completed: ever true
  // - wrong: sum
  // - ai: max (level)
  const out: NodeStats[] = [];

  for (const [nodeId, { stepKeys, blanks }] of buckets.entries()) {
    const agg = new Map<string, BlankStat>();
    for (const b of blanks) {
      const cur = agg.get(b.blankName) || {
        blankName: b.blankName,
        completed: false,
        wrong: 0,
        ai: 0,
      };
      cur.completed = cur.completed || b.completed;
      cur.wrong += b.wrong;
      cur.ai = Math.max(cur.ai, b.ai);
      agg.set(b.blankName, cur);
    }

    const list = Array.from(agg.values()).sort(
      (a, b) => b.wrong * 2 + b.ai - (a.wrong * 2 + a.ai)
    );

    const totalBlanks = list.length;
    const completedBlanks = list.filter((x) => x.completed).length;
    const wrongTotal = list.reduce((s, x) => s + x.wrong, 0);
    const aiTotal = list.reduce((s, x) => s + x.ai, 0);

    const meta = nodeMeta.get(nodeId);

    out.push({
      nodeId,
      title: meta?.title || (nodeId === "__unknown__" ? "Unmapped steps" : nodeId),
      description:
        meta?.description ||
        (nodeId === "__unknown__"
          ? "Steps that are not mapped in STEP_TO_NODE yet."
          : ""),
      stepKeys,
      blanks: list,
      totalBlanks,
      completedBlanks,
      wrongTotal,
      aiTotal,
    });
  }

  // sort: known nodes first in mindmap order; unknown last
  const order = new Map<string, number>();
  (mindmapNodes as any[]).forEach((n, idx) => order.set(n.id, idx));
  order.set("__unknown__", 10_000);

  out.sort((a, b) => (order.get(a.nodeId) ?? 9999) - (order.get(b.nodeId) ?? 9999));

  return out;
}

/**
 * =========================
 * UI helpers
 * =========================
 */

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

/**
 * =========================
 * Page
 * =========================
 */

export default function TestGuidedAnalyticsPage() {
  const [stepUis, setStepUis] = React.useState<StepUi[]>([]);
  const [lessonIndexChoice, setLessonIndexChoice] = React.useState<number | "all">("all");
  const [nodeStats, setNodeStats] = React.useState<NodeStats[]>([]);

  const refresh = React.useCallback(() => {
    const all = readAllStepUis(STORAGE_PREFIX);
    setStepUis(all);

    // if user chose a specific lessonIndex but it doesn't exist anymore, fallback to "all"
    const lessonIndices = Array.from(new Set(all.map((s) => s.lessonIndex))).sort((a, b) => a - b);
    if (lessonIndexChoice !== "all" && !lessonIndices.includes(lessonIndexChoice)) {
      setLessonIndexChoice("all");
    }

    const stats = buildNodeStats(all, lessonIndexChoice);
    setNodeStats(stats);
  }, [lessonIndexChoice]);

  // initial + polling
  React.useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 800);
    return () => window.clearInterval(t);
  }, [refresh]);

  // cross-tab storage updates (best effort)
  React.useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      const marker = `${STORAGE_PREFIX}:blanks:LOCAL:UI:`;
      if (ev.key && ev.key.startsWith(marker)) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // recompute nodeStats when lessonIndexChoice changes
  React.useEffect(() => {
    setNodeStats(buildNodeStats(stepUis, lessonIndexChoice));
  }, [stepUis, lessonIndexChoice]);

  const lessonIndices = Array.from(new Set(stepUis.map((s) => s.lessonIndex))).sort((a, b) => a - b);

  // overall across nodes (excluding unknown if you want; here include all)
  const overallTotal = nodeStats.reduce((s, n) => s + n.totalBlanks, 0);
  const overallDone = nodeStats.reduce((s, n) => s + n.completedBlanks, 0);
  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  return (
    <main style={{ padding: 20, background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Analytics (grouped by lesson nodes)</h1>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Source: {STORAGE_PREFIX}:blanks:LOCAL:UI:Lx-Sy
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Lesson index</label>
            <select
              value={lessonIndexChoice}
              onChange={(e) => setLessonIndexChoice(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{ padding: "6px 10px" }}
            >
              <option value="all">All</option>
              {lessonIndices.map((x) => (
                <option key={x} value={x}>
                  L{x}
                </option>
              ))}
            </select>

            <button onClick={refresh} style={{ padding: "6px 10px" }}>
              Refresh
            </button>
          </div>
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
          <StatPill label="steps captured" value={stepUis.length} />
          <StatPill label="nodes" value={nodeStats.length} />
          <StatPill label="unmapped steps" value={nodeStats.find((n) => n.nodeId === "__unknown__")?.stepKeys.length ?? 0} />
        </div>
      </div>

      {/* TOP: grouped by mindmap nodes */}
      <section
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 18,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>By lesson (mindmap nodes)</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>
          Node titles/descriptions come from mindmapNodes. {/*:contentReference[oaicite:2]{index=2}*/}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {nodeStats.map((n) => {
            const pct = n.totalBlanks ? Math.round((n.completedBlanks / n.totalBlanks) * 100) : 0;
            return (
              <div key={n.nodeId} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>{n.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{n.description}</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, textAlign: "right" }}>
                    <div><b>{pct}%</b></div>
                    <div>{n.stepKeys.length} steps</div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <ProgressBar pct={pct} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <StatPill label="completed" value={`${n.completedBlanks}/${n.totalBlanks}`} />
                    <StatPill label="wrong total" value={n.wrongTotal} />
                    <StatPill label="AI total" value={n.aiTotal} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 13 }}>
                      show blanks (sorted by need help)
                    </summary>

                    <div style={{ marginTop: 10 }}>
                      {n.blanks.length === 0 ? (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>No blanks observed yet for this node.</div>
                      ) : (
                        n.blanks.slice(0, 60).map((b) => (
                          <div
                            key={`${n.nodeId}:${b.blankName}`}
                            style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: "1px solid #f3f3f3" }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <code style={{ fontSize: 12 }}>{b.blankName}</code>
                              <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {b.completed ? "done" : "not done"}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              wrong {b.wrong} · AI {b.ai}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {n.stepKeys.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                        Steps in this node: {n.stepKeys.join(", ")}
                      </div>
                    )}
                  </details>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
          Note: If “Unmapped steps” is non-zero, extend <code>STEP_TO_NODE</code> so every stepIndex maps to a nodeId.
        </div>
      </section>
    </main>
  );
}
