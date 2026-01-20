"use client";

import * as React from "react";
import styles from "./GuidedCodeBlock.module.css";

// keep ONLY these from the shared util
import { type AnswerSpec, evalAnswerSpec, BlankRule, BlankTypedSpec } from "./blankCheckUtils";

// --- Simple Arduino-style syntax groups for example boxes ---
const TYPE_KEYWORDS = [
  "void",
  "int",
  "long",
  "float",
  "double",
  "char",
  "bool",
  "boolean",
  "unsigned",
  "short",
  "byte",
  "word",
  "String",
  "static",
  "const",
];

const CONTROL_KEYWORDS = [
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "return",
  "if",
  "else",
];

const PREPROCESSOR_KEYWORDS = ["#include", "#define", "#ifdef", "#ifndef", "#endif"];

const ARDUINO_BUILTINS = [
  "setup",
  "loop",
  "pinMode",
  "digitalWrite",
  "digitalRead",
  "analogWrite",
  "analogRead",
  "delay",
  "millis",
  "micros",
  "Serial",
  "begin",
  "print",
  "println",
  "display",
  "clearDisplay",
  "setCursor",
  "setTextSize",
  "setTextColor",
  "drawRect",
  "drawLine",
  "drawCircle",
  "fillRect",
  "fillCircle",
  "display",
];

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

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
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

function nowMs() {
  return Date.now();
}

// ============================================================
// Template parsing: ^^...^^ highlight segments, __BLANK[NAME]__ blanks
// ============================================================
type TemplateTok =
  | { type: "text"; content: string; highlight?: boolean }
  | { type: "blank"; name: string; highlight?: boolean };

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

    // Otherwise, consume until next special token
    const nextHi = str.indexOf("^^", i);
    const nextBlank = str.indexOf("__BLANK[", i);

    let next = -1;
    if (nextHi !== -1 && nextBlank !== -1) next = Math.min(nextHi, nextBlank);
    else if (nextHi !== -1) next = nextHi;
    else if (nextBlank !== -1) next = nextBlank;

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

    if (tok.type === "blank") {
      codeTokens.push(tok);
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

// ============================================================
// Syntax highlighting for "^^...^^" segments (simple keyword coloring)
// ============================================================

// --- keep these sets somewhere above (same as original) ---
const TYPE_SET = new Set(TYPE_KEYWORDS);
const CONTROL_SET = new Set(CONTROL_KEYWORDS);
const ARDUINO_SET = new Set(ARDUINO_BUILTINS);

// ==========================================================
// SYNTAX HIGHLIGHTING (RESTORED)
// ==========================================================
function renderSyntaxHighlightedSegment(text: string) {
  if (!text) return null;

  // Normalize curly quotes → straight quotes so strings tokenize correctly
  const normalized = String(text).replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

  const pieces: React.ReactNode[] = [];

  const regex =
    /(#\s*(?:include|define|ifdef|ifndef|endif|elif|else|pragma|error|warning)\b|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|[+-]?\d+(?:\.\d+)?|\b[A-Za-z_]\w*\b|\s+|[^\w\s])/g;

  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(normalized)) !== null) {
    const token = match[0];

    let cls = styles.codeHighlight;

    if (token.startsWith("//")) {
      cls = styles.syntaxComment;
    } else if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      cls = styles.syntaxString;
    } else if (/^[+-]?\d/.test(token)) {
      cls = styles.syntaxNumber;
    } else if (TYPE_SET.has(token)) {
      cls = styles.syntaxType;
    } else if (CONTROL_SET.has(token)) {
      cls = styles.syntaxControl;
    } else if (ARDUINO_SET.has(token)) {
      cls = styles.syntaxArduinoFunc;
    } else if (token.trim().startsWith("#")) {
      cls = styles.syntaxPreprocessor;
    }

    pieces.push(
      <span key={`seg-${idx++}`} className={cls}>
        {token}
      </span>
    );
  }

  return pieces;
}

function stripOuterWrappers(s: string) {
  let t = String(s ?? "").trim();
  t = t.replace(/^[([{\s]+/g, "").replace(/[;,)\]}]+$/g, "").trim();
  return t;
}

function isQuotedLiteral(s: string) {
  const t = String(s ?? "").trim();
  return (
    (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) ||
    (t.length >= 2 && t.startsWith("'") && t.endsWith("'"))
  );
}

function isNumberLiteral(s: string) {
  return /^[+-]?\d+(\.\d+)?$/.test(String(s ?? "").trim());
}

function computeSyntaxTag(v: any) {
  const raw = String(v ?? "");
  const trimmed = raw.trim();
  if (!trimmed) return "empty";

  if (isQuotedLiteral(trimmed)) return "string";

  const core = stripOuterWrappers(trimmed);

  if (core.startsWith("#")) return "pre";
  if (core.startsWith("//")) return "comment";

  if (/^(true|false)$/i.test(core)) return "bool";

  if (isNumberLiteral(core)) return "number";

  const serialMember = core.match(/^Serial\.(begin|print|println)$/);
  if (serialMember) return "builtin";

  if (ARDUINO_SET.has(core)) return "builtin";

  if (TYPE_SET.has(core)) return "type";

  if (CONTROL_SET.has(core)) return "text";

  return "text";
}

function getCompletedBlankSyntaxClass(v: any) {
  const tag = computeSyntaxTag(v);
  switch (tag) {
    case "pre":
      return styles.blankSyntaxPre;
    case "comment":
      return styles.blankSyntaxComment;
    case "string":
      return styles.blankSyntaxString;
    case "number":
      return styles.blankSyntaxNumber;
    case "bool":
      return styles.blankSyntaxBool;
    case "builtin":
      return styles.blankSyntaxBuiltin;
    case "type":
      return styles.blankSyntaxType;
    default:
      return styles.blankSyntaxText;
  }
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
      return (
        <div key={`line-${lineIdx}`} className={styles.codeLineRow}>
          <div className={styles.codePartCol} style={{ width: codeColPx }}>
            {emptyLine ? (
              <span className={styles.codeNormal}>{" "}</span>
            ) : (
              codeTokens.map((tok, idx) => {
                if (tok.type === "text") {
                  const textContent = tok.content;

                  if (tok.highlight) {
                    return (
                      <React.Fragment key={`t-${lineIdx}-${idx}`}>
                        {renderSyntaxHighlightedSegment(textContent)}
                      </React.Fragment>
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
                    getCompletedBlankSyntaxClass(val),
                  ]
                    .filter(Boolean)
                    .join(" ");

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

                return null;
              })
            )}
          </div>

          {!!comment && <span className={styles.codeCommentCol}>{comment}</span>}
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

  // restore JS behavior: substitute filled blanks, strip ^^, keep unfixed blanks as _____
  const copyCode = async (raw: string) => {
    try {
      let textToCopy = String(raw || "");
      const values = draftRef.current || mergedBlanks || {};

      for (const [name, value] of Object.entries(values || {})) {
        const placeholder = `__BLANK[${name}]__`;
        const replacement = value && String(value).trim().length > 0 ? String(value) : "_____";
        textToCopy = textToCopy.split(placeholder).join(replacement);
      }

      textToCopy = textToCopy.replace(/__BLANK\[[A-Z0-9_]+\]__/g, "_____");
      textToCopy = textToCopy.replace(/\^\^/g, "");

      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // ignore
    }
  };

  // counts attempts ONLY when wrong (per blank)
  const checkBlanks = () => {
    if (!answerKey) return;

    // ensure we don't validate stale keystrokes that haven't flushed yet
    flushGlobalNow();

    const values = draftRef.current || {};
    const nextStatus: Record<string, boolean> = {};
    const nextAttemptsByName = { ...(blankAttemptsByName || {}) };

    for (const [name, spec] of Object.entries(answerKey)) {
      const v = String(values[name] ?? "");
      const ok = evalAnswerSpec(spec, v, values);
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
