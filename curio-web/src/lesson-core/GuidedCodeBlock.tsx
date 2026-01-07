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

// ---- Restored "JS-era" typed specs (range / sameAs / etc.) ----
type BlankTypedSpec =
  | { type: "identifier" }
  | { type: "range"; min?: number; max?: number }
  | { type: "number" }
  | { type: "sameAs"; targets: string[] }
  | { type: "string"; regex?: string }
  | { type?: string; values?: any[] }; // fallback: values list

type AnswerSpec = BlankRule | BlankTypedSpec | string[] | string;

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

function isPlainObject(x: any) {
  return x != null && typeof x === "object" && !Array.isArray(x);
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
          // Optionally normalize the directive so it still looks like a normal comment:
          // "code //<< note" -> "code // note"
          const normalized = s.replace("//<<", "//");
          codeTokens.push({ ...tok, content: normalized });
          continue;
        }

        // Otherwise: split to right column on normal "//"
        const before = s.slice(0, idx);

        // keep the comment text as-is (including the "//")
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
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

  // Control words: treat as text by default
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
// Blank evaluation (current TS rule format)
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

// ============================================================
// AnswerSpec evaluation (restores JS-era typed specs + arrays)
// ============================================================
function evalAnswerSpec(spec: AnswerSpec, value: string, allValues: Record<string, any>): boolean {
  const raw = String(value ?? "").trim();

  // arrays: ["begin", "start"]
if (Array.isArray(spec)) {
  return spec.some((entry) => evalAnswerSpec(entry as any, raw, allValues));
}


  // string shorthand: "begin"
  if (typeof spec === "string") {
    return raw === spec.trim();
  }

  // typed objects (old JS)
  if (isPlainObject(spec) && typeof (spec as any).type === "string") {
    const t = String((spec as any).type);

    switch (t) {
      case "identifier":
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);

      case "range": {
        const num = Number(raw);
        if (Number.isNaN(num)) return false;
        const min = (spec as any).min ?? -Infinity;
        const max = (spec as any).max ?? Infinity;
        return num >= min && num <= max;
      }

      case "number": {
        const num = Number(raw);
        return !Number.isNaN(num);
      }

case "sameAs": {
  const s: any = spec;

  // allow either target: "X" OR targets: ["X","Y","Z"]
  const targets: string[] = Array.isArray(s.targets)
    ? s.targets
    : typeof s.target === "string"
      ? [s.target]
      : [];

  if (targets.length === 0) return false;

  const normalizedUser = normalizeWs(raw);
  if (!normalizedUser) return false;

  return targets.some((t) => {
    const key = String(t ?? "").trim();
    if (!key) return false;

    const otherVal = normalizeWs(String(allValues?.[key] ?? ""));
    return otherVal !== "" && normalizedUser === otherVal;
  });
}


      case "string": {
        const re = (spec as any).regex;
        if (!raw) return false;
        if (typeof re === "string" && re.length > 0 && isValidRegex(re)) {
          return new RegExp(re).test(raw);
        }
        return true;
      }

      default: {
        const arr = Array.isArray((spec as any).values) ? (spec as any).values : [];
        return arr.some((v: any) => raw === String(v).trim());
      }
    }
  }

  // otherwise treat as BlankRule
  return evalBlank(spec as BlankRule, raw);
}

export default function GuidedCodeBlock({
  step,
  block,
  blockIndex,
  storageKey,
  globalKey, // (kept for signature compatibility)
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

  // answerKey can be: BlankRule | typed specs | arrays | strings
  const answerKey: Record<string, AnswerSpec> | null = block?.answerKey || step?.answerKey || null;

  const difficulties: Record<string, any> = step?.blankDifficulties || {};

  /* ==========================================================
     PERFORMANCE: localValues updates instantly (no parent setState per keystroke)
  ========================================================== */
  const [localValues, setLocalValues] = React.useState<Record<string, any>>(
    () => (mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {})
  );
  const localValuesRef = React.useRef(localValues);
  localValuesRef.current = localValues;

  // merge-in on navigation/restore WITHOUT clobbering current typing
  React.useEffect(() => {
    const safeMerged = mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {};
    setLocalValues((prev) => ({
      ...(prev || {}),
      ...safeMerged,
    }));
  }, [mergedBlanks]);

  // Parent local update (throttled) so sidebar "blank done" etc can reflect without global writes
  const pendingRef = React.useRef<Record<string, any>>({});
  const flushTimerRef = React.useRef<any>(null);

  function scheduleParentLocalUpdate(name: string, value: string) {
    if (!setLocalBlanks) return;
    if (typeof window === "undefined") return;

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
      if (flushTimerRef.current && typeof window !== "undefined") {
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
          const v = String((localValues || {})[t.name] ?? "");
          lineW += estimateTemplateTokenWidthPx(t, v.length);
        } else {
          lineW += estimateTemplateTokenWidthPx(t as any, 0);
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
      const secsLeft = Math.ceil((AI_COOLDOWN_MS - since) / 1000);
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: `Try again in about ${secsLeft} second${secsLeft === 1 ? "" : "s"} after thinking it through.`,
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

  // restore JS behavior: substitute filled blanks, strip ^^, keep unfixed blanks as _____
  const copyCode = async (raw: string) => {
    try {
      let textToCopy = String(raw || "");
      const values = localValuesRef.current || mergedBlanks || {};

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

  // restores typed specs + arrays + sameAs
  // counts attempts ONLY when wrong (per blank), matching your old JS comment
  const checkBlanks = () => {
    if (!answerKey) return;

    const values = localValuesRef.current || {};
    const nextStatus: Record<string, boolean> = {};
    const nextAttemptsByName = { ...(blankAttemptsByName || {}) };

    for (const [name, spec] of Object.entries(answerKey)) {
      const v = String(values[name] ?? "");
      const ok = evalAnswerSpec(spec, v, values);
      nextStatus[name] = ok;

      // wrong-only counting (so "attempts" means "wrong attempts")
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

    storageSetJson(`${storageKey}:blankStatus`, nextStatus);
    storageSetJson(`${storageKey}:blankAttemptsByName`, nextAttemptsByName);

    // optional: clear hint state if everything correct
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
