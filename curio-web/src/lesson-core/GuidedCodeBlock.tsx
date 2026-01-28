"use client";

import * as React from "react";
import styles from "./GuidedCodeBlock.module.css";
import InlineEditorToken from "./EditorBlock";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { highlightTree, tagHighlighter, tags as t } from "@lezer/highlight";




// keep ONLY these from the shared util
import { type AnswerSpec, evalAnswerSpec, BlankRule, BlankTypedSpec } from "./blankCheckUtils";

function isIdentChar(ch: string) {
  return /[A-Za-z0-9_]/.test(ch);
}

const guidedHighlighter = tagHighlighter([
  { tag: t.comment, class: styles.syntaxComment },

  { tag: t.string, class: styles.syntaxString },
  { tag: t.number, class: styles.syntaxNumber },

  { tag: t.keyword, class: styles.syntaxControl },
  { tag: t.controlKeyword, class: styles.syntaxControl },

  { tag: t.typeName, class: styles.syntaxType },
  { tag: t.variableName, class: styles.syntaxVar },
  { tag: t.propertyName, class: styles.syntaxVar },
  { tag: t.name, class: styles.syntaxVar }, // catch-all for identifiers like `display`


  // function calls / names
  { tag: t.function(t.variableName), class: styles.syntaxArduinoFunc },
  { tag: t.function(t.name), class: styles.syntaxArduinoFunc },

  // #include, #define, macros, etc.
  { tag: t.macroName, class: styles.syntaxPreprocessor },
  { tag: t.processingInstruction, class: styles.syntaxPreprocessor },

  // optional: make operators slightly brighter if you want
  // { tag: t.operator, class: styles.codeHighlight },
]);

type Props = {
  step: any;
  block: any;
  blockIndex: number;
  storageKey: string;
  globalKey: string;
  apiBaseUrl?: string;
  analyticsTag?: string;

  mergedBlanks: Record<string, any>;
  setLocalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setGlobalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  blankStatus?: Record<string, boolean | null | undefined>;
  setBlankStatus?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  activeBlankHint?: { name: string; text: string; blockIndex: number } | null;
  setActiveBlankHint?: React.Dispatch<
    React.SetStateAction<{ name: string; text: string; blockIndex: number } | null>
  >;

  aiHelpByBlank?: Record<string, string>;
  setAiHelpByBlank?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  aiLoadingKey?: string | null;
  setAiLoadingKey?: React.Dispatch<React.SetStateAction<string | null>>;
  aiLastRequestAtByKey?: Record<string, number>;
  setAiLastRequestAtByKey?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  aiHintLevelByBlank?: Record<string, number>;
  setAiHintLevelByBlank?: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  checkAttempts?: number;
  setCheckAttempts?: React.Dispatch<React.SetStateAction<number>>;
  blankAttemptsByName?: Record<string, number>;
  setBlankAttemptsByName?: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  logBlankAnalytics?: (payload: any) => void;

  horizontalScroll?: boolean;
};

const CHAR_W = 8.6;

// ============================================================
// Utilities
// ============================================================

async function streamHelpSSE(payload: any, onToken: (t: string) => void) {
  const res = await fetch("/api/help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI route failed (${res.status}): ${t}`);
  }
  if (!res.body) throw new Error("AI route returned no body (streaming not enabled).");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");
      let eventType = "message";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }

      if (eventType === "token") {
        try {
          const parsed = JSON.parse(data || "{}");
          if (parsed?.token) onToken(parsed.token);
        } catch {}
      }

      if (eventType === "error") {
        let msg = "AI request failed.";
        try {
          msg = JSON.parse(data || "{}")?.error || msg;
        } catch {}

        const isRateLimit =
          /rate limit/i.test(msg) || /Limit \d+, Used \d+/i.test(msg) || /Please try again/i.test(msg);

        const err = new Error(msg) as Error & { code?: string };
        if (isRateLimit) err.code = "RATE_LIMIT";
        throw err;
      }
    }
  }
}

function editorPersistKey(globalKey: string, editorId: string) {
  return `curio:editor:v1:${globalKey || "global"}:${editorId || "editor"}`;
}

// ============================================================
// Template parsing: ^^...^^ highlight segments, __BLANK[NAME]__ blanks
// ============================================================
type TemplateTok =
  | { type: "text"; content: string; highlight?: boolean }
  | { type: "blank"; name: string; highlight?: boolean }
  | { type: "editor"; id: string; highlight?: boolean };

function tokenizeTemplateLineWithState(
  line: string,
  inHiStart: boolean
): { toks: TemplateTok[]; inHiEnd: boolean } {
  const toks: TemplateTok[] = [];
  if (line == null) return { toks, inHiEnd: inHiStart };

  const str = String(line);

  let i = 0;
  let inHi = inHiStart;

  while (i < str.length) {
    // Toggle highlight on ^^
    if (str.slice(i, i + 2) === "^^") {
      inHi = !inHi;
      i += 2;
      continue;
    }

    // Blank token
    if (str.slice(i, i + "__BLANK[".length) === "__BLANK[") {
      const end = str.indexOf("]__", i);
      if (end !== -1) {
        const name = str.slice(i + "__BLANK[".length, end).trim();
        toks.push({ type: "blank", name, highlight: inHi });
        i = end + "]__".length;
        continue;
      }
    }

        // Editor token
    if (str.slice(i, i + "__EDITOR[".length) === "__EDITOR[") {
      const end = str.indexOf("]__", i);
      if (end !== -1) {
        const id = str.slice(i + "__EDITOR[".length, end).trim();
        toks.push({ type: "editor", id, highlight: inHi });
        i = end + "]__".length;
        continue;
      }
    }


    // Otherwise, consume until next special token
    const nextHi = str.indexOf("^^", i);
    const nextBlank = str.indexOf("__BLANK[", i);
    const nextEditor = str.indexOf("__EDITOR[", i);

    let next = -1;
    for (const n of [nextHi, nextBlank, nextEditor]) {
      if (n === -1) continue;
      next = next === -1 ? n : Math.min(next, n);}

const chunk = next === -1 ? str.slice(i) : str.slice(i, next);
toks.push({ type: "text", content: chunk, highlight: inHi });
i = next === -1 ? str.length : next;
  }

  return { toks, inHiEnd: inHi };
}

function splitComment(lineTokens: TemplateTok[]) {
  // Default behavior:
  // - "//" splits into the right comment column
  // - "//<<" forces the comment to stay inline on the left (no split)
  const codeTokens: TemplateTok[] = [];
  let comment = "";
  let inComment = false;

  for (const tok of lineTokens) {
    if (inComment) {
      if (tok.type === "text") comment += tok.content;
      else if (tok.type === "blank") comment += "_____";
      continue;
    }

    if (tok.type === "text") {
      const s = tok.content || "";
      const idx = s.indexOf("//");

      if (idx >= 0) {
        const after = s.slice(idx);

        // "//<<" means: keep this comment inline (do NOT split)
        if (after.startsWith("//<<")) {
          const normalized = s.replace("//<<", "//");
          codeTokens.push({ ...tok, content: normalized });
          continue;
        }

        const before = s.slice(0, idx);
        const commentPart = after;

        if (before.length > 0) {
          codeTokens.push({ ...tok, content: before });
          comment = commentPart;
        } else {
          comment = commentPart;
        }

        inComment = true;
      } else {
        codeTokens.push(tok);
      }

      continue;
    }

    if (tok.type === "blank" || tok.type === "editor") {
      codeTokens.push(tok as any);
    }
  }

  return { codeTokens, comment: comment.trimEnd() };
}

function estimateTemplateTokenWidthPx(tok: TemplateTok, valueLen: number) {
  if (!tok) return 0;
  if (tok.type === "blank") return Math.max(40, Math.max(1, valueLen) * CHAR_W);
  if (tok.type === "text") return (tok.content?.length || 0) * CHAR_W;
  return 0;
}

// Convert a snippet of C++ code into <span> runs styled by oneDarkHighlightStyle.
// This avoids embedding a CodeMirror editor inline.
function renderOneDarkHighlighted(text: string, keyPrefix: string) {
  const tree = cpp().language.parser.parse(text);

  const ranges: Array<{ from: number; to: number; cls: string }> = [];
  highlightTree(tree, guidedHighlighter, (from, to, cls) => {
    if (from < to && cls) ranges.push({ from, to, cls });
  });

  if (!ranges.length) {
  return (
    <span key={`${keyPrefix}-plain`} className={styles.codeNormal}>
      {text}
    </span>
  );
}

  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  const out: React.ReactNode[] = [];
  let pos = 0;
  let i = 0;

  while (pos < text.length) {
    while (i < ranges.length && ranges[i].to <= pos) i++;
    const r = ranges[i];

    if (!r || r.from > pos) {
      const end = r ? Math.min(r.from, text.length) : text.length;
const plain = text.slice(pos, end);

// split plain into identifier runs vs non-identifier runs
let j = 0;
while (j < plain.length) {
  const start = j;
  const ch = plain[j];

  if (isIdentChar(ch) && /[A-Za-z_]/.test(ch)) {
    // identifier run must start with letter/_ (not number)
    j++;
    while (j < plain.length && isIdentChar(plain[j])) j++;

    out.push(
      <span key={`${keyPrefix}-id-${pos + start}`} className={styles.syntaxVar}>
        {plain.slice(start, j)}
      </span>
    );
  } else {
    // non-identifier run
    j++;
    while (
      j < plain.length &&
      !(isIdentChar(plain[j]) && /[A-Za-z_]/.test(plain[j]))
    ) {
      j++;
    }

    out.push(
      <span key={`${keyPrefix}-pl-${pos + start}`} className={styles.codeNormal}>
        {plain.slice(start, j)}
      </span>
    );
  }
}

      pos = end;
      continue;
    }

    const end = Math.min(r.to, text.length);
    out.push(
      <span key={`${keyPrefix}-h-${pos}`} className={r.cls}>
        {text.slice(pos, end)}
      </span>
    );
    pos = end;
  }

  return out;
}




export default function GuidedCodeBlock({
  step,
  block,
  blockIndex,
  storageKey,
  globalKey, // kept for signature/analytics
  apiBaseUrl = "",
  analyticsTag,

  mergedBlanks, // now treated as GLOBAL blanks only (source of truth)
  setLocalBlanks, // ignored (kept for compatibility)
  setGlobalBlanks,

  blankStatus,
  setBlankStatus,

  activeBlankHint,
  setActiveBlankHint,

  aiHelpByBlank,
  setAiHelpByBlank,
  aiLoadingKey,
  setAiLoadingKey,
  aiLastRequestAtByKey,
  setAiLastRequestAtByKey,
  aiHintLevelByBlank,
  setAiHintLevelByBlank,

  checkAttempts,
  setCheckAttempts,
  blankAttemptsByName,
  setBlankAttemptsByName,

  logBlankAnalytics,

  horizontalScroll = true,
}: Props) {
  const AI_COOLDOWN_MS = 8000;
  const MAX_HINT_LEVEL = 3;
  

  const code: string = block?.code || step?.code || "";
  const blockExplanations = block?.blankExplanations || step?.blankExplanations || null;

  // answerKey can be: BlankRule | typed specs | arrays | strings
  const answerKey: Record<string, AnswerSpec> | null = block?.answerKey || step?.answerKey || null;

  const difficulties: Record<string, any> = step?.blankDifficulties || {};

  const bindKeyByBlankName = React.useMemo(() => {
  const out: Record<string, string> = {};
  const ak: any = answerKey || {};
  for (const [blankName, spec] of Object.entries(ak)) {
    const s: any = spec;
    if (s && typeof s === "object" && typeof s.bindAs === "string" && s.bindAs.trim()) {
      out[blankName] = s.bindAs.trim();
    }
  }
  return out;
}, [answerKey]);

  /* ==========================================================
     GLOBAL-ONLY blank values

     - UI uses a fast local "draft" state for typing
     - We debounce writes to setGlobalBlanks so navigation doesn't drop values
     - We flush on unmount
  ========================================================== */
  const [draftValues, setDraftValues] = React.useState<Record<string, any>>(
    () => (mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {})
  );
  const draftRef = React.useRef(draftValues);
  draftRef.current = draftValues;

  // On navigation/restore: sync draft to latest GLOBAL values (do not keep old step-local merges)
  React.useEffect(() => {
    const safe = mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {};
    setDraftValues(safe);
  }, [mergedBlanks]);

  const pendingGlobalRef = React.useRef<Record<string, any>>({});
  const flushTimerRef = React.useRef<any>(null);

  function scheduleGlobalUpdate(name: string, value: string) {
    if (!setGlobalBlanks) return;
    if (typeof window === "undefined") return;

    pendingGlobalRef.current[name] = value;

    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      const patch = pendingGlobalRef.current;
      pendingGlobalRef.current = {};
      flushTimerRef.current = null;

      if (Object.keys(patch).length) {
        setGlobalBlanks((prev) => ({
          ...(prev || {}),
          ...patch,
        }));
      }
    }, 200);
  }

  function flushGlobalNow() {
    if (!setGlobalBlanks) return;

    if (flushTimerRef.current && typeof window !== "undefined") {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const patch = pendingGlobalRef.current || {};
    pendingGlobalRef.current = {};

    if (Object.keys(patch).length) {
      setGlobalBlanks((prev) => ({
        ...(prev || {}),
        ...patch,
      }));
    }
  }

  React.useEffect(() => {
    return () => {
      flushGlobalNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================================
     Tokenize once per code change
  ========================================================== */
  const templateLineSplits = React.useMemo(() => {
    const rawLines = String(code || "").replace(/\r\n/g, "\n").split("\n");

    let inHi = false; // carry across lines
    return rawLines.map((line) => {
      const { toks, inHiEnd } = tokenizeTemplateLineWithState(line, inHi);
      inHi = inHiEnd;

      const { codeTokens, comment } = splitComment(toks);
      return { codeTokens, comment };
    });
  }, [code]);

  // Estimate a fixed code-column width so comments line up
  const codeColPx = React.useMemo(() => {
    let maxCodePx = 0;
    for (const { codeTokens } of templateLineSplits) {
      let lineW = 0;
      for (const t of codeTokens) {
        if (t.type === "text") {
          lineW += estimateTemplateTokenWidthPx(t, 0);
        } else if (t.type === "blank") {
          const v = String((draftValues || {})[t.name] ?? "");
          lineW += estimateTemplateTokenWidthPx(t, v.length);
        } else {
          lineW += estimateTemplateTokenWidthPx(t as any, 0);
        }
      }
      if (lineW > maxCodePx) maxCodePx = lineW;
    }

    return maxCodePx + 12;
  }, [templateLineSplits, draftValues]);

  /* ==========================================================
     RENDER CODE FROM TEMPLATE (NO re-tokenize per keystroke)
  ========================================================== */
  const renderCodeFromTemplate = () => {
    const values = draftValues || {};
    return templateLineSplits.map(({ codeTokens, comment }, lineIdx) => {
      const emptyLine = !codeTokens.length && !comment;
      const hasEditor = codeTokens.some((t: any) => t?.type === "editor");
      return (
        <div key={`line-${lineIdx}`} className={styles.codeLineRow}>
          <div
  className={styles.codePartCol}
  style={hasEditor ? { width: "100%" } : { width: codeColPx }}
>
            {emptyLine ? (
              <span className={styles.codeNormal}>{" "}</span>
            ) : (
              codeTokens.map((tok, idx) => {
                if (tok.type === "text") {
                  const textContent = tok.content;

              if (tok.highlight) {
  return (
    <span key={`t-${lineIdx}-${idx}`} className={styles.hiWrap}>
      {renderOneDarkHighlighted(textContent, `hi-${lineIdx}-${idx}`)}
    </span>
  );
}




                  return (
                    <span key={`t-${lineIdx}-${idx}`} className={styles.codeNormal}>
                      {textContent}
                    </span>
                  );
                }

                if (tok.type === "blank") {
                  const name = tok.name;
                  const val = String(values[name] ?? "");
                  const status = (blankStatus || {})[name];

                  const ch = Math.max(4, Math.max(1, val.length));
                  const width = `${ch}ch`;

                  const blankClass = [
                    styles.codeBlankInput,
                    tok.highlight ? styles.codeBlankInputHighlight : "",
                    status === true ? styles.blankCorrect : "",
                    status === false ? styles.blankIncorrect : "",
                  ].filter(Boolean).join(" ");


                  return (
                    <div key={`b-${lineIdx}-${idx}`} className={styles.blankWithDot}>
                      <input
                        value={val}
                        onChange={(e) => {
                          const txt = e.target.value;

                          // instant UI update
                          setDraftValues((prev) => ({
                            ...(prev || {}),
                            [name]: txt,
                          }));

                          // persist globally (debounced)
                          scheduleGlobalUpdate(name, txt);

                          // ALSO persist binding key if this blank binds one
                          const bindKey = bindKeyByBlankName[name];
                          if (bindKey) {
                            scheduleGlobalUpdate(bindKey, txt);
                          }

                          // clear correctness while typing (only for this blank)
                          if ((blankStatus || {})[name] != null) {
                            setBlankStatus?.((prev) => {
                              const copy = { ...(prev || {}) };
                              delete (copy as any)[name];
                              return copy;
                            });
                          }
                        }}
                        onBlur={() => {
                          // ensure any pending writes flush (navigation/blur edge cases)
                          flushGlobalNow();
                        }}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className={blankClass}
                        style={{ width }}
                      />

                      {status === false && (
                        <button
                          type="button"
                          className={styles.errorDotBtn}
                          onClick={() => {
                            const explanation =
                              (blockExplanations && blockExplanations[name]) ||
                              (step?.blankExplanations && step.blankExplanations[name]) ||
                              "Hint: Re-check what this blank represents.";

                            setActiveBlankHint?.({
                              name,
                              text: explanation,
                              blockIndex,
                            });
                          }}
                          aria-label="Show hint"
                          title="Show hint"
                        >
                          <span className={styles.errorDot} />
                        </button>
                      )}
                    </div>
                  );
                }

                if (tok.type === "editor") {
                  const editorId = tok.id;
                  const isHighlighted = !!tok.highlight;

                  // optional per-block config (rows, placeholder)
                  const rows =
                    (block?.editorRows && block.editorRows[editorId]) ||
                    (step?.editorRows && step.editorRows[editorId]) ||
                    8;

                  const placeholder =
                    (block?.editorPlaceholders && block.editorPlaceholders[editorId]) ||
                    (step?.editorPlaceholders && step.editorPlaceholders[editorId]) ||
                    "Type code here…";

                  return (
                    <InlineEditorToken
                      key={`e-${lineIdx}-${idx}-${editorId}`}
                      editorId={editorId}
                      globalKey={globalKey}
                      mergedBlanks={mergedBlanks || {}}
                      setGlobalBlanks={setGlobalBlanks}
                      rows={rows}
                      placeholder={placeholder}
                      highlighted={isHighlighted}
                    />
                  );
                }


                return null;
              })
            )}
          </div>

          {!hasEditor && !!comment && <span className={styles.codeCommentCol}>{comment}</span>}
        </div>
      );
    });
  };

  /* ==========================================================
     HINT BOX (scoped to this blockIndex)
  ========================================================== */
  const aiKey =
    activeBlankHint && activeBlankHint.blockIndex === blockIndex && activeBlankHint.name
      ? `${blockIndex}:${activeBlankHint.name}`
      : null;

  const aiText =
    aiKey && Object.prototype.hasOwnProperty.call(aiHelpByBlank || {}, aiKey)
      ? (aiHelpByBlank || {})[aiKey]
      : null;

  const loadingThis = !!aiKey && aiLoadingKey === aiKey;
  const showHintBox = !!activeBlankHint && activeBlankHint.blockIndex === blockIndex;

  const requestAiBlankHelpForBlank = async ({ blankName, code }: { blankName: string; code: string }) => {
    if (!step) return;

    const key = `${blockIndex}:${blankName}`;

    const usedHints = (aiHintLevelByBlank || {})[key] ?? 0;
    if (usedHints >= MAX_HINT_LEVEL) return;

    const studentAnswer = ((draftRef.current || {})[blankName] ?? "").trim();
    const rule = answerKey?.[blankName];
    if (!rule) return;

    const previousHintText = (aiHelpByBlank || {})[key] || null;

    const now = Date.now();
    const last = (aiLastRequestAtByKey || {})[key] || 0;
    if (now - last < AI_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((AI_COOLDOWN_MS - (now - last)) / 1000);
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]:
          (prev || {})[key] ||
          `Try tweaking your answer or re-reading the hint first. You can ask AI again in about ${secondsLeft} second${
            secondsLeft === 1 ? "" : "s"
          }.`,
      }));
      return;
    }

    const upcomingHintNumber = usedHints + 1;

    let hintStyle: "gentle_nudge" | "conceptual_explanation" | "analogy_based" = "gentle_nudge";
    if (upcomingHintNumber === 2) hintStyle = "conceptual_explanation";
    else if (upcomingHintNumber === 3) hintStyle = "analogy_based";

    const payload = {
      mode: "blank-help",
      sentences: 4,
      verbosity: "brief",

      lessonId: step?.id,
      title: step?.title,
      description: step?.desc || null,
      codeSnippet: code || step?.code || null,

      blank: {
        name: blankName,
        displayName: "blank",
        studentAnswer,
        rule,
        allBlanks: draftRef.current || {},
        previousHint: previousHintText,
      },

      hintStyle,
      hintLevel: upcomingHintNumber,

      code: code || step?.code || "",
      errors: [],
    };

    try {
      setAiLoadingKey?.(key);
      setAiLastRequestAtByKey?.((prev) => ({ ...(prev || {}), [key]: now }));

      let acc = "";
      setAiHelpByBlank?.((prev) => ({ ...(prev || {}), [key]: "" }));

      await streamHelpSSE(payload, (t) => {
        acc += t;
        setAiHelpByBlank?.((prev) => ({ ...(prev || {}), [key]: acc }));
      });

      setAiHintLevelByBlank?.((prev) => ({ ...(prev || {}), [key]: upcomingHintNumber }));

      const difficulty = (step?.blankDifficulties || {})[blankName] || null;

      logBlankAnalytics?.({
        type: "AI_HINT",
        blankName,
        blockIndex,
        hintLevel: upcomingHintNumber,
        studentAnswer,
        previousHintUsed: !!previousHintText,
        difficulty,
        analyticsTag: analyticsTag || null,
        stepId: step?.id,
        stepTitle: step?.title,
        storageKey: storageKey || null,
        globalKey: globalKey || null,
      });
    } catch (err: any) {
      const msg = String(err?.message || err || "AI request failed.");
      const isRate = err?.code === "RATE_LIMIT" || /rate limit/i.test(msg) || /Please try again/i.test(msg);

      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: isRate
          ? "AI is rate-limited right now. Try again in ~20 seconds."
          : (prev || {})[key] ||
            "I had trouble generating more help right now. Try adjusting your answer slightly and re-checking.",
      }));
    } finally {
      setAiLoadingKey?.((prev) => (prev === key ? null : prev));
    }
  };

const copyCode = async (raw: string) => {
  try {
    let textToCopy = String(raw || "");

    // Merge global + latest draft so we don't miss either
    const values: Record<string, any> = {
      ...(mergedBlanks || {}),
      ...(draftRef.current || {}),
    };

    // 1) Replace blanks
    for (const [name, value] of Object.entries(values || {})) {
      const placeholder = `__BLANK[${name}]__`;
      const replacement =
        value && String(value).trim().length > 0 ? String(value) : "_____";
      textToCopy = textToCopy.split(placeholder).join(replacement);
    }

    // Any remaining blanks -> _____
    textToCopy = textToCopy.replace(/__BLANK\[[A-Z0-9_]+\]__/g, "_____");

    // 2) Replace editor blocks: __EDITOR[id]__ -> the saved editor text
    textToCopy = textToCopy.replace(/__EDITOR\[([^\]]+)\]__/g, (_m, idRaw) => {
      const id = String(idRaw || "").trim();
      const key = editorPersistKey(globalKey, id);
      const v = values[key];
      return v == null ? "" : String(v);
    });

    // Any remaining editor markers -> remove
    textToCopy = textToCopy.replace(/__EDITOR\[[^\]]+\]__/g, "");

    // 3) Strip highlight markers
    textToCopy = textToCopy.replace(/\^\^/g, "");

    await navigator.clipboard.writeText(textToCopy);
  } catch {
    // ignore
  }
};


  // counts attempts ONLY when wrong (per blank)
const checkBlanks = () => {
  if (!answerKey) return;

  flushGlobalNow();

  const values = draftRef.current || {};
  const nextStatus: Record<string, boolean> = {};
  const nextAttemptsByName = { ...(blankAttemptsByName || {}) };

  // ONE shared context for the whole check
    const ctx: Record<string, any> = {
    ...(mergedBlanks || {}),        // persisted GLOBAL blanks (includes prior bindings)
    ...(draftRef.current || {}),    // most recent typed values in this block
  };


  // stable order helps “vice versa” feel consistent
  const entries = Object.entries(answerKey).sort(([a], [b]) => {
    const na = Number(a), nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

for (const [name, spec] of entries) {
  const v = String(values[name] ?? "");
  const ok = evalAnswerSpec(spec, v, ctx);
  nextStatus[name] = ok;

  if (!ok) {
    nextAttemptsByName[name] = (nextAttemptsByName[name] || 0) + 1;
  }

  logBlankAnalytics?.({
    type: "check_blank",
    blankName: name,
    ok,
    attempt: nextAttemptsByName[name] ?? 0,
    difficulty: difficulties?.[name],
    tag: analyticsTag,
  });
}

  // persist any bindings added during evaluation into GLOBAL blanks
  if (setGlobalBlanks) {
    const before = mergedBlanks || {};
    const patch: Record<string, any> = {};

    for (const [k, v] of Object.entries(ctx)) {
      if (before[k] !== v) patch[k] = v;
    }

    if (Object.keys(patch).length) {
      setGlobalBlanks((prev) => ({ ...(prev || {}), ...patch }));
    }
  }



  setBlankStatus?.((prev) => ({
    ...(prev || {}),
    ...nextStatus,
  }));

  setBlankAttemptsByName?.(nextAttemptsByName);
  setCheckAttempts?.((n) => (n || 0) + 1);

  const anyWrong = Object.values(nextStatus).some((x) => x === false);
  if (!anyWrong) {
    setActiveBlankHint?.(null);
    setAiHelpByBlank?.({});
  }
};


  return (
    <>
      <div className={styles.codeCard}>
        <div className={styles.codeCardHeader}>
          <div className={styles.codeCardTitle}>{String(block?.title || step?.codeTitle || "Example Code")}</div>

          <div className={styles.codeCardHeaderActions}>
            {answerKey && (
              <button type="button" className={styles.copyBtn} onClick={checkBlanks}>
                <span className={styles.btnIcon}>✓</span>
                <span className={styles.copyBtnText}>Check Code</span>
              </button>
            )}

            <button type="button" className={styles.copyBtn} onClick={() => copyCode(code)}>
              <span className={styles.btnIcon}>⧉</span>
              <span className={styles.copyBtnText}>Copy to Editor</span>
            </button>
          </div>
        </div>

        {horizontalScroll ? (
          <div className={styles.hScroll}>
            <div className={styles.codeBox}>{renderCodeFromTemplate()}</div>
          </div>
        ) : (
          <div className={styles.codeBox}>{renderCodeFromTemplate()}</div>
        )}
      </div>

      {showHintBox && (
        <div className={styles.blankHintBox}>
          <div className={styles.hintLeftIcon} aria-hidden>
            ⚠️
          </div>

          <div className={styles.hintContent}>
            <div className={styles.blankHintText}>{activeBlankHint?.text}</div>

            {!aiText && !loadingThis && (
              <div className={styles.hintSubText}>
                More AI hints are allowed after you’ve thought it through for at least 6 seconds. You are allowed up to 3
                hints per blank.
              </div>
            )}

            {aiText && (
              <>
                <div className={styles.aiHintDivider} />
                <div className={styles.blankHintText}>{aiText}</div>
              </>
            )}

            {!aiText && loadingThis && (
              <>
                <div className={styles.aiHintDivider} />
                <div className={styles.hintThinking}>Thinking…</div>
              </>
            )}
          </div>

          <div className={styles.hintActions}>
            {loadingThis ? (
              <div className={styles.hintSpinner} aria-label="Loading">
                …
              </div>
            ) : (
              <button
                type="button"
                className={styles.hintIconBtn}
                onClick={() =>
                  requestAiBlankHelpForBlank({
                    blankName: activeBlankHint!.name,
                    code,
                  })
                }
                aria-label="Ask AI"
                title="Ask AI"
              >
                ?
              </button>
            )}

            <button
              type="button"
              className={styles.hintIconBtn}
              onClick={() => {
                setActiveBlankHint?.(null);
                setAiHelpByBlank?.((prev) => {
                  if (!aiKey) return prev;
                  const next = { ...(prev || {}) };
                  delete (next as any)[aiKey];
                  return next;
                });
              }}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * ============================================================
Notes
 * ============================================================
 *
 * This file is now GLOBAL-ONLY for blank VALUES:
 *    - It never calls setLocalBlanks.
 *    - It treats mergedBlanks as the global blanks dictionary (source of truth).


/**
 * ============================================================
 * What we track right now (GuidedCodeBlock + CodeLessonBase)
 * ============================================================
 *
 * Lesson-wide (persisted):
 * - doneSetKey: Set of completed step keys (L#-S#) for progress
 * - overallProgressKey: optional numeric overall progress
 * - navKey: last seen { lesson, stepIndex }
 * - sidebarKey / splitKey: UI preferences (sidebar expanded, split view sizes)
 *
 * Blank values (persisted):
 * - GLOBAL blanks (KEYS.globalBlanksKey): blankName -> text (shared across steps)
 * - LOCAL blanks per-step (KEYS.localBlanksPrefixKey + currentStepKey): blankName -> text
 * Guided UI per-step (persisted) under:
 * - guidedUiKeyForThisStep = `${KEYS.localBlanksPrefixKey}:UI:${currentStepKey}`
 * Stores:
 * - blankStatus: blankName -> boolean correctness
 * - activeBlankHint: which blank is selected in the hint UI
 * - aiHelpByBlank: blankName -> AI help text
 * - aiHintLevelByBlank: blankName -> hint level
 * - checkAttempts: # of times "Check Answer" clicked (per step)
 * - blankAttemptsByName: blankName -> WRONG attempt count (per step)
 *
 * NOTE on blankAttemptsByName:
 * - It counts "blank was wrong when Check Answer was clicked"
 * - It does NOT currently require the student to have changed the blank value.
 *   So repeatedly clicking Check Answer with the same wrong value increments again.
 *
 * Ephemeral (NOT persisted, resets on step change):
 * - aiLoadingKey: which blank is loading AI
 * - aiLastRequestAtByKey: timestamps for AI cooldown per blank
 */
