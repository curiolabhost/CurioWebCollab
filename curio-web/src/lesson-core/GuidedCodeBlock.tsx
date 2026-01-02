"use client";

import * as React from "react";
import styles from "./GuidedCodeBlock.module.css";

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

type BlankRule = {
  equals?: string;
  oneOf?: string[];
  contains?: string;
  matches?: string; // regex string
};

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

function nowMs() {
  return Date.now();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isProbablyNumberLiteral(s: string) {
  return /^[+-]?\d+(\.\d+)?$/.test(s.trim());
}

function isValidRegex(re: string) {
  try {
    // eslint-disable-next-line no-new
    new RegExp(re);
    return true;
  } catch {
    return false;
  }
}

function normalizeWs(s: string) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
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
    const blankStart = str.indexOf("__BLANK[", i);
    if (blankStart === i) {
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
  // Treat "//" as starting comment, but only in text tokens and outside highlight logic.
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
        const before = s.slice(0, idx);
        const after = s.slice(idx);

        if (before.trim().length > 0) {
          codeTokens.push({ ...tok, content: before });
          comment = after;
        } else {
          comment = after;
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
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const KEYWORD_RE = new RegExp(
  `\\b(${[
    ...TYPE_KEYWORDS,
    ...CONTROL_KEYWORDS,
    ...ARDUINO_BUILTINS.filter((k) => k !== "Serial"),
  ]
    .map(escapeRegex)
    .join("|")})\\b`,
  "g"
);

const PRE_RE = new RegExp(`^\\s*(${PREPROCESSOR_KEYWORDS.map(escapeRegex).join("|")})\\b`);

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
  const normalized = String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');

  const pieces: React.ReactNode[] = [];

  // KEY FIX:
  // - Keep the quoted-string patterns
  // - BUT make the final fallback punctuation match ONE char, not many,
  //   so it doesn't swallow braces+quotes (e.g., "{'") or "', '"
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
  // remove common surrounding punctuation
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

  // Strings (keep before wrapper stripping)
  if (isQuotedLiteral(trimmed)) return "string";

  const core = stripOuterWrappers(trimmed);

  // Preprocessor / Comment
  if (core.startsWith("#")) return "pre";
  if (core.startsWith("//")) return "comment";

  // Bool
  if (/^(true|false)$/i.test(core)) return "bool";

  // Numbers
  if (isNumberLiteral(core)) return "number";

  // Builtins: allow Serial.print style or direct matches
  const serialMember = core.match(/^Serial\.(begin|print|println)$/);
  if (serialMember) return "builtin";

  if (ARDUINO_SET.has(core)) return "builtin";

  // Types
  if (TYPE_SET.has(core)) return "type";

  // Optional: treat control keywords as "text" or "type" — up to you.
  // If you want a dedicated styling for control words, add a blankSyntaxControl class.
  // For now, we’ll just return text.
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

// ============================================================
// Blank evaluation
// ============================================================
function evalBlank(rule: BlankRule, value: string): boolean {
  const v = String(value ?? "");

  if (!rule) return false;

  if (typeof rule.equals === "string") {
    return normalizeWs(v) === normalizeWs(rule.equals);
  }

  if (Array.isArray(rule.oneOf)) {
    const nv = normalizeWs(v);
    return rule.oneOf.some((x) => normalizeWs(x) === nv);
  }

  if (typeof rule.contains === "string") {
    return normalizeWs(v).includes(normalizeWs(rule.contains));
  }

  if (typeof rule.matches === "string" && isValidRegex(rule.matches)) {
    const re = new RegExp(rule.matches);
    return re.test(v);
  }

  return false;
}



export default function GuidedCodeBlock({
  step,
  block,
  blockIndex,
  storageKey,
  globalKey,
  apiBaseUrl = "http://localhost:4000",
  analyticsTag,

  mergedBlanks,
  setLocalBlanks,
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

  // ✅ answerKey can live on block OR step
  const answerKey: Record<string, BlankRule> | null = block?.answerKey || step?.answerKey || null;

  const difficulties: Record<string, any> = step?.blankDifficulties || {};

  /* ==========================================================
     PERFORMANCE: localValues updates instantly (no parent setState per keystroke)
  ========================================================== */
  const [localValues, setLocalValues] = React.useState<Record<string, any>>(
    () => (mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {})
  );
  const localValuesRef = React.useRef(localValues);
  localValuesRef.current = localValues;

  // If mergedBlanks changes due to navigation/restore, sync local values (but don’t fight typing)
  React.useEffect(() => {
    const safeMerged = mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {};
    setLocalValues(safeMerged);
  }, [mergedBlanks]);

  // Parent local update (throttled) so sidebar "blank done" etc can reflect without global writes
  const pendingRef = React.useRef<Record<string, any>>({});
  const flushTimerRef = React.useRef<any>(null);

  function scheduleParentLocalUpdate(name: string, value: string) {
    if (!setLocalBlanks) return;

    pendingRef.current[name] = value;

    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      const patch = pendingRef.current;
      pendingRef.current = {};
      flushTimerRef.current = null;

      setLocalBlanks((prev) => ({
        ...(prev || {}),
        ...patch,
      }));
    }, 200);
  }

  React.useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  /* ==========================================================
     Tokenize once per code change
  ========================================================== */
const templateLineSplits = React.useMemo(() => {
  const rawLines = String(code || "").replace(/\r\n/g, "\n").split("\n");

  let inHi = false; // <- carry across lines
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
          const v = String((localValues || {})[t.name] ?? "");
          lineW += estimateTemplateTokenWidthPx(t, v.length);
        } else {
          lineW += estimateTemplateTokenWidthPx(t, 0);
        }
      }
      if (lineW > maxCodePx) maxCodePx = lineW;
    }

    return maxCodePx + 12;
  }, [templateLineSplits, localValues]);

  /* ==========================================================
     RENDER CODE FROM TEMPLATE (NO re-tokenize per keystroke)
  ========================================================== */
  const renderCodeFromTemplate = () => {
    const values = localValues || {};

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

                          // instant local update
                          setLocalValues((prev) => ({
                            ...(prev || {}),
                            [name]: txt,
                          }));

                          // optional: lightweight parent local update (not global)
                          scheduleParentLocalUpdate(name, txt);

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
                          // commit to global only once
                          const committed = String((localValuesRef.current || {})[name] ?? "");
                          setGlobalBlanks?.((prev) => ({
                            ...(prev || {}),
                            [name]: committed,
                          }));
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

  const requestAiBlankHelpForBlank = async ({
    blankName,
    code: fullCode,
  }: {
    blankName: string;
    code: string;
  }) => {
    if (!blankName) return;

    const key = `${blockIndex}:${blankName}`;
    const lastAt = (aiLastRequestAtByKey || {})[key] ?? 0;
    const since = nowMs() - lastAt;

    // cooldown
    if (since < AI_COOLDOWN_MS) {
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: `Try again in ${(AI_COOLDOWN_MS - since) / 1000}s after thinking it through.`,
      }));
      return;
    }

    // hint level cap
    const lvl = (aiHintLevelByBlank || {})[key] ?? 0;
    if (lvl >= MAX_HINT_LEVEL) {
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: "You’ve reached the maximum number of AI hints for this blank.",
      }));
      return;
    }

    setAiLoadingKey?.(key);

    try {
      const payload = {
        blankName,
        userValue: String((localValuesRef.current || {})[blankName] ?? ""),
        code: String(fullCode || ""),
        explanations: blockExplanations || {},
        lessonPhrase: step?.phrase || "",
        stepTitle: step?.title || "",
        analyticsTag: analyticsTag || "",
      };

      const res = await fetch(`${apiBaseUrl}/api/lesson/blank-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      const hintText = String(data?.hint || data?.message || "No hint returned.");

      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: hintText,
      }));

      setAiHintLevelByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: lvl + 1,
      }));

      setAiLastRequestAtByKey?.((prev) => ({
        ...(prev || {}),
        [key]: nowMs(),
      }));

      logBlankAnalytics?.({
        type: "ai_hint",
        blankName,
        blockIndex,
        level: lvl + 1,
        tag: analyticsTag,
      });
    } catch (e: any) {
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: `Error requesting AI hint: ${String(e?.message || e)}`,
      }));
    } finally {
      setAiLoadingKey?.(null);
    }
  };

  const copyCode = async (raw: string) => {
    const plain = String(raw || "")
      .replace(/\^\^/g, "")
      .replace(/__BLANK\[[^\]]+\]__/g, "_____");

    try {
      await navigator.clipboard.writeText(plain);
    } catch {
      // ignore
    }
  };

  const checkBlanks = () => {
    if (!answerKey) return;

    const values = localValuesRef.current || {};
    const nextStatus: Record<string, boolean> = {};
    const nextAttemptsByName = { ...(blankAttemptsByName || {}) };

    for (const [name, rule] of Object.entries(answerKey)) {
      const v = String(values[name] ?? "");
      const ok = evalBlank(rule as BlankRule, v);
      nextStatus[name] = ok;

      nextAttemptsByName[name] = (nextAttemptsByName[name] || 0) + 1;

      logBlankAnalytics?.({
        type: "check_blank",
        blankName: name,
        ok,
        attempt: nextAttemptsByName[name],
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

    // persist attempts/status in step storage as well (optional)
    storageSetJson(`${storageKey}:blankStatus`, nextStatus);
    storageSetJson(`${storageKey}:blankAttemptsByName`, nextAttemptsByName);
  };

  return (
    <>
      <div className={styles.codeCard}>
        <div className={styles.codeCardHeader}>
          {/*  allow per-block title instead of always "Example Code" */}
          <div className={styles.codeCardTitle}>
            {String(block?.title || step?.codeTitle || "Example Code")}
          </div>

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
                More AI hints are allowed after you’ve thought it through for at least 6 seconds.
                You are allowed up to 3 hints per blank.
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
