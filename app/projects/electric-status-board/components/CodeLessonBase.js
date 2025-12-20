// code.js
// answer key: https://wokwi.com/projects/447184024115506177

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import SplitView from "./SplitView";
import ArduinoEditor from "./ArduinoEditor";
import CircuitEditor from "./circuitEditor";
import useEditorToggle from "../hooks/useEditorToggle";
import { Image } from "react-native";


/* ---------------- LESSON DATA: steps per lesson ---------------- */


const getTotalLessons = (stepsObj) => Object.keys(stepsObj || {}).length;

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

const CODE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});


/* ---------------- REUSABLE STEP CARD ---------------- */
function StepCard({ step, storageKey, globalKey, apiBaseUrl, analyticsTag }) {
  const [localBlanks, setLocalBlanks] = React.useState({});
  const [globalBlanks, setGlobalBlanks] = React.useState({});
  const [blankStatus, setBlankStatus] = React.useState({});
  const [activeBlankHint, setActiveBlankHint] = React.useState(null);

  // AI state: per-blank help keyed by "blockIndex:blankName"
  const [aiHelpByBlank, setAiHelpByBlank] = React.useState({});
  const [aiLoadingKey, setAiLoadingKey] = React.useState(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = React.useState({});
  const [checkAttempts, setCheckAttempts] = React.useState(0);
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = React.useState({});
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState({});  // number of attempts per blank
  const [inlineWidthByName, setInlineWidthByName] = React.useState({});

  const GLOBAL_KEY = globalKey;
  const AI_COOLDOWN_MS = 8000; // 8 seconds between AI hints per blank
  const MAX_HINT_LEVEL = 3; // max AI hint depth (1..3)

  /* ==========================================================
     SMALL ANALYTICS LOGGER
     - Sends anonymized events to your backend
  ========================================================== */
  //  helper to send analytics events to the server
  const logBlankAnalytics = async (event) => {
    try {
      await fetch(`${apiBaseUrl}/api/blank-analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          analyticsTag: analyticsTag || null,
          stepId: step?.id,
          stepTitle: step?.title,
          storageKey: storageKey || null,
        }),
      });
    } catch (err) {
      console.warn("analytics failed:", err);
    }
  };


  /* ==========================================================
     1. LOAD GLOBAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(GLOBAL_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setGlobalBlanks(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  /* ==========================================================
     2. LOAD LOCAL BLANKS FOR THIS STEP
  ========================================================== */
  React.useEffect(() => {
    if (!storageKey) return;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setLocalBlanks(parsed);
          }
        }
      } catch {}
    })();
  }, [storageKey]);

  /* ==========================================================
     3. SAVE LOCAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    if (!storageKey) return;
    (async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(localBlanks));
      } catch {}
    })();
  }, [storageKey, localBlanks]);

  /* ==========================================================
     4. SAVE GLOBAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(GLOBAL_KEY, JSON.stringify(globalBlanks));
      } catch {}
    })();
  }, [globalBlanks]);

  /* ==========================================================
     5. MERGED BLANKS
  ========================================================== */
  const mergedBlanks = { ...localBlanks, ...globalBlanks };

  /* ==========================================================
    AI HELP FOR A SPECIFIC BLANK  (with previous-hint memory)
  ========================================================== */
const requestAiBlankHelpForBlank = async ({ blankName, blockIndex, code }) => {
  if (!step) return;

  const key = `${blockIndex}:${blankName}`;

  // 🔹 How many hints have already been used for this blank?
  // Stored value = number of hints already received (0–3).
  const usedHints = aiHintLevelByBlank[key] ?? 0;

  // 🔹 HARD CAP: if they already used 3 hints, do nothing.
  if (usedHints >= MAX_HINT_LEVEL) {
    return; // keep the existing hint text stable, no reload
  }

  const studentAnswer = (mergedBlanks[blankName] ?? "").trim();
  const rule = step.answerKey?.[blankName];
  if (!rule) return;

  // 🔹 What did AI already say for this blank (if anything)?
  const previousHintText = aiHelpByBlank[key] || null;

  // 🔹 Cooldown to avoid spamming the endpoint
  const now = Date.now();
  const last = aiLastRequestAtByKey[key] || 0;
  if (now - last < AI_COOLDOWN_MS) {
    const secondsLeft = Math.ceil(
      (AI_COOLDOWN_MS - (now - last)) / 1000
    );

    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]:
        prev[key] ||
        `Try tweaking your answer or re-reading the hint first. You can ask AI again in about ${secondsLeft} second${
          secondsLeft === 1 ? "" : "s"
        }.`,
    }));
    return;
  }

  // This call will produce hint # (usedHints + 1)
  const upcomingHintNumber = usedHints + 1;

  // Map upcoming hint number → server-side mode
  let mode = "gentle_nudge";
  if (upcomingHintNumber === 2) {
    mode = "conceptual_explanation";
  } else if (upcomingHintNumber === 3) {
    mode = "analogy_based";
  }

  const payload = {
    lessonId: step.id,
    title: step.title,
    description: step.desc || null,
    codeSnippet: code || step.code || null,

    blank: {
      name: blankName,
      studentAnswer,
      rule,
      allBlanks: mergedBlanks,
      previousHint: previousHintText,
    },

    mode,               // server uses this to pick the prompt style
    hintLevel: upcomingHintNumber, // also send the numeric level (1,2,3)
  };

  try {
    setAiLoadingKey(key);
    setAiLastRequestAtByKey((prev) => ({
      ...prev,
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

    // REPLACE the old hint with the NEW one (no stacking)
    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]: data.explanation, // only the latest hint is shown
    }));

    // Record that this blank has now used `upcomingHintNumber` hints
    setAiHintLevelByBlank((prev) => ({
      ...prev,
      [key]: upcomingHintNumber, // 1, then 2, then 3
    }));

    const difficulties = step.blankDifficulties || {};
    const difficulty = difficulties[blankName] || null;

    // Analytics: log that an AI hint was used
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
    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]:
        prev[key] ||
        "I had trouble generating more help right now. Try adjusting your answer slightly and re-checking.",
    }));
  } finally {
    setAiLoadingKey((prev) => (prev === key ? null : prev));
  }
};






  /* ==========================================================
     COPY FUNCTION
  ========================================================== */
  const copyCode = async (rawCode) => {
    try {
      let textToCopy = rawCode || "";

      Object.entries(mergedBlanks).forEach(([name, value]) => {
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

  // Pre-compute next attempt index (since setState is async)
  const nextAttempt = checkAttempts + 1;
  setCheckAttempts((prev) => prev + 1);

  const results = {};

  Object.entries(step.answerKey).forEach(([name, spec]) => {
    const raw = (mergedBlanks[name] ?? "").trim();
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
          const otherVal = (mergedBlanks[otherName] ?? "").trim();
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
            isCorrect = spec.values.some(
              (v) => raw === String(v).trim()
            );
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

  const nextBlankAttempts = { ...blankAttemptsByName }; 

  Object.entries(results).forEach(([name, isCorrect]) => {
    if (!isCorrect) {
      const prevCount = nextBlankAttempts[name] ?? 0;
      nextBlankAttempts[name] = prevCount + 1;
    }
    // (If it's correct, we leave its count as-is,
    //  so you know how many tries it needed before they got it.)
  });

  setBlankAttemptsByName(nextBlankAttempts);

  // Update UI with correctness
  setBlankStatus(results);

  // Figure out which blanks are wrong
  const incorrectNames = Object.entries(results)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const hasIncorrect = incorrectNames.length > 0;

  // --- Analytics payload 
  const difficulties = step.blankDifficulties || {};

  const payload = {
    type: "CHECK_BLANKS",
    attempt: nextAttempt,
    results,
    blanks: Object.entries(results).map(([name, isCorrect]) => ({
      name,
      isCorrect,
      studentAnswer: (mergedBlanks[name] ?? "").trim(),
      difficulty: difficulties[name] || null,
      attemptsForThisBlank: nextBlankAttempts[name] ?? 0,
    })),
    incorrectBlanks: incorrectNames,
  };

  logBlankAnalytics(payload);

  // If everything is correct, clear AI hints
  if (!hasIncorrect) {
    setActiveBlankHint(null);
    setAiHelpByBlank({});
  }
};


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
      let style = styles.codeHighlight;

      if (token.startsWith("//")) {
        style = styles.syntaxComment;
      } else if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        style = styles.syntaxString;
      } else if (/^\d/.test(token)) {
        style = styles.syntaxNumber;
      } else if (TYPE_KEYWORDS.includes(token)) {
        style = styles.syntaxType;
      } else if (CONTROL_KEYWORDS.includes(token)) {
        style = styles.syntaxControl;
      } else if (ARDUINO_FUNCS.includes(token)) {
        style = styles.syntaxArduinoFunc;
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
     RENDER CODE WITH BLANKS
  ========================================================== */

// --- Helpers for aligning // comments into a second column ---
  const CHAR_W = 8; // match your existing width math (value.length * 8)

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
        else if (tok.type === "blank") comment += "_____"; // just in case
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
          // comment-only line: ignore indentation spaces for alignment
          comment = after;
        }

        inComment = true;
        continue;
      }
      else {
          codeTokens.push(tok);
        }
        continue;
      }

      // blanks always belong to code column (typical)
      if (tok.type === "blank") {
        codeTokens.push(tok);
      }
    }

    return { codeTokens, comment: comment.trimEnd() };
  };



  const renderCodeWithBlanks = (code, blockIndex, blockExplanations) => {
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
          const value = mergedBlanks[name] ?? "";
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
      if (tok.type === "newline") {
        lines.push([]);
      } else {
        lines[lines.length - 1].push(tok);
      }
    });

    // Build per-line splits and compute the widest "code column" width
    const lineSplits = lines.map(splitLineAtComment);

    const maxCodePx = Math.max(
      0,
      ...lineSplits.map(({ codeTokens }) =>
        codeTokens.reduce((sum, t) => sum + estimateTokenWidthPx(t), 0)
      )
    );

    // Add a little padding so comments don't touch the code column edge
    const CODE_COL_PX = maxCodePx + 12;

    return lineSplits.map(({ codeTokens, comment }, lineIdx) => {
  // keep empty lines behavior
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
      {/* LEFT: fixed-width code column */}
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
            const status = blankStatus[tok.name];

            return (
              <View key={`b-${lineIdx}-${idx}`} style={styles.blankWithDot}>
                <TextInput
                  value={tok.value}
                  onChangeText={(txt) => {
                    setLocalBlanks((prev) => ({ ...prev, [tok.name]: txt }));
                    setGlobalBlanks((prev) => ({ ...prev, [tok.name]: txt }));

                    setBlankStatus((prev) => {
                      const copy = { ...prev };
                      delete copy[tok.name];
                      return copy;
                    });

                    setActiveBlankHint((prev) =>
                      prev &&
                      prev.name === tok.name &&
                      prev.blockIndex === blockIndex
                        ? null
                        : prev
                    );
                    setAiHelpByBlank((prev) => {
                      const next = { ...prev };
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
                        (step.blankExplanations && step.blankExplanations[tok.name]) ||
                        "Hint: Re-check what this blank represents.";

                      setActiveBlankHint({
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

      {/* RIGHT: comment column (aligned) */}
      {!!comment && (
        <Text style={styles.codeCommentCol} numberOfLines={0} ellipsizeMode="clip">
          {comment}
        </Text>
      )}
    </View>
  );
});


  };

  /* ==========================================================
     RENDER DESCRIPTION WITH INLINE BLANKS + CODE
  ========================================================== */
  const renderWithInlineCode = (text) => {
    if (!text) return null;

    const lines = text.split(/\n/);

    return lines.map((line, lineIdx) => {
      if (line === "") {
        return (
          <View
            key={`p-line-${lineIdx}`}
            style={styles.richTextLine}
          >
            <Text style={styles.stepDescText}>{" "}</Text>
          </View>
        );
      }

      const parts = line
        .split(/(__BLANK\[[A-Z0-9_]+\]__|`[^`]+`|\*\*[^*]+\*\*)/g)
        .filter(Boolean);

      return (
        <View
          key={`p-line-${lineIdx}`}
          style={styles.richTextLine}
        >
          {parts.map((part, idx) => {
            const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
            if (blankMatch) {
              const name = blankMatch[1];
              const value = mergedBlanks[name] ?? "";
              const measured = inlineWidthByName[name];
              const INLINE_MIN_W = 50;   // minimum width for inline blanks
              const INLINE_MAX_W = 220;  // cap so it doesn't explode wide
              const INLINE_PAD_X = 10;   // padding for inline blanks
              const fallback = Math.max(INLINE_MIN_W, Math.min(INLINE_MAX_W, ((value?.length || 1) * 8) + INLINE_PAD_X));
              const width = measured ?? fallback;

              return (
                <TextInput
                  key={`p-blank-${lineIdx}-${idx}`}
                  value={value}
                  onChangeText={(txt) => {
                    setLocalBlanks((prev) => ({ ...prev, [name]: txt }));
                    setGlobalBlanks((prev) => ({ ...prev, [name]: txt }));

                    setBlankStatus((prev) => {
                      const next = { ...prev };
                      delete next[name];
                      return next;
                    });

                    // only clear the hint for *this* blank
                    setActiveBlankHint((prev) => (prev && prev.name === name ? null : prev));

                    // only clear AI for this blank in the "single" namespace (your mapping)
                    setAiHelpByBlank((prev) => {
                      const next = { ...prev };
                      delete next[`single:${name}`];
                      return next;
                    });
                  }}
                  onContentSizeChange={(e) => {
                    const w = e?.nativeEvent?.contentSize?.width;
                    if (!w) return;

                    // add padding so the text doesn't touch borders
                    const nextW = Math.max(INLINE_MIN_W, Math.min(INLINE_MAX_W, Math.ceil(w + INLINE_PAD_X)));

                    setInlineWidthByName((prev) => {
                      if (prev[name] === nextW) return prev;
                      return { ...prev, [name]: nextW };
                    });
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  style={[styles.inlineBlankInput, { width }]}
                />
              );

            }

            if (part.startsWith("`") && part.endsWith("`")) {
              let code = part.slice(1, -1);

              if (code.startsWith("***") && code.endsWith("***")) {
                const strong = code.slice(3, -3);
                return (
                  <Text
                    key={`p-strong-code-${lineIdx}-${idx}`}
                    style={styles.inlineCodeStrong}
                  >
                    {strong}
                  </Text>
                );
              }

              return (
                <Text
                  key={`p-code-${lineIdx}-${idx}`}
                  style={styles.inlineCode}
                >
                  {code}
                </Text>
              );
            }

            if (part.startsWith("**") && part.endsWith("**")) {
              const boldText = part.slice(2, -2);

              let style = styles.boldGeneral;
              if (/Wiring/i.test(boldText)) style = styles.boldWiring;
              else if (/Setup/i.test(boldText)) style = styles.boldSetup;
              else if (/Loop/i.test(boldText)) style = styles.boldLoop;

              return (
                <Text
                  key={`p-bold-${lineIdx}-${idx}`}
                  style={style}
                >
                  {boldText}
                </Text>
              );
            }

            const wordParts = part.split(/(\s+)/g).filter(Boolean);
            return wordParts.map((w, wIdx) => (
              <Text
                key={`p-text-${lineIdx}-${idx}-${wIdx}`}
                style={styles.stepDescText}
              >
                {w}
              </Text>
            ));

          })}
        </View>
      );
    });
  };

  /* ==========================================================
     UI RENDER
  ========================================================== */
  return (
    <View style={styles.stepOuter}>
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepTitle}>{step.title}</Text>
        </View>

        {step.topicTitle ? (
          <Text style={styles.topicTitle}>{step.topicTitle}</Text>
        ) : null}

        {step.desc ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.desc)}
          </View>
        ) : null}

        {step.gif && (
          <View style={styles.gifCard}>
            <Image
              source={step.gif}
              style={styles.gifImage}
              resizeMode="contain"
            />
            <Text style={styles.gifCaption}>{step.gifCaption}</Text>
          </View>
        )}

        {step.descAfterCircuit ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.descAfterCircuit)}
          </View>
        ) : null}

        {/* ---- Code blocks ---- */}
        {Array.isArray(step.codes) && step.codes.length > 0 ? (
          <>
            {step.codes.map((block, idx) => {
              const aiKey =
                activeBlankHint &&
                activeBlankHint.blockIndex === idx &&
                activeBlankHint.name
                  ? `${idx}:${activeBlankHint.name}`
                  : null;
              const aiText =
                aiKey &&
                Object.prototype.hasOwnProperty.call(aiHelpByBlank, aiKey)
                  ? aiHelpByBlank[aiKey]
                  : null;
              const loadingThis = aiKey && aiLoadingKey === aiKey;

              return (
                <View
                  key={`code-block-${idx}`}
                  style={{ marginTop: idx === 0 ? 12 : 16 }}
                >
                  {block.topicTitle ? (
                    <Text style={styles.topicTitle}>
                      {block.topicTitle}
                    </Text>
                  ) : null}

                  {block.descBeforeCode ? (
                    <View style={styles.stepDescBlock}>
                      {renderWithInlineCode(block.descBeforeCode)}
                    </View>
                  ) : null}

                  <View style={styles.codeCard}>
                    <View style={styles.codeCardHeader}>
                      <Text style={styles.codeCardTitle}>
                        Example Code
                      </Text>

                      <View style={styles.codeCardHeaderActions}>
                        {step.answerKey && (
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={checkBlanks}
                          >
                            <Ionicons
                              name="checkmark-done-outline"
                              size={16}
                              color="#cbd5e1"
                            />
                            <Text style={styles.copyBtnText}>
                              Check Code
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() =>
                            copyCode(block.code || step.code)
                          }
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#cbd5e1"
                          />
                          <Text style={styles.copyBtnText}>
                            Copy to Editor
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        contentContainerStyle={{ flexGrow: 1 }}
                      >
                        <View style={styles.codeBox}>
                          {renderCodeWithBlanks(
                            block.code,
                            idx,
                            block.blankExplanations || step.blankExplanations
                          )}
                        </View>
                      </ScrollView>
                  </View>

                  {/* HINT BOX for THIS CODE BLOCK ONLY */}
                  {activeBlankHint &&
                    activeBlankHint.blockIndex === idx && (
                      <View style={styles.blankHintBox}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={18}
                          color="#b91c1c"
                          style={{ marginRight: 8, marginTop: 2 }}
                        />
                        <View style={styles.hintContent}>
                          <Text style={styles.blankHintText}>
                            {activeBlankHint.text}
                          </Text>

                          {/* Cost awareness text (only if no AI text yet and not loading) */}
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
                              More AI hints are allowed after you’ve thought it
                              through for at least 6 seconds.
                            </Text>
                          )}

                          {aiText && (
                            <>
                              <View style={styles.aiHintDivider} />
                              <Text style={styles.blankHintText}>
                                {aiText}
                              </Text>
                            </>
                          )}

                          {!aiText && loadingThis && (
                            <>
                              <View style={styles.aiHintDivider} />
                              <Text
                                style={[
                                  styles.blankHintText,
                                  {
                                    fontStyle: "italic",
                                    color: "#6b7280",
                                  },
                                ]}
                              >
                                Thinking…
                              </Text>
                            </>
                          )}
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                          }}
                        >
                          {/* Circle icon OR spinner while loading */}
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
                                  blockIndex: activeBlankHint.blockIndex,
                                  code: block.code || step.code,
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

                          {/* X to close the hint box */}
                          <TouchableOpacity
                            onPress={() => {
                              setActiveBlankHint(null);
                              setAiHelpByBlank((prev) => {
                                if (!aiKey) return prev;
                                const next = { ...prev };
                                delete next[aiKey];
                                return next;
                              });
                            }}
                          >
                            <Ionicons
                              name="close"
                              size={18}
                              color="#6b7280"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                  {block.descAfterCode ? (
                    <View style={styles.stepDescBlock}>
                      {renderWithInlineCode(block.descAfterCode)}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : step.code ? (
          (() => {
            const aiKey =
              activeBlankHint &&
              activeBlankHint.blockIndex === "single" &&
              activeBlankHint.name
                ? `single:${activeBlankHint.name}`
                : null;
            const aiText =
              aiKey &&
              Object.prototype.hasOwnProperty.call(aiHelpByBlank, aiKey)
                ? aiHelpByBlank[aiKey]
                : null;
            const loadingThis = aiKey && aiLoadingKey === aiKey;

            return (
              <>
                <View style={styles.codeCard}>
                  <View style={styles.codeCardHeader}>
                    <Text style={styles.codeCardTitle}>
                      Example Code
                    </Text>

                    <View style={styles.codeHeaderButtons}>
                      {step.answerKey && (
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={checkBlanks}
                        >
                          <Ionicons
                            name="checkmark-done-outline"
                            size={16}
                            color="#cbd5e1"
                          />
                          <Text style={styles.copyBtnText}>
                            Check Code
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.copyBtn,
                          step.answerKey && { marginLeft: 8 },
                        ]}
                        onPress={() => copyCode(step.code)}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color="#cbd5e1"
                        />
                        <Text style={styles.copyBtnText}>
                          Copy to Editor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.codeBox}>
                    {renderCodeWithBlanks(
                      step.code,
                      "single",
                      step.blankExplanations
                    )}
                  </View>
                </View>

                {/* HINT BOX for the single step.code variant */}
                {activeBlankHint &&
                  activeBlankHint.blockIndex === "single" && (
                    <View style={styles.blankHintBox}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#b91c1c"
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <View style={styles.hintContent}>
                        <Text style={styles.blankHintText}>
                          {activeBlankHint.text}
                        </Text>

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
                              More AI hints are allowed after you’ve thought it
                              through for at least 6 seconds. You are allowed up to 3 hints per blank. 
                          </Text>
                        )}

                        {aiText && (
                          <>
                            <View style={styles.aiHintDivider} />
                            <Text style={styles.blankHintText}>
                              {aiText}
                            </Text>
                          </>
                        )}

                        {!aiText && loadingThis && (
                          <>
                            <View style={styles.aiHintDivider} />
                            <Text
                              style={[
                                styles.blankHintText,
                                {
                                  fontStyle: "italic",
                                  color: "#6b7280",
                                },
                              ]}
                            >
                              Thinking…
                            </Text>
                          </>
                        )}
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Circle icon OR spinner while loading */}
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
                                blockIndex: "single",
                                code: step.code,
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

                        {/* X to close the hint box */}
                        <TouchableOpacity
                          onPress={() => {
                            setActiveBlankHint(null);
                            setAiHelpByBlank((prev) => {
                              if (!aiKey) return prev;
                              const next = { ...prev };
                              delete next[aiKey];
                              return next;
                            });
                          }}
                        >
                          <Ionicons
                            name="close"
                            size={18}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
              </>
            );
          })()
        ) : null}

        {step.descAfterCode ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.descAfterCode)}
          </View>
        ) : null}

        {step.circuitImage && (
          <View style={styles.gifCard}>
            <Image
              source={step.circuitImage}
              style={styles.gifImage}
              resizeMode="contain"
            />
          </View>
        )}

        {step.hint ? (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={18} color="#6a5c1d" />
            <Text style={styles.hintText}>
              <Text style={{ fontWeight: "700" }}>Hint: </Text>
              {step.hint}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}


function renderCodeWithHighlights(text) {
  const parts = text.split(/(\^\^[\s\S]+?\^\^)/g);

  return parts
    .filter(Boolean)
    .map((part, idx) => {
      if (part.startsWith("^^") && part.endsWith("^^")) {
        const code = part.slice(2, -2);
        return (
          <Text key={idx} style={styles.codeHighlight}>
            {code}
          </Text>
        );
      }

      return (
        <Text key={idx} style={styles.codeNormal}>
          {part}
        </Text>
      );
    });
}


function renderWithInlineCode(text) {
  if (!text) return null;

  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code (may include strong)
    if (part.startsWith("`") && part.endsWith("`")) {
      let code = part.slice(1, -1); // remove backticks

      // Strong inline code FIRST
      if (code.startsWith("***") && code.endsWith("***")) {
        const strong = code.slice(3, -3);
        return (
          <Text key={idx} style={styles.inlineCodeStrong}>
            {strong}
          </Text>
        );
      }

      // Normal inline code
      return (
        <Text key={idx} style={styles.inlineCode}>
          {code}
        </Text>
      );
    }

    // Bold **...**
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);

      let style = styles.boldGeneral;
      if (/Wiring/i.test(boldText)) style = styles.boldWiring;
      else if (/Setup/i.test(boldText)) style = styles.boldSetup;
      else if (/Loop/i.test(boldText)) style = styles.boldLoop;

      return (
        <Text key={idx} style={style}>
          {boldText}
        </Text>
      );
    }

    return <Text key={idx}>{part}</Text>;
  });
}
/*----------------SIDE BAR---------------------*/
function LessonSidebar({ lessonSteps, currentLesson, currentStepIndex, onSelectStep, fullWidth, isStepDone }) {
  return (
    <View style={[styles.lessonSidebar,
      fullWidth && styles.sidebarExpanded,
    ]}>
      <Text style={styles.sidebarTitle}>Lessons & Steps</Text>

      {Object.entries(lessonSteps).map(([lessonNumStr, steps]) => {
        const lessonNum = Number(lessonNumStr);
        const isCurrentLesson = lessonNum === currentLesson;

        return (
          <View key={lessonNumStr} style={styles.sidebarLessonBlock}>
            <Text
              style={[
                styles.sidebarLessonTitle,
                isCurrentLesson && styles.sidebarLessonTitleActive,
              ]}
            >
              Lesson {lessonNum}
            </Text>

            {steps.map((step, idx) => {
              const isActive = isCurrentLesson && idx === currentStepIndex;
              const done = 
                typeof isStepDone === "function" &&
                isStepDone(lessonNum,idx);

              return (
                <TouchableOpacity
                  key={`L${lessonNum}-S${idx}`}
                  style={[
                    styles.sidebarStepRow,
                    isActive && styles.sidebarStepRowActive,
                    !isActive && done && styles.sidebarStepRowDone,
                  ]}
                  onPress={() => onSelectStep(lessonNum, idx)}
                >
                  <Text
                    style={[
                      styles.sidebarStepText,
                      isActive && styles.sidebarStepTextActive,
                      !isActive && done && styles.sidebarStepRowDone,
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}


/* ---------------- MAIN SCREEN ---------------- */
export default function CodeLessonBase({
  screenTitle = "Coding",
  lessonSteps = {},
  storagePrefix = "esb:coding",
  doneSetKey,
  overallProgressKey,
  globalBlanksKey,
  localBlanksPrefixKey,
  analyticsTag = "coding",
  apiBaseUrl = "http://localhost:4000",
  backRoute = "/projects/electric-status-board/learn",
}) {
  const TOTAL_LESSONS = getTotalLessons(lessonSteps);
  const totalSteps = Object.values(lessonSteps || {}).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  // Resolve storage keys from either explicit props or storagePrefix
  const _doneSetKey = doneSetKey || `${storagePrefix}:doneSet`;
  const _overallProgressKey =
    overallProgressKey || `${storagePrefix}:overallProgress`;
  const _globalBlanksKey =
    globalBlanksKey || `${storagePrefix}:blanks:GLOBAL`;
  const _localBlanksPrefixKey =
    localBlanksPrefixKey || `${storagePrefix}:blanks:LOCAL`;

  const router = useRouter();
  const { showEditor, toggle } = useEditorToggle();

  const [showCircuit, setShowCircuit] = React.useState(false);

  const showBoth = showEditor && showCircuit;

  const exitTools = () => {
    // Close BOTH tools and return to lessons
    setShowCircuit(false);
    if (showEditor) toggle();
  };


  const [lesson, setLesson] = React.useState(1);
  const [stepIndex, setStepIndex] = React.useState(0);
  const scrollRef = React.useRef(null); 
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const STORAGE_KEYS = {
    doneSet: _doneSetKey,
    overallProgress: _overallProgressKey,
  };

  const [doneSet, setDoneSet] = React.useState(new Set());

  React.useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem(STORAGE_KEYS.doneSet);
        if (d) {
          const ids = JSON.parse(d);
          if (Array.isArray(ids)) {
            setDoneSet(new Set(ids));
          }
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.doneSet,
          JSON.stringify(Array.from(doneSet))
        );
      } catch {}
    })();
  }, [doneSet]);

  /* ---- safe step bounds ---- */
  const steps = lessonSteps[lesson] || [];
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;
  const lastStep = safeStepIndex >= steps.length - 1;
    // unique key for each step
  const makeStepKey = (lessonNumber, stepIdx) => `L${lessonNumber}-S${stepIdx}`;
  const currentStepKey = makeStepKey(lesson, safeStepIndex);

  // is the CURRENT step done?
  const isDone = doneSet.has(currentStepKey);

  /* ---- PROGRESS CALCULATIONS (based on done steps) ---- */
  // collect all valid step keys so we ignore any old junk in storage
  const validDoneKeys = new Set();
  Object.entries(lessonSteps).forEach(([lessonNumStr, stepsArr]) => {
    const lessonNum = Number(lessonNumStr);
    (stepsArr || []).forEach((_, idx) => {
      const key = makeStepKey(lessonNum, idx);
      if (doneSet.has(key)) {
        validDoneKeys.add(key);
      }
    });
  });

  // overall progress: % of all steps done
  const overallCompletedSteps = validDoneKeys.size;
  const overallProgress =
    totalSteps > 0
      ? Math.round((overallCompletedSteps / totalSteps) * 100)
      : 0;
  
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.overallProgress,
          JSON.stringify(overallProgress)
        );
      } catch (e) {
        console.warn("Failed to save overall coding progress:", e);
      }
    })();
  }, [overallProgress])

  // per-lesson progress: % of steps in THIS lesson done
  let completedInThisLesson = 0;
  steps.forEach((_, idx) => {
    const key = makeStepKey(lesson, idx);
    if (doneSet.has(key)) {
      completedInThisLesson++;
    }
  });

  const lessonProgress =
    steps.length > 0
      ? Math.round((completedInThisLesson / steps.length) * 100)
      : 0;


  const markDone = () =>
    setDoneSet(prev => {
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });

  const unmarkDone = () =>
    setDoneSet(prev => {
      const next = new Set(prev);
      next.delete(currentStepKey);
      return next;
    });

  const headerTopic =
    steps.length > 0 && steps[0]?.title
      ? steps[0].title.replace(/^Step \d+:\s*/, "")
      : "";
    
  const handleSelectStep = (lessonNumber, stepIdx) => {
    setLesson(lessonNumber);
    setStepIndex(stepIdx);
    scrollToTop();
  };


  /* ---- MAIN LEFT CONTENT ---- */
const leftPane = (
  <View style={{ flex: 1 }}>
    <Stack.Screen options={{ headerShown: false }} />

    {/* Back */}
    <View style={styles.headerRow}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace(backRoute)}
      >
        <Ionicons name="arrow-back" size={18} color="#c05454" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* RIGHT BUTTONS: Code + Circuit */}
      <View style={styles.headerRightCol}>
        {/* Code editor toggle */}
        <TouchableOpacity style={styles.editorToggleBtn} onPress={toggle}>
          <Text style={styles.editorToggleText}>{`</>`}</Text>
        </TouchableOpacity>

        {/* Circuit page */}
        <TouchableOpacity
          style={styles.circuitBtn}
          onPress={() => setShowCircuit((v) => !v)}
        >
          <Text style={styles.circuitBtnText}>{`⚡ Circuit`}</Text>
        </TouchableOpacity>
      </View>

    </View>

    {/* Title */}
    <View style={styles.titleWrap}>
      <Text style={styles.h1}>{`Lesson ${lesson}: ${headerTopic}`}</Text>
      <Text style={styles.p}>Learn by completing each step below.</Text>
    </View>

    {/* Overall + per-lesson progress */}
    <View style={{ paddingHorizontal: 18 }}>
      <View style={styles.progressGroup}>
        <Text style={styles.progressHeader}>Overall progress</Text>
        <View style={styles.progressBarWrap}>
          <View
            style={[styles.progressBarFill, { width: `${overallProgress}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>{overallProgress}% complete</Text>
      </View>

      <View style={[styles.progressGroup, { marginTop: 8 }]}>
        <Text style={styles.progressHeader}>This lesson</Text>
        <View style={styles.progressBarWrap}>
          <View
            style={[
              styles.progressBarFillSecondary,
              { width: `${lessonProgress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{lessonProgress}% of steps</Text>
      </View>
    </View>

    {/* Step card + Sidebar */}
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      {steps.length > 0 ? (
        <View style={styles.lessonLayoutRow}>
          <StepCard
            step={steps[safeStepIndex]}
            storageKey={`${_localBlanksPrefixKey}:L${lesson}-S${safeStepIndex}`}
            globalKey={_globalBlanksKey}
            apiBaseUrl={apiBaseUrl}
            analyticsTag={analyticsTag}
          />

          <LessonSidebar
            lessonSteps={lessonSteps}
            currentLesson={lesson}
            currentStepIndex={safeStepIndex}
            onSelectStep={handleSelectStep}
            fullWidth={!showEditor}
            isStepDone={(lessonNumber, stepIdx) =>
              doneSet.has(makeStepKey(lessonNumber, stepIdx))
            }
          />
        </View>
      ) : null}
    </ScrollView>

    {/* Footer */}
    <View style={styles.footer}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* PREVIOUS */}
        <TouchableOpacity
          style={[styles.navBtn, safeStepIndex === 0 && styles.navDisabled]}
          onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={safeStepIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={safeStepIndex === 0 ? "#aaa" : "#c05454"}
          />
          <Text
            style={[
              styles.navText,
              safeStepIndex === 0 && { color: "#aaa" },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* RIGHT SIDE BUTTON GROUP */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isDone ? (
            <TouchableOpacity
              style={[styles.btn, { marginRight: 8 }]}
              onPress={unmarkDone}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.btnText}>Marked</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnGhost, { marginRight: 8 }]}
              onPress={markDone}
            >
              <Ionicons name="ellipse-outline" size={18} color="#c05454" />
              <Text style={styles.btnGhostText}>Mark done</Text>
            </TouchableOpacity>
          )}

          {/* NEXT */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
              if (safeStepIndex >= steps.length - 1) {
                if (lesson < TOTAL_LESSONS) {
                  setLesson(lesson + 1);
                  setStepIndex(0);
                }
              } else {
                setStepIndex((i) => Math.min(steps.length - 1, i + 1));
              }
              scrollToTop();
            }}
          >
            <Text style={styles.btnPrimaryText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#c05454" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

/* ---- MAIN OUTER VIEW ---- */
const CIRCUIT_FIXED_WIDTH = 800;

const BOTH_MIN_LEFT_RATIO = 0.35;
const BOTH_MAX_LEFT_RATIO = 0.65;
const BOTH_MIN_PX = 320;

const CODE_ONLY_DEFAULT_LEFT_RATIO = 0.6; // bigger left pane => smaller code editor
const SPLIT_PERSIST_CODE_ONLY = "esb:split:codeOnly:leftRatio:v2";
const SPLIT_PERSIST_BOTH = "esb:split:both:leftRatio:v2";

return (
  <View style={styles.screen}>
    {showBoth ? (
      /* BOTH tools open: lesson hidden */
      <SplitView
        left={<CircuitEditor showExit onExit={exitTools} />}
        right={<ArduinoEditor />}
        initialLeftRatio={0.55}
        persistKey={SPLIT_PERSIST_BOTH}
        minLeftRatio={BOTH_MIN_LEFT_RATIO}
        maxLeftRatio={BOTH_MAX_LEFT_RATIO}
        minLeftPx={BOTH_MIN_PX}
        minRightPx={BOTH_MIN_PX}
      />
    ) : showEditor || showCircuit ? (
      /* ONE tool open: lesson visible on left */
      <SplitView
        left={leftPane}
        right={
          showCircuit ? (
            <CircuitEditor showExit onExit={exitTools} />
          ) : (
            <ArduinoEditor />
          )
        }

        // Code-only mode: smaller editor by default + remember user resize
        initialLeftRatio={!showCircuit && showEditor ? CODE_ONLY_DEFAULT_LEFT_RATIO : 0.6}
        persistKey={!showCircuit && showEditor ? SPLIT_PERSIST_CODE_ONLY : null}
        minRightPx={!showCircuit && showEditor ? 320 : 0}
        maxLeftRatio={!showCircuit && showEditor ? 0.9 : 0.85}

        // Circuit-only mode: fixed size (no resize)
        fixedRightPx={showCircuit && !showEditor ? CIRCUIT_FIXED_WIDTH : null}
      />
    ) : (
      /* No tools open: just lesson */
      leftPane
    )}
  </View>
);

}
/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafafa" },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  backText: { color: "#c05454", fontWeight: "700" },

  /* EDITOR BUTTON (top-right) */
editorToggleBtn: {
  backgroundColor: "#0f172a",
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 8,
},
  editorToggleText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    fontFamily: "monospace",
  },

  titleWrap: { paddingHorizontal: 18, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "800" },
  p: { fontSize: 15, color: "#444", marginTop: 2, lineHeight: 22 },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7bcbc",
  },
  tabBtnActive: { backgroundColor: "#c05454", borderColor: "#c05454" },
  tabText: { color: "#c05454", fontWeight: "700" },
  tabTextActive: { color: "#fff" },

  progressBarWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: { height: 6, backgroundColor: "#c05454" },
  progressLabel: { color: "#666", fontSize: 12, paddingTop: 4 },

  progressGroup: {
    marginTop: 4,
  },
  progressHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  progressBarFillSecondary: {
    height: 6,
    backgroundColor: "#f97316", // orange-ish for lesson progress
  },
  container: { padding: 18 },

  stepOuter: {
    backgroundColor: "#ffe4e6",
    borderRadius: 16,
    padding: 10,
    width: "75%",        // only take 75% of the screen width
    alignSelf: "flex-start", // stick to the left, not centered
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },

  stepHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  codeCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    maxWidth: 1200
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

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff8db",
    borderWidth: 1,
    borderColor: "#ecd892",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  hintText: { fontSize: 14, color: "#6a5c1d", flex: 1, lineHeight: 20 },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  navBtn: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navDisabled: { borderColor: "#ccc" },
  navText: { color: "#c05454", fontWeight: "700" },

  btnPrimary: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnPrimaryText: { color: "#c05454", fontWeight: "800" },

  btn: {
    backgroundColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhost: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnGhostText: { color: "#c05454", fontWeight: "700" },

  gifCard: {
    backgroundColor: "#fff8db",       // soft light-yellow background
    borderWidth: 1,
    borderColor: "#ecd892",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    alignSelf: "center",   // don’t stretch full width of parent
    width: "100%",         // still responsive on small screens
    maxWidth: 600,         // cap how wide it can get 
  },

  gifImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#e8e6e6ff",
  },

  gifCaption: {
    fontSize: 13,
    color: "#6a5c1d",
    marginTop: 6,
    fontStyle: "italic",
  },

  inlineCode: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),

    backgroundColor: "#e2e6f1ff",
    color: "#111827",
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: "600",
  },

  boldGeneral: {
    fontWeight: "600",
    color: "#3a3c3fff",
  },

  boldWiring: {
    fontWeight: "800",
    color: "#c05454", // deep red
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  boldSetup: {
    fontWeight: "800",
    color: "#0b82dd", // blue for setup
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  boldLoop: {
    fontWeight: "800",
    color: "#16a34a", // green for loop
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  codeNormal: {
    color: "#a3a5a3ff",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 14,
    lineHeight: 20,
  },

  // highlighted (WHITE) segments: ^^...^^
  codeHighlight: {
    color: "#cdced1ff",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 14,
    lineHeight: 20,
  },

  // editable blanks in the code
  codeBlankInput: {
    minWidth: 20,              // small default width
    paddingHorizontal: 0,
    paddingVertical: 0.5,
    marginHorizontal: 0,
    marginRight: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#5e6d8b6a",
    color: "#a3a5a3ff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",       // keeps typed text centered
    fontFamily: CODE_FONT,
    flexShrink: 0,
    color: "#a3a5a3ff"
  },

  codeBlankInputHighlight: {
    color: "#cdced1ff",              // match highlighted code color
    borderBottomColor: "#5e6d8b6a",  // lighter underline in highlight
    fontFamily: CODE_FONT
  },

  codeLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },

  inlineCodeStrong: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),

    backgroundColor: "#d1d8f7",       // slightly brighter bubble
    color: "#000",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 16,                      // bigger
    fontWeight: "800",                 // MUCH bolder
  },

  stepDescBlock: {
    marginTop: 6,
    marginBottom: 8,
  },
  richTextLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  stepDescText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  inlineBlankInput: {
    minWidth: 45,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    marginHorizontal: 3,
    marginRight: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#f7f8fa",

  borderRadius: 6,
    //flexShrink: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },

  lessonLayoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  lessonSidebar: {
    marginLeft: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexShrink: 1,
  },

  sidebarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  sidebarLessonBlock: {
    marginBottom: 12,
  },

  sidebarLessonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
  },
  sidebarLessonTitleActive: {
    color: "#c05454",
  },

  sidebarStepRow: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  sidebarStepRowActive: {
    backgroundColor: "#fee2e2",
  },

  sidebarStepText: {
    fontSize: 13,
    color: "#374151",
  },
  sidebarStepTextActive: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  sidebarExpanded: {
    maxWidth: 500,       // expand when editor is hidden
    flexGrow: 1,         // take up available space
  },

  sidebarStepRowDone: {
    backgroundColor: "#eaf9f0ff",      // light green
  },

  sidebarStepTextDone: {
    color: "#15803d",
    fontWeight: "600",
  },

  topicTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: "600",
    color: "#7b221bff",      // dark slate
  },

  syntaxType: {
    color: "#4EC9B0",      // teal for void/int/bool/etc.
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxControl: {
    color: "#a1cd75ff",      // green for if/else/return
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxArduinoFunc: {
    color: "#ce9261ff",      // pinMode / Serial / etc.
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxComment: {
    color: "#82a8abff",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxString: {
    color: "#CE9178",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxNumber: {
    color: "#B5CEA8",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  blankCorrect: {
    borderBottomColor: "#16a34a", // green
  },

  blankIncorrect: {
    borderBottomColor: "#dc2626", // red
  },

  // NEW: wrapper + red dot + hint box styles
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

  blankHintTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: 2,
  },

  blankHintText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },

  codeHeaderButtons: {
  flexDirection: "row",        
  alignItems: "center",
  gap: 8,
  },

  hintContent: {
  flex: 1,
},

aiHintDivider: {
  width: "100%",      // full width of the hint content column
  height: 1,
  backgroundColor: "#ab9a9aff",
  marginVertical: 8,
  marginTop: 6,
  marginBottom: 6,
  alignSelf: "stretch",
},

aiStageButton: {
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "#2563eb",
  alignItems: "center",
  justifyContent: "center",
},
aiStageButtonText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#2563eb",
},
headerRightCol: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  marginLeft: "auto",
},
circuitBtn: {
  backgroundColor: "#c05454",
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 8,
},

circuitBtnText: {
  color: "white",
  fontWeight: "800",
  fontSize: 14,
},

codeLineRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  flexWrap: "nowrap",
},

codePartCol: {
  flexDirection: "row",
  alignItems: "flex-start",
  // IMPORTANT: no flexWrap here for stable column width
  flexWrap: "nowrap",
},

codeCommentCol: {
  marginLeft: 5,
  color: "#82a8abff", // match styles.syntaxComment color
  fontFamily: CODE_FONT,
  fontSize: 14,
  lineHeight: 20,
  flexShrink: 0,         // don't shrink into wrapping
},


});