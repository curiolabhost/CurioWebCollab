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
// Copied from the original CodeLessonBase.js so GuidedCodeBlock renders identically.
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

const CODE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

/* ==========================================================
   FALLBACK STYLES
   If CodeLessonBase passes styles, those will override.
========================================================== */
const localStyles = StyleSheet.create({
  codeCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    maxWidth: 1200,
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

  // highlighted (WHITE) segments: ^^...^^
  codeHighlight: {
    color: "#cdced1ff",
    fontWeight: "400",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  // editable blanks in the code
  codeBlankInput: {
    minWidth: 20, // small default width
    paddingHorizontal: 0,
    paddingVertical: 0.5,
    marginHorizontal: 0,
    marginRight: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#5e6d8b6a",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center", // keeps typed text centered
    fontFamily: CODE_FONT,
    flexShrink: 0,
    color: "#a3a5a3ff",
  },

  codeBlankInputHighlight: {
    color: "#cdced1ff", // match highlighted code color
    borderBottomColor: "#5e6d8b6a", // lighter underline in highlight
    fontFamily: CODE_FONT,
  },

  blankCorrect: {
    borderBottomColor: "#16a34a", // green
  },

  blankIncorrect: {
    borderBottomColor: "#dc2626", // red
  },

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

  // --- Comment alignment/layout (copied from original) ---
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

  // --- Syntax color fallbacks (these get overridden by CodeLessonBase styles if passed) ---
  syntaxComment: { color: "#82a8abff" },
  syntaxString: { color: "#fca5a5" },
  syntaxNumber: { color: "#93c5fd" },
  syntaxType: { color: "#f9a8d4" },
  syntaxControl: { color: "#c4b5fd" },
  syntaxArduinoFunc: { color: "#fcd34d" },

  // --- Hint box fallbacks (copied-ish; your parent styles will override) ---
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
  styles, // <-- may be undefined or missing fields

  horizontalScroll = true,
}) {
  // ✅ Use passed styles if available, otherwise fall back
  // Merge so we keep ALL fallbacks (instead of replacing the whole object).
  const S = React.useMemo(
    () => ({ ...localStyles, ...(styles || {}) }),
    [styles]
  );

  const AI_COOLDOWN_MS = 8000;
  const MAX_HINT_LEVEL = 3;

  const code = block?.code || step?.code || "";
  const blockExplanations =
    block?.blankExplanations || step?.blankExplanations || null;

  const difficulties = step?.blankDifficulties || {};

  /* ==========================================================
     SYNTAX HIGHLIGHTING
  ========================================================== */
  const renderSyntaxHighlightedSegment = (text) => {
    if (!text) return null;

    const pieces = [];
    const regex =
      /(\b[A-Za-z_]\w*\b|\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\d+|\s+|[^\w\s]+)/g;

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
      else if (TYPE_KEYWORDS.includes(token)) style = S.syntaxType;
      else if (CONTROL_KEYWORDS.includes(token)) style = S.syntaxControl;
      else if (ARDUINO_FUNCS.includes(token)) style = S.syntaxArduinoFunc;
      else style = S.codeHighlight;

      pieces.push(
        <Text key={`seg-${idx++}`} style={style}>
          {token}
        </Text>
      );
    }

    return pieces;
  };

  /* ==========================================================
     COPY FUNCTION
  ========================================================== */
  const copyCode = async (rawCode) => {
    try {
      let textToCopy = rawCode || "";

      Object.entries(mergedBlanks || {}).forEach(([name, value]) => {
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
     AI HELP FOR A SPECIFIC BLANK (ported from CodeLessonBase)
  ========================================================== */
  const requestAiBlankHelpForBlank = async ({ blankName, code }) => {
    if (!step) return;
    if (!apiBaseUrl) return;

    const key = `${blockIndex}:${blankName}`;

    const usedHints = (aiHintLevelByBlank || {})[key] ?? 0;
    if (usedHints >= MAX_HINT_LEVEL) return;

    const studentAnswer = ((mergedBlanks || {})[blankName] ?? "").trim();
    const rule = step?.answerKey?.[blankName];
    if (!rule) return;

    const previousHintText = (aiHelpByBlank || {})[key] || null;

    const now = Date.now();
    const last = (aiLastRequestAtByKey || {})[key] || 0;
    if (now - last < AI_COOLDOWN_MS) {
      const secondsLeft = Math.ceil(
        (AI_COOLDOWN_MS - (now - last)) / 1000
      );

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
        allBlanks: mergedBlanks || {},
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
     CHECK WITH ANSWER KEY FUNCTION
  ========================================================== */
  const checkBlanks = async () => {
    if (!step?.answerKey) return;

    const nextAttempt = (checkAttempts || 0) + 1;
    setCheckAttempts?.((prev) => (prev || 0) + 1);

    const results = {};

    Object.entries(step.answerKey).forEach(([name, spec]) => {
      const raw = ((mergedBlanks || {})[name] ?? "").trim();
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
            const otherVal = (((mergedBlanks || {})[otherName]) ?? "").trim();
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
        const accepted = Array.isArray(spec)
          ? spec
          : spec != null
          ? [spec]
          : [];
        isCorrect = accepted.some((v) => raw === String(v).trim());
      }

      results[name] = isCorrect;
    });

    const nextBlankAttempts = { ...(blankAttemptsByName || {}) };
    Object.entries(results).forEach(([name, isCorrect]) => {
      if (!isCorrect) nextBlankAttempts[name] = (nextBlankAttempts[name] ?? 0) + 1;
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
        studentAnswer: (((mergedBlanks || {})[name]) ?? "").trim(),
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
     RENDER CODE WITH BLANKS (ported from CodeLessonBase)
     - This is what controls blank widths + comment alignment.
  ========================================================== */

  // Helpers for aligning // comments into a second column
  const CHAR_W = 8; // matches original width math (value.length * 8)

  const estimateTokenWidthPx = (tok) => {
    if (!tok) return 0;
    if (tok.type === "blank") return tok.width || 0;
    if (tok.type === "text") return (tok.content?.length || 0) * CHAR_W;
    return 0;
  };

  // Split a line into "code tokens" and a single "comment string"
  // Everything after the first `//` becomes the comment column.
  const splitLineAtComment = (lineTokens) => {
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
          const after = s.slice(idx); // includes //

          // If "before" is ONLY whitespace, this is a comment-only line.
          // Do NOT count that whitespace toward the code column width.
          if (before.trim().length > 0) {
            codeTokens.push({ ...tok, content: before });
            comment = after;
          } else {
            comment = after;
          }

          inComment = true;
          continue;
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
  };

  const renderCodeWithBlanks = (rawCode, bIndex, explanations) => {
    if (!rawCode) return null;

    const chunks = rawCode.split(/(\^\^[\s\S]*?\^\^)/g).filter(Boolean);
    const tokens = [];

    for (let chunk of chunks) {
      const isHighlight = chunk.startsWith("^^") && chunk.endsWith("^^");
      const inner = isHighlight ? chunk.slice(2, -2) : chunk;

      const parts = inner.split(/(__BLANK\[[A-Z0-9_]+\]__|\n)/g);

      for (let part of parts) {
        if (part === "\n") {
          tokens.push({ type: "newline" });
          continue;
        }
        if (!part) continue;

        const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
        if (blankMatch) {
          const name = blankMatch[1];
          const value = ((mergedBlanks || {})[name]) ?? "";
          const displayLength = value.length > 0 ? value.length : 1;

          tokens.push({
            type: "blank",
            name,
            value,
            // EXACT width logic from CodeLessonBase:
            width: Math.max(40, displayLength * 8 + 0),
            highlight: isHighlight,
          });
        } else {
          tokens.push({
            type: "text",
            highlight: isHighlight,
            content: part,
          });
        }
      }
    }

    const lines = [[]];
    tokens.forEach((tok) => {
      if (tok.type === "newline") lines.push([]);
      else lines[lines.length - 1].push(tok);
    });

    const lineSplits = lines.map(splitLineAtComment);

    const maxCodePx = Math.max(
      0,
      ...lineSplits.map(({ codeTokens }) =>
        codeTokens.reduce((sum, t) => sum + estimateTokenWidthPx(t), 0)
      )
    );

    // EXACT padding from CodeLessonBase:
    const CODE_COL_PX = maxCodePx + 12;

    return lineSplits.map(({ codeTokens, comment }, lineIdx) => {
      if (!codeTokens.length && !comment) {
        return (
          <View key={`line-${lineIdx}`} style={S.codeLineRow}>
            <View style={{ width: CODE_COL_PX }}>
              <Text style={S.codeNormal}>{" "}</Text>
            </View>
          </View>
        );
      }

      return (
        <View key={`line-${lineIdx}`} style={S.codeLineRow}>
          {/* LEFT: fixed-width code column */}
          <View style={[S.codePartCol, { width: CODE_COL_PX }]}>
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
                const status = (blankStatus || {})[tok.name];

                return (
                  <View key={`b-${lineIdx}-${idx}`} style={S.blankWithDot}>
                    <TextInput
                      value={tok.value}
                      onChangeText={(txt) => {
                        setLocalBlanks?.((prev) => ({ ...(prev || {}), [tok.name]: txt }));
                        setGlobalBlanks?.((prev) => ({ ...(prev || {}), [tok.name]: txt }));

                        setBlankStatus?.((prev) => {
                          const copy = { ...(prev || {}) };
                          delete copy[tok.name];
                          return copy;
                        });

                        setActiveBlankHint?.((prev) =>
                          prev &&
                          prev.name === tok.name &&
                          prev.blockIndex === bIndex
                            ? null
                            : prev
                        );

                        setAiHelpByBlank?.((prev) => {
                          const next = { ...(prev || {}) };
                          delete next[`${bIndex}:${tok.name}`];
                          return next;
                        });
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      style={[
                        S.codeBlankInput,
                        tok.highlight && S.codeBlankInputHighlight,
                        status === true && S.blankCorrect,
                        status === false && S.blankIncorrect,
                        { width: tok.width },
                      ]}
                    />

                    {status === false && (
                      <TouchableOpacity
                        style={S.errorDot}
                        onPress={() => {
                          const explanation =
                            (explanations && explanations[tok.name]) ||
                            (step?.blankExplanations && step.blankExplanations[tok.name]) ||
                            "Hint: Re-check what this blank represents.";

                          setActiveBlankHint?.({
                            name: tok.name,
                            text: explanation,
                            blockIndex: bIndex,
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

          {/* RIGHT: comment column (aligned) */}
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
    activeBlankHint &&
    activeBlankHint.blockIndex === blockIndex &&
    activeBlankHint.name
      ? `${blockIndex}:${activeBlankHint.name}`
      : null;

  const aiText =
    aiKey && Object.prototype.hasOwnProperty.call(aiHelpByBlank || {}, aiKey)
      ? (aiHelpByBlank || {})[aiKey]
      : null;

  const loadingThis = aiKey && aiLoadingKey === aiKey;

  const showHintBox =
    activeBlankHint && activeBlankHint.blockIndex === blockIndex;

  return (
    <>
      <View style={S.codeCard}>
        <View style={S.codeCardHeader}>
          <Text style={S.codeCardTitle}>Example Code</Text>

          <View style={S.codeCardHeaderActions || S.codeHeaderButtons}>
            {step?.answerKey && (
              <TouchableOpacity style={S.copyBtn} onPress={checkBlanks}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color="#cbd5e1"
                />
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={S.codeBox}>
              {renderCodeWithBlanks(code, blockIndex, blockExplanations)}
            </View>
          </ScrollView>
        ) : (
          <View style={S.codeBox}>
            {renderCodeWithBlanks(code, blockIndex, blockExplanations)}
          </View>
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
              <Text
                style={[
                  S.blankHintText,
                  { fontSize: 11, color: "#9ca3af", marginTop: 4 },
                ]}
              >
                More AI hints are allowed after you’ve thought it through for at
                least 6 seconds. You are allowed up to 3 hints per blank.
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
                <Text
                  style={[
                    S.blankHintText,
                    { fontStyle: "italic", color: "#6b7280" },
                  ]}
                >
                  Thinking…
                </Text>
              </>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {loadingThis ? (
              <ActivityIndicator
                size="small"
                color="#2563eb"
                style={{ marginRight: 8 }}
              />
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
