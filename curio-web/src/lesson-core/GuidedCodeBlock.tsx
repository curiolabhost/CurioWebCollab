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
  "if",
  "else",
  "#define",
  "#include",
];

const ARDUINO_FUNCS = [
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
  "Serial.begin",
  "Serial.print",
  "Serial.println",
  "HIGH",
  "LOW",
  "INPUT",
  "OUTPUT",
  "INPUT_PULLUP",
];

const TYPE_SET = new Set(TYPE_KEYWORDS);
const CONTROL_SET = new Set(CONTROL_KEYWORDS);
const ARDUINO_SET = new Set(ARDUINO_FUNCS);

const CHAR_W = 8.6;

type BlankRule =
  | string
  | number
  | Array<string | number>
  | {
      type?: "identifier" | "range" | "number" | "sameAs" | "string";
      min?: number;
      max?: number;
      target?: string;
      regex?: string;
      values?: Array<string | number>;
    };

type Props = {
  step: any;
  block: any;
  blockIndex: number;
  storageKey?: string;
  globalKey?: string;
  apiBaseUrl?: string;
  analyticsTag?: string;

  mergedBlanks: Record<string, any>;
  setLocalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setGlobalBlanks?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  blankStatus?: Record<string, boolean>;
  setBlankStatus?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  activeBlankHint?: any;
  setActiveBlankHint?: React.Dispatch<React.SetStateAction<any>>;

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

  logBlankAnalytics?: (event: any) => void;

  horizontalScroll?: boolean;
};

type TemplateTok =
  | { type: "text"; content: string; highlight: boolean }
  | { type: "blank"; name: string; highlight: boolean }
  | { type: "newline" };

function splitToTemplateTokens(rawCode: string): TemplateTok[][] {
  if (!rawCode) return [];

  const chunks = rawCode.split(/(\^\^[\s\S]*?\^\^)/g).filter(Boolean);
  const tokens: TemplateTok[] = [];

  for (const chunk of chunks) {
    const isHighlight = chunk.startsWith("^^") && chunk.endsWith("^^");
    const inner = isHighlight ? chunk.slice(2, -2) : chunk;

    const parts = inner.split(/(__BLANK\[[A-Z0-9_]+\]__|\n)/g);

    for (const part of parts) {
      if (part === "\n") {
        tokens.push({ type: "newline" });
        continue;
      }
      if (!part) continue;

      const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
      if (blankMatch) {
        tokens.push({
          type: "blank",
          name: blankMatch[1],
          highlight: isHighlight,
        });
      } else {
        tokens.push({
          type: "text",
          content: part,
          highlight: isHighlight,
        });
      }
    }
  }

  // Group into lines
  const lines: TemplateTok[][] = [[]];
  for (const tok of tokens) {
    if (tok.type === "newline") lines.push([]);
    else lines[lines.length - 1].push(tok);
  }
  return lines;
}

// Split a line into "code tokens" and "comment string" (template-level)
function splitLineAtCommentTemplate(lineTokens: TemplateTok[]) {
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
  const answerKey: Record<string, BlankRule> | null =
    block?.answerKey || step?.answerKey || null;

  const difficulties: Record<string, any> = step?.blankDifficulties || {};

  /* ==========================================================
     PERFORMANCE: localValues updates instantly (no parent setState per keypress)
  ========================================================== */
  const [localValues, setLocalValues] = React.useState<Record<string, any>>(
    () => (mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {})
  );
  const localValuesRef = React.useRef(localValues);
  localValuesRef.current = localValues;

  // If mergedBlanks changes due to navigation/restore, sync local values (but don’t fight typing)
  React.useEffect(() => {
    const safeMerged =
      mergedBlanks && typeof mergedBlanks === "object" ? mergedBlanks : {};
    setLocalValues((prev) => ({ ...safeMerged, ...(prev || {}) }));
  }, [mergedBlanks]);

  // Optional: ultra-light parent local update (doesn't have to happen on every keypress)
  const rafRef = React.useRef<number | null>(null);
  const scheduleParentLocalUpdate = React.useCallback(
    (name: string, value: string) => {
      if (!setLocalBlanks) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setLocalBlanks((prev) => ({ ...(prev || {}), [name]: value }));
      });
    },
    [setLocalBlanks]
  );

  /* ==========================================================
     SYNTAX HIGHLIGHTING
  ========================================================== */
  const renderSyntaxHighlightedSegment = (text: string) => {
    if (!text) return null;

    const pieces: React.ReactNode[] = [];
    const regex =
      /(\b[A-Za-z_]\w*\b|\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\d+|\s+|[^\w\s]+)/g;

    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      let cls = styles.codeHighlight;

      if (token.startsWith("//")) cls = styles.syntaxComment;
      else if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      )
        cls = styles.syntaxString;
      else if (/^\d/.test(token)) cls = styles.syntaxNumber;
      else if (TYPE_SET.has(token)) cls = styles.syntaxType;
      else if (CONTROL_SET.has(token)) cls = styles.syntaxControl;
      else if (ARDUINO_SET.has(token)) cls = styles.syntaxArduinoFunc;

      pieces.push(
        <span key={`seg-${idx++}`} className={cls}>
          {token}
        </span>
      );
    }

    return pieces;
  };

  // If blank value EXACTLY matches a special token, apply syntax style
  const getCompletedBlankSyntaxClass = (rawValue: any) => {
    const v = String(rawValue ?? "").trim();
    if (!v) return "";

    if (TYPE_SET.has(v)) return styles.syntaxType;
    if (CONTROL_SET.has(v)) return styles.syntaxControl;
    if (ARDUINO_SET.has(v)) return styles.syntaxArduinoFunc;

    return "";
  };

  /* ==========================================================
     COPY FUNCTION (fills blanks + strips ^^)
  ========================================================== */
  const copyCode = async (rawCode: string) => {
    try {
      let textToCopy = rawCode || "";

      const values = localValuesRef.current || mergedBlanks || {};
      Object.entries(values || {}).forEach(([name, value]) => {
        const placeholder = `__BLANK[${name}]__`;
        const replacement =
          value && String(value).trim().length > 0 ? String(value) : "_____";
        textToCopy = textToCopy.split(placeholder).join(replacement);
      });

      textToCopy = textToCopy.replace(/__BLANK\[[A-Z0-9_]+\]__/g, "_____");
      textToCopy = textToCopy.replace(/\^\^/g, "");

      await navigator.clipboard.writeText(textToCopy);
    } catch (e) {
      console.warn("Failed to copy code:", e);
    }
  };

  /* ==========================================================
     AI HELP FOR A SPECIFIC BLANK
  ========================================================== */
  const requestAiBlankHelpForBlank = async ({
    blankName,
    code: codeForPayload,
  }: {
    blankName: string;
    code: string;
  }) => {
    if (!step) return;
    if (!apiBaseUrl) return;

    const key = `${blockIndex}:${blankName}`;

    const usedHints = (aiHintLevelByBlank || {})[key] ?? 0;
    if (usedHints >= MAX_HINT_LEVEL) return;

    const studentAnswer = String((localValuesRef.current || {})[blankName] ?? "").trim();
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

    let mode = "gentle_nudge";
    if (upcomingHintNumber === 2) mode = "conceptual_explanation";
    else if (upcomingHintNumber === 3) mode = "analogy_based";

    const payload = {
      lessonId: step?.id,
      title: step?.title,
      description: step?.desc || null,
      codeSnippet: codeForPayload || step?.code || null,
      blank: {
        name: blankName,
        studentAnswer,
        rule,
        allBlanks: localValuesRef.current || {},
        previousHint: previousHintText,
      },
      mode,
      hintLevel: upcomingHintNumber,
    };

    try {
      setAiLoadingKey?.(key);
      setAiLastRequestAtByKey?.((prev) => ({
        ...(prev || {}),
        [key]: now,
      }));

      const res = await fetch(`${apiBaseUrl}/api/blank-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("AI help request failed");

      const data = await res.json();
      if (!data || !data.explanation) return;

      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: data.explanation,
      }));

      setAiHintLevelByBlank?.((prev) => ({
        ...(prev || {}),
        [key]: upcomingHintNumber,
      }));

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
    } catch (err) {
      console.warn("AI blank help error:", err);
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]:
          (prev || {})[key] ||
          "I had trouble generating more help right now. Try adjusting your answer slightly and re-checking.",
      }));
    } finally {
      setAiLoadingKey?.((prev) => (prev === key ? null : prev));
    }
  };

  /* ==========================================================
     CHECK FUNCTION
  ========================================================== */
  const checkBlanks = async () => {
    if (!answerKey) return;

    const nextAttempt = (checkAttempts || 0) + 1;
    setCheckAttempts?.((prev) => (prev || 0) + 1);

    const results: Record<string, boolean> = {};
    const values = localValuesRef.current || {};

    Object.entries(answerKey).forEach(([name, spec]) => {
      const raw = String(values[name] ?? "").trim();
      let isCorrect = false;

      if (spec && typeof spec === "object" && !Array.isArray(spec)) {
        const s = spec as any;

        switch (s.type) {
          case "identifier":
            isCorrect = /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);
            break;
          case "range": {
            const num = Number(raw);
            if (!Number.isNaN(num)) {
              const min = s.min ?? -Infinity;
              const max = s.max ?? Infinity;
              isCorrect = num >= min && num <= max;
            }
            break;
          }
          case "number": {
            const num = Number(raw);
            isCorrect = !Number.isNaN(num);
            break;
          }
          case "sameAs": {
            const otherName = s.target;
            const otherVal = String(values[otherName] ?? "").trim();
            isCorrect = raw !== "" && raw === otherVal;
            break;
          }
          case "string": {
            if (raw.length === 0) isCorrect = false;
            else if (s.regex) isCorrect = new RegExp(s.regex).test(raw);
            else isCorrect = true;
            break;
          }
          default: {
            if (Array.isArray(s.values))
              isCorrect = s.values.some((v: any) => raw === String(v).trim());
            else isCorrect = false;
          }
        }
      } else {
        const accepted = Array.isArray(spec) ? spec : spec != null ? [spec] : [];
        isCorrect = accepted.some((v) => raw === String(v).trim());
      }

      results[name] = isCorrect;
    });

    const nextBlankAttempts = { ...(blankAttemptsByName || {}) };
    Object.entries(results).forEach(([name, ok]) => {
      if (!ok) nextBlankAttempts[name] = (nextBlankAttempts[name] ?? 0) + 1;
    });

    setBlankAttemptsByName?.(nextBlankAttempts);
    setBlankStatus?.(results);

    const incorrectNames = Object.entries(results)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);

    logBlankAnalytics?.({
      type: "CHECK_BLANKS",
      attempt: nextAttempt,
      results,
      blanks: Object.entries(results).map(([name, isCorrect]) => ({
        name,
        isCorrect,
        studentAnswer: String(values[name] ?? "").trim(),
        difficulty: difficulties[name] || null,
        attemptsForThisBlank: nextBlankAttempts[name] ?? 0,
      })),
      incorrectBlanks: incorrectNames,
      analyticsTag: analyticsTag || null,
      stepId: step?.id,
      stepTitle: step?.title,
      storageKey: storageKey || null,
      globalKey: globalKey || null,
    });

    if (incorrectNames.length === 0) {
      setActiveBlankHint?.(null);
      setAiHelpByBlank?.({});
    }
  };

  /* ==========================================================
     TEMPLATE PARSING (ONCE) + COMMENT SPLITS (ONCE)
  ========================================================== */
  const templateLines = React.useMemo(() => splitToTemplateTokens(code), [code]);

  const templateLineSplits = React.useMemo(
    () => templateLines.map(splitLineAtCommentTemplate),
    [templateLines]
  );

  // Compute CODE_COL_PX from template + current values (cheap-ish)
  const codeColPx = React.useMemo(() => {
    const values = localValues || {};
    let maxCodePx = 0;

    for (const { codeTokens } of templateLineSplits) {
      let lineW = 0;
      for (const t of codeTokens) {
        if (t.type === "blank") {
          const v = String(values[t.name] ?? "");
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
                  const width = Math.max(40, Math.max(1, val.length) * CHAR_W);

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

                          // ✅ instant local update
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
                          // ✅ commit to global only once
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

  return (
    <>
      <div className={styles.codeCard}>
        <div className={styles.codeCardHeader}>
          <div className={styles.codeCardTitle}>Example Code</div>

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
            <div className={styles.blankHintText}>{activeBlankHint.text}</div>

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
                    blankName: activeBlankHint.name,
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
