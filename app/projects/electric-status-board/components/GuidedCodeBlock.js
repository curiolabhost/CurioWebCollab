// GuidedCodeBlock.js
// Codebox rendering, blanks, check, copy, and AI hint controls.

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

const CODE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

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
  const AI_COOLDOWN_MS = 8000; // 8 seconds between AI hints per blank
  const MAX_HINT_LEVEL = 3; // max AI hint depth (1..3)

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
      let style = styles?.codeHighlight;

      if (token.startsWith("//")) {
        style = styles?.syntaxComment;
      } else if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        style = styles?.syntaxString;
      } else if (/^\d/.test(token)) {
        style = styles?.syntaxNumber;
      } else if (TYPE_KEYWORDS.includes(token)) {
        style = styles?.syntaxType;
      } else if (CONTROL_KEYWORDS.includes(token)) {
        style = styles?.syntaxControl;
      } else if (ARDUINO_FUNCS.includes(token)) {
        style = styles?.syntaxArduinoFunc;
      } else {
        style = styles?.codeHighlight || { fontFamily: CODE_FONT };
      }

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
     CHECK WITH ANSWER KEY FUNCTION
  ========================================================== */
  const checkBlanks = async () => {
    if (!step?.answerKey) return;

    const nextAttempt = (checkAttempts || 0) + 1;
    setCheckAttempts?.((prev) => (prev || 0) + 1);

    const results = {};

    Object.entries(step.answerKey).forEach(([name, spec]) => {
      const raw = (mergedBlanks?.[name] ?? "").trim();
      let isCorrect = false;

      if (spec && typeof spec === "object" && !Array.isArray(spec)) {
        switch (spec.type) {
          case "identifier": {
            isCorrect = /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);
            break;
          }
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
            const otherVal = (mergedBlanks?.[otherName] ?? "").trim();
            isCorrect = raw !== "" && raw === otherVal;
            break;
          }
          case "string": {
            if (raw.length === 0) {
              isCorrect = false;
            } else if (spec.regex) {
              const re = new RegExp(spec.regex);
              isCorrect = re.test(raw);
            } else {
              isCorrect = true;
            }
            break;
          }
          default: {
            if (Array.isArray(spec.values)) {
              isCorrect = spec.values.some((v) => raw === String(v).trim());
            } else {
              isCorrect = false;
            }
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
      if (!isCorrect) {
        const prevCount = nextBlankAttempts[name] ?? 0;
        nextBlankAttempts[name] = prevCount + 1;
      }
    });

    setBlankAttemptsByName?.(nextBlankAttempts);

    setBlankStatus?.(results);

    const incorrectNames = Object.entries(results)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);

    const payload = {
      type: "CHECK_BLANKS",
      attempt: nextAttempt,
      results,
      blanks: Object.entries(results).map(([name, isCorrect]) => ({
        name,
        isCorrect,
        studentAnswer: (mergedBlanks?.[name] ?? "").trim(),
        difficulty: difficulties[name] || null,
        attemptsForThisBlank: nextBlankAttempts[name] ?? 0,
      })),
      incorrectBlanks: incorrectNames,
    };

    logBlankAnalytics?.(payload);

    // If everything is correct, clear AI hints
    if (incorrectNames.length === 0) {
      setActiveBlankHint?.(null);
      setAiHelpByBlank?.({});
    }
  };

  /* ==========================================================
     AI HELP FOR A SPECIFIC BLANK  (with previous-hint memory)
  ========================================================== */
  const requestAiBlankHelpForBlank = async ({ blankName, code: codeArg }) => {
    if (!step) return;

    const key = `${blockIndex}:${blankName}`;

    const usedHints = aiHintLevelByBlank?.[key] ?? 0;
    if (usedHints >= MAX_HINT_LEVEL) return;

    const studentAnswer = (mergedBlanks?.[blankName] ?? "").trim();
    const rule = step.answerKey?.[blankName];
    if (!rule) return;

    const previousHintText = aiHelpByBlank?.[key] || null;

    const now = Date.now();
    const last = aiLastRequestAtByKey?.[key] || 0;

    if (now - last < AI_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((AI_COOLDOWN_MS - (now - last)) / 1000);

      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]:
          prev?.[key] ||
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
      lessonId: step.id,
      title: step.title,
      description: step.desc || null,
      codeSnippet: codeArg || code || step.code || null,

      blank: {
        name: blankName,
        studentAnswer,
        rule,
        allBlanks: mergedBlanks,
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

      const difficulty = difficulties[blankName] || null;

      logBlankAnalytics?.({
        type: "AI_HINT",
        blankName,
        blockIndex,
        hintLevel: upcomingHintNumber,
        studentAnswer,
        previousHintUsed: !!previousHintText,
        difficulty,
      });
    } catch (err) {
      console.warn("AI blank help error:", err);
      setAiHelpByBlank?.((prev) => ({
        ...(prev || {}),
        [key]:
          prev?.[key] ||
          "I had trouble generating more help right now. Try adjusting your answer slightly and re-checking.",
      }));
    } finally {
      setAiLoadingKey?.((prev) => (prev === key ? null : prev));
    }
  };

  /* ==========================================================
     RENDER CODE WITH BLANKS (with comment alignment)
  ========================================================== */

  const CHAR_W = 8;

  const estimateTokenWidthPx = (tok) => {
    if (!tok) return 0;
    if (tok.type === "blank") return tok.width || 0;
    if (tok.type === "text") return (tok.content?.length || 0) * CHAR_W;
    return 0;
  };

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
          const after = s.slice(idx);

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

      if (tok.type === "blank") codeTokens.push(tok);
    }

    return { codeTokens, comment: comment.trimEnd() };
  };

  const renderCodeWithBlanks = () => {
    if (!code) return null;

    const chunks = code.split(/(\^\^[\s\S]*?\^\^)/g).filter(Boolean);
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
          const value = mergedBlanks?.[name] ?? "";
          const displayLength = value.length > 0 ? value.length : 1;

          tokens.push({
            type: "blank",
            name,
            value,
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

    const CODE_COL_PX = maxCodePx + 12;

    return lineSplits.map(({ codeTokens, comment }, lineIdx) => {
      if (!codeTokens.length && !comment) {
        return (
          <View key={`line-${lineIdx}`} style={styles.codeLineRow}>
            <View style={{ width: CODE_COL_PX }}>
              <Text style={styles.codeNormal}>{" "}</Text>
            </View>
          </View>
        );
      }

      return (
        <View key={`line-${lineIdx}`} style={styles.codeLineRow}>
          <View style={[styles.codePartCol, { width: CODE_COL_PX }]}>
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
                  <Text key={`t-${lineIdx}-${idx}`} style={styles.codeNormal}>
                    {textContent}
                  </Text>
                );
              }

              if (tok.type === "blank") {
                const status = blankStatus?.[tok.name];

                return (
                  <View key={`b-${lineIdx}-${idx}`} style={styles.blankWithDot}>
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
                          prev.blockIndex === blockIndex
                            ? null
                            : prev
                        );

                        setAiHelpByBlank?.((prev) => {
                          const next = { ...(prev || {}) };
                          delete next[`${blockIndex}:${tok.name}`];
                          return next;
                        });
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      style={[
                        styles.codeBlankInput,
                        tok.highlight && styles.codeBlankInputHighlight,
                        status === true && styles.blankCorrect,
                        status === false && styles.blankIncorrect,
                        { width: tok.width },
                      ]}
                    />

                    {status === false && (
                      <TouchableOpacity
                        style={styles.errorDot}
                        onPress={() => {
                          const explanation =
                            (blockExplanations && blockExplanations[tok.name]) ||
                            (step?.blankExplanations && step.blankExplanations[tok.name]) ||
                            "Hint: Re-check what this blank represents.";

                          setActiveBlankHint?.({
                            name: tok.name,
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
            <Text
              style={styles.codeCommentCol}
              numberOfLines={0}
              ellipsizeMode="clip"
            >
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
      ? aiHelpByBlank[aiKey]
      : null;

  const loadingThis = aiKey && aiLoadingKey === aiKey;

  const showHintBox =
    activeBlankHint && activeBlankHint.blockIndex === blockIndex;

  return (
    <>
      <View style={styles.codeCard}>
        <View style={styles.codeCardHeader}>
          <Text style={styles.codeCardTitle}>Example Code</Text>

          <View style={styles.codeCardHeaderActions || styles.codeHeaderButtons}>
            {step?.answerKey && (
              <TouchableOpacity style={styles.copyBtn} onPress={checkBlanks}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color="#cbd5e1"
                />
                <Text style={styles.copyBtnText}>Check Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => copyCode(code)}
            >
              <Ionicons name="copy-outline" size={16} color="#cbd5e1" />
              <Text style={styles.copyBtnText}>Copy to Editor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {horizontalScroll ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.codeBox}>{renderCodeWithBlanks()}</View>
          </ScrollView>
        ) : (
          <View style={styles.codeBox}>{renderCodeWithBlanks()}</View>
        )}
      </View>

      {showHintBox && (
        <View style={styles.blankHintBox}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color="#b91c1c"
            style={{ marginRight: 8, marginTop: 2 }}
          />

          <View style={styles.hintContent}>
            <Text style={styles.blankHintText}>{activeBlankHint.text}</Text>

            {!aiText && !loadingThis && (
              <Text
                style={[
                  styles.blankHintText,
                  {
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                  },
                ]}
              >
                More AI hints are allowed after you’ve thought it through for at
                least 6 seconds. You are allowed up to 3 hints per blank.
              </Text>
            )}

            {aiText && (
              <>
                <View style={styles.aiHintDivider} />
                <Text style={styles.blankHintText}>{aiText}</Text>
              </>
            )}

            {!aiText && loadingThis && (
              <>
                <View style={styles.aiHintDivider} />
                <Text
                  style={[
                    styles.blankHintText,
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
                    code: code,
                  })
                }
                style={{ marginRight: 8 }}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color="#2563eb"
                />
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
