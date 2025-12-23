import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

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

// ✅ faster membership checks
const TYPE_SET = new Set(TYPE_KEYWORDS);
const CONTROL_SET = new Set(CONTROL_KEYWORDS);
const ARDUINO_SET = new Set(ARDUINO_FUNCS);

const CODE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

/* ==========================================================
   FALLBACK STYLES
========================================================== */
const localStyles = StyleSheet.create({
  codeCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },

    codeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  // left column wrapper
  codeLeft: {
    flexShrink: 0,
  },

  // right column placeholder (future panel)
  codeRight: {
    flex: 1,
    marginLeft: 12,
    minWidth: 220, // so it doesn't collapse too easily
  },

  codeCardHeader: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#0b1223",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2a44",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  codeCardTitle: { color: "#cbd5e1", fontWeight: "700", fontSize: 14 },
  codeCardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  codeHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  copyBtnText: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },

  codeBox: {
    padding: 14,
    overflow: "hidden",
  },

  codeNormal: {
    color: "#a3a5a3ff",
    fontWeight: "400",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  codeHighlight: {
    color: "#cdced1ff",
    fontWeight: "400",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  codeBlankInput: {
    minWidth: 20,
    paddingHorizontal: 0,
    paddingVertical: 0.5,
    marginHorizontal: 0,
    marginRight: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#5e6d8b6a",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: CODE_FONT,
    flexShrink: 0,
    color: "#a3a5a3ff",
  },

  codeBlankInputHighlight: {
    color: "#cdced1ff",
    borderBottomColor: "#5e6d8b6a",
    fontFamily: CODE_FONT,
  },

  blankCorrect: { borderBottomColor: "#16a34a" },
  blankIncorrect: { borderBottomColor: "#dc2626" },

  blankWithDot: {
    flexDirection: "row",
    alignItems: "center",
  },

  errorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
    marginLeft: 4,
  },

  codeLineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "nowrap",
  },

  codePartCol: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "nowrap",
  },

  codeCommentCol: {
    marginLeft: 5,
    color: "#82a8abff",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 0,
  },

  syntaxComment: {
    color: "#82a8abff",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  syntaxString: {
    color: "#fca5a5",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  syntaxNumber: {
    color: "#93c5fd",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  syntaxType: {
    color: "#f9a8d4",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  syntaxControl: {
    color: "#c4b5fd",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  syntaxArduinoFunc: {
    color: "#fcd34d",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  blankHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  hintContent: { flex: 1 },

  blankHintText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },

  aiHintDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
});

/* ==========================================================
   Small helpers
========================================================== */
const CHAR_W = 8;

function splitToTemplateTokens(rawCode) {
  // Template tokens DO NOT depend on values
  // Only store: newline / text / blank{name} / highlight flag.
  if (!rawCode) return [];

  const chunks = rawCode.split(/(\^\^[\s\S]*?\^\^)/g).filter(Boolean);
  const tokens = [];

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
  const lines = [[]];
  for (const tok of tokens) {
    if (tok.type === "newline") lines.push([]);
    else lines[lines.length - 1].push(tok);
  }
  return lines;
}

// Split a line into "code tokens" and "comment string" (template-level)
function splitLineAtCommentTemplate(lineTokens) {
  const codeTokens = [];
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

function estimateTemplateTokenWidthPx(tok, valueLen) {
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
  apiBaseUrl,
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
  styles,

  horizontalScroll = true,
}) {
  const S = React.useMemo(() => ({ ...localStyles, ...(styles || {}) }), [styles]);

  const AI_COOLDOWN_MS = 8000;
  const MAX_HINT_LEVEL = 3;

  const code = block?.code || step?.code || "";
  const blockExplanations = block?.blankExplanations || step?.blankExplanations || null;

  // ✅ answerKey can live on block OR step
  const answerKey = block?.answerKey || step?.answerKey || null;

  const difficulties = step?.blankDifficulties || {};

  /* ==========================================================
     SUPER IMPORTANT PERFORMANCE CHANGE:
     localValues updates instantly (no parent setState per keypress)
  ========================================================== */
  const [localValues, setLocalValues] = React.useState(() => mergedBlanks || {});
  const localValuesRef = React.useRef(localValues);
  localValuesRef.current = localValues;

  // If mergedBlanks changes due to navigation/restore, sync local values (but don’t fight typing)
  React.useEffect(() => {
    // Shallow merge so any new blanks appear, but keep what user is typing
    setLocalValues((prev) => ({ ...(mergedBlanks || {}), ...(prev || {}) }));
  }, [mergedBlanks]);

  // Optional: ultra-light parent local update (doesn't have to happen on every keypress)
  const rafRef = React.useRef(null);
  const scheduleParentLocalUpdate = React.useCallback(
    (name, value) => {
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
  const renderSyntaxHighlightedSegment = (text) => {
    if (!text) return null;

    const pieces = [];
    const regex = /(\b[A-Za-z_]\w*\b|\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\d+|\s+|[^\w\s]+)/g;

    let match;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      let style = S.codeHighlight;

      if (token.startsWith("//")) style = S.syntaxComment;
      else if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      )
        style = S.syntaxString;
      else if (/^\d/.test(token)) style = S.syntaxNumber;
      else if (TYPE_SET.has(token)) style = S.syntaxType;
      else if (CONTROL_SET.has(token)) style = S.syntaxControl;
      else if (ARDUINO_SET.has(token)) style = S.syntaxArduinoFunc;
      else style = S.codeHighlight;

      pieces.push(
        <Text key={`seg-${idx++}`} style={style}>
          {token}
        </Text>
      );
    }

    return pieces;
  };

  // ✅ NEW: if blank value EXACTLY matches a special token, apply syntax style
  const getCompletedBlankSyntaxStyle = (rawValue) => {
    const v = (rawValue ?? "").trim();
    if (!v) return null;

    if (TYPE_SET.has(v)) return S.syntaxType;
    if (CONTROL_SET.has(v)) return S.syntaxControl;
    if (ARDUINO_SET.has(v)) return S.syntaxArduinoFunc;

    return null;
  };

  /* ==========================================================
     COPY FUNCTION
  ========================================================== */
  const copyCode = async (rawCode) => {
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

      await Clipboard.setStringAsync(textToCopy);
    } catch (e) {
      console.warn("Failed to copy code:", e);
    }
  };

  /* ==========================================================
     AI HELP FOR A SPECIFIC BLANK
  ========================================================== */
  const requestAiBlankHelpForBlank = async ({ blankName, code }) => {
    if (!step) return;
    if (!apiBaseUrl) return;

    const key = `${blockIndex}:${blankName}`;

    const usedHints = (aiHintLevelByBlank || {})[key] ?? 0;
    if (usedHints >= MAX_HINT_LEVEL) return;

    const studentAnswer = ((localValuesRef.current || {})[blankName] ?? "").trim();
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
      codeSnippet: code || step?.code || null,
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

    const results = {};
    const values = localValuesRef.current || {};

    Object.entries(answerKey).forEach(([name, spec]) => {
      const raw = (values[name] ?? "").trim();
      let isCorrect = false;

      if (spec && typeof spec === "object" && !Array.isArray(spec)) {
        switch (spec.type) {
          case "identifier":
            isCorrect = /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);
            break;
          case "range": {
            const num = Number(raw);
            if (!Number.isNaN(num)) {
              const min = spec.min ?? -Infinity;
              const max = spec.max ?? Infinity;
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
            const otherName = spec.target;
            const otherVal = (values[otherName] ?? "").trim();
            isCorrect = raw !== "" && raw === otherVal;
            break;
          }
          case "string": {
            if (raw.length === 0) isCorrect = false;
            else if (spec.regex) isCorrect = new RegExp(spec.regex).test(raw);
            else isCorrect = true;
            break;
          }
          default: {
            if (Array.isArray(spec.values))
              isCorrect = spec.values.some((v) => raw === String(v).trim());
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
        studentAnswer: (values[name] ?? "").trim(),
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
     This is the huge perf win.
  ========================================================== */
  const templateLines = React.useMemo(() => splitToTemplateTokens(code), [code]);

  const templateLineSplits = React.useMemo(
    () => templateLines.map(splitLineAtCommentTemplate),
    [templateLines]
  );

  // Compute CODE_COL_PX from template + current values (cheap-ish)
  const codeColPx = React.useMemo(() => {
    // We only need max line width; use localValues (fast local state)
    const values = localValues || {};
    let maxCodePx = 0;

    for (const { codeTokens } of templateLineSplits) {
      let lineW = 0;
      for (const t of codeTokens) {
        if (t.type === "blank") {
          const v = (values[t.name] ?? "");
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
      if (!codeTokens.length && !comment) {
        return (
          <View key={`line-${lineIdx}`} style={S.codeLineRow}>
            <View style={{ width: codeColPx }}>
              <Text style={S.codeNormal}>{" "}</Text>
            </View>
          </View>
        );
      }

      return (
        <View key={`line-${lineIdx}`} style={S.codeLineRow}>
          <View style={[S.codePartCol, { width: codeColPx }]}>
            {codeTokens.map((tok, idx) => {
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
                  <Text key={`t-${lineIdx}-${idx}`} style={S.codeNormal}>
                    {textContent}
                  </Text>
                );
              }

              if (tok.type === "blank") {
                const name = tok.name;
                const val = values[name] ?? "";
                const status = (blankStatus || {})[name];
                const width = Math.max(40, Math.max(1, String(val).length) * CHAR_W);

                return (
                  <View key={`b-${lineIdx}-${idx}`} style={S.blankWithDot}>
                    <TextInput
                      value={String(val)}
                      onChangeText={(txt) => {
                        // ✅ instantaneous local update
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
                            delete copy[name];
                            return copy;
                          });
                        }
                      }}
                      onBlur={() => {
                        // ✅ commit to global only once
                        const committed = (localValuesRef.current || {})[name] ?? "";
                        setGlobalBlanks?.((prev) => ({
                          ...(prev || {}),
                          [name]: committed,
                        }));
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      style={[
                        S.codeBlankInput,
                        tok.highlight && S.codeBlankInputHighlight,
                        status === true && S.blankCorrect,
                        status === false && S.blankIncorrect,

                        // ✅ syntax color when FULL word matches special token
                        getCompletedBlankSyntaxStyle(val),

                        { width },
                      ]}
                    />

                    {status === false && (
                      <TouchableOpacity
                        style={S.errorDot}
                        onPress={() => {
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
                      />
                    )}
                  </View>
                );
              }

              return null;
            })}
          </View>

          {!!comment && (
            <Text style={S.codeCommentCol} numberOfLines={0} ellipsizeMode="clip">
              {comment}
            </Text>
          )}
        </View>
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

  const loadingThis = aiKey && aiLoadingKey === aiKey;
  const showHintBox = activeBlankHint && activeBlankHint.blockIndex === blockIndex;

  return (
    <>
      <View style={S.codeCard}>
        <View style={S.codeCardHeader}>
          <Text style={S.codeCardTitle}>Example Code</Text>

          <View style={S.codeCardHeaderActions || S.codeHeaderButtons}>
            {answerKey && (
              <TouchableOpacity style={S.copyBtn} onPress={checkBlanks}>
                <Ionicons name="checkmark-done-outline" size={16} color="#cbd5e1" />
                <Text style={S.copyBtnText}>Check Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={S.copyBtn} onPress={() => copyCode(code)}>
              <Ionicons name="copy-outline" size={16} color="#cbd5e1" />
              <Text style={S.copyBtnText}>Copy to Editor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {horizontalScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
            <View style={S.codeBox}>{renderCodeFromTemplate()}</View>
          </ScrollView>
        ) : (
          <View style={S.codeBox}>{renderCodeFromTemplate()}</View>
        )}
      </View>

      {showHintBox && (
        <View style={S.blankHintBox}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color="#b91c1c"
            style={{ marginRight: 8, marginTop: 2 }}
          />

          <View style={S.hintContent}>
            <Text style={S.blankHintText}>{activeBlankHint.text}</Text>

            {!aiText && !loadingThis && (
              <Text style={[S.blankHintText, { fontSize: 11, color: "#9ca3af", marginTop: 4 }]}>
                More AI hints are allowed after you’ve thought it through for at least 6 seconds.
                You are allowed up to 3 hints per blank.
              </Text>
            )}

            {aiText && (
              <>
                <View style={S.aiHintDivider} />
                <Text style={S.blankHintText}>{aiText}</Text>
              </>
            )}

            {!aiText && loadingThis && (
              <>
                <View style={S.aiHintDivider} />
                <Text style={[S.blankHintText, { fontStyle: "italic", color: "#6b7280" }]}>
                  Thinking…
                </Text>
              </>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {loadingThis ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
            ) : (
              <TouchableOpacity
                onPress={() =>
                  requestAiBlankHelpForBlank({
                    blankName: activeBlankHint.name,
                    code,
                  })
                }
                style={{ marginRight: 8 }}
              >
                <Ionicons name="help-circle-outline" size={18} color="#2563eb" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                setActiveBlankHint?.(null);
                setAiHelpByBlank?.((prev) => {
                  if (!aiKey) return prev;
                  const next = { ...(prev || {}) };
                  delete next[aiKey];
                  return next;
                });
              }}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}
