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
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SplitView from "./SplitView";
import ArduinoEditor from "./ArduinoEditor";
import CircuitEditor from "./circuitEditor";
import useEditorToggle from "../hooks/useEditorToggle";
import GuidedCodeBlock from "./GuidedCodeBlock";

/* ---------------- LESSON DATA: steps per lesson ---------------- */

const getTotalLessons = (stepsObj) => Object.keys(stepsObj || {}).length;

// --- Simple Arduino-style syntax groups for example boxes ---
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
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState({});
  const [inlineWidthByName, setInlineWidthByName] = React.useState({});

  const GLOBAL_KEY = globalKey;

  /* ==========================================================
     SMALL ANALYTICS LOGGER
  ========================================================== */
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
          if (parsed && typeof parsed === "object") setGlobalBlanks(parsed);
        }
      } catch {}
    })();
  }, [GLOBAL_KEY]);

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
          if (parsed && typeof parsed === "object") setLocalBlanks(parsed);
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
  }, [GLOBAL_KEY, globalBlanks]);

  /* ==========================================================
     5. MERGED BLANKS
  ========================================================== */
  const mergedBlanks = { ...localBlanks, ...globalBlanks };

  /* ==========================================================
     RENDER DESCRIPTION WITH INLINE BLANKS + CODE
  ========================================================== */
  const renderWithInlineCode = (text) => {
    if (!text) return null;

    const lines = text.split(/\n/);

    return lines.map((line, lineIdx) => {
      if (line === "") {
        return (
          <View key={`p-line-${lineIdx}`} style={styles.richTextLine}>
            <Text style={styles.stepDescText}>{" "}</Text>
          </View>
        );
      }

      const parts = line
        .split(/(__BLANK\[[A-Z0-9_]+\]__|`[^`]+`|\*\*[^*]+\*\*)/g)
        .filter(Boolean);

      return (
        <View key={`p-line-${lineIdx}`} style={styles.richTextLine}>
          {parts.map((part, idx) => {
            const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
            if (blankMatch) {
              const name = blankMatch[1];
              const value = mergedBlanks[name] ?? "";

              const measured = inlineWidthByName[name];
              const INLINE_MIN_W = 50;
              const INLINE_MAX_W = 220;
              const INLINE_PAD_X = 10;

              const fallback = Math.max(
                INLINE_MIN_W,
                Math.min(
                  INLINE_MAX_W,
                  ((value?.length || 1) * 8) + INLINE_PAD_X
                )
              );

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

                    setActiveBlankHint((prev) =>
                      prev && prev.name === name ? null : prev
                    );

                    setAiHelpByBlank((prev) => {
                      const next = { ...prev };
                      delete next[`single:${name}`];
                      return next;
                    });
                  }}
                  onContentSizeChange={(e) => {
                    const w = e?.nativeEvent?.contentSize?.width;
                    if (!w) return;

                    const nextW = Math.max(
                      INLINE_MIN_W,
                      Math.min(INLINE_MAX_W, Math.ceil(w + INLINE_PAD_X))
                    );

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
              const code = part.slice(1, -1);

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
                <Text key={`p-code-${lineIdx}-${idx}`} style={styles.inlineCode}>
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
                <Text key={`p-bold-${lineIdx}-${idx}`} style={style}>
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
          <View style={styles.stepDescBlock}>{renderWithInlineCode(step.desc)}</View>
        ) : null}

        {step.gif ? (
          <View style={styles.gifCard}>
            <Image source={step.gif} style={styles.gifImage} resizeMode="contain" />
            <Text style={styles.gifCaption}>{step.gifCaption}</Text>
          </View>
        ) : null}

        {step.imageGrid && Array.isArray(step.imageGrid.items) ? (
          <View style={styles.imageGridWrap}>
            <View style={styles.imageGrid}>
              {step.imageGrid.items.map((it, idx) => (
                <View
                  key={`ig-${idx}`}
                  style={[
                    styles.imageGridItem,
                    { width: `${Math.floor(100 / (step.imageGrid.columns || 3))}%` },
                  ]}
                >
                  <View style={styles.imageGridImgWrap}>
                    <Image
                      source={typeof it.image === "string" ? { uri: it.image } : it.image}
                      style={styles.imageGridImg}
                      resizeMode="contain"
                    />
                  </View>
                  {!!it.label ? (
                    <Text style={styles.imageGridLabel}>{it.label}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step.descAfterCircuit ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.descAfterCircuit)}
          </View>
        ) : null}

        {/* ---- Code blocks (multi) ---- */}
        {Array.isArray(step.codes) && step.codes.length > 0 ? (
          <>
            {step.codes.map((block, idx) => (
              <View
                key={`code-block-${idx}`}
                style={{ marginTop: idx === 0 ? 12 : 16 }}
              >
                {block.topicTitle ? (
                  <Text style={styles.topicTitle}>{block.topicTitle}</Text>
                ) : null}

                {block.descBeforeCode ? (
                  <View style={styles.stepDescBlock}>
                    {renderWithInlineCode(block.descBeforeCode)}
                  </View>
                ) : null}

                <GuidedCodeBlock
                  step={step}
                  block={block}
                  blockIndex={idx}
                  storageKey={storageKey}
                  globalKey={GLOBAL_KEY}
                  apiBaseUrl={apiBaseUrl}
                  analyticsTag={analyticsTag}
                  mergedBlanks={mergedBlanks}
                  setLocalBlanks={setLocalBlanks}
                  setGlobalBlanks={setGlobalBlanks}
                  blankStatus={blankStatus}
                  setBlankStatus={setBlankStatus}
                  activeBlankHint={activeBlankHint}
                  setActiveBlankHint={setActiveBlankHint}
                  aiHelpByBlank={aiHelpByBlank}
                  setAiHelpByBlank={setAiHelpByBlank}
                  aiLoadingKey={aiLoadingKey}
                  setAiLoadingKey={setAiLoadingKey}
                  aiLastRequestAtByKey={aiLastRequestAtByKey}
                  setAiLastRequestAtByKey={setAiLastRequestAtByKey}
                  aiHintLevelByBlank={aiHintLevelByBlank}
                  setAiHintLevelByBlank={setAiHintLevelByBlank}
                  checkAttempts={checkAttempts}
                  setCheckAttempts={setCheckAttempts}
                  blankAttemptsByName={blankAttemptsByName}
                  setBlankAttemptsByName={setBlankAttemptsByName}
                  logBlankAnalytics={logBlankAnalytics}
                  styles={styles}
                />

                {block.descAfterCode ? (
                  <View style={styles.stepDescBlock}>
                    {renderWithInlineCode(block.descAfterCode)}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : step.code ? (
          /* ---- Single code block ---- */
          <>
            <GuidedCodeBlock
              step={step}
              block={{ code: step.code }}
              blockIndex={"single"}
              storageKey={storageKey}
              globalKey={GLOBAL_KEY}
              apiBaseUrl={apiBaseUrl}
              analyticsTag={analyticsTag}
              mergedBlanks={mergedBlanks}
              setLocalBlanks={setLocalBlanks}
              setGlobalBlanks={setGlobalBlanks}
              blankStatus={blankStatus}
              setBlankStatus={setBlankStatus}
              activeBlankHint={activeBlankHint}
              setActiveBlankHint={setActiveBlankHint}
              aiHelpByBlank={aiHelpByBlank}
              setAiHelpByBlank={setAiHelpByBlank}
              aiLoadingKey={aiLoadingKey}
              setAiLoadingKey={setAiLoadingKey}
              aiLastRequestAtByKey={aiLastRequestAtByKey}
              setAiLastRequestAtByKey={setAiLastRequestAtByKey}
              aiHintLevelByBlank={aiHintLevelByBlank}
              setAiHintLevelByBlank={setAiHintLevelByBlank}
              checkAttempts={checkAttempts}
              setCheckAttempts={setCheckAttempts}
              blankAttemptsByName={blankAttemptsByName}
              setBlankAttemptsByName={setBlankAttemptsByName}
              logBlankAnalytics={logBlankAnalytics}
              styles={styles}
              horizontalScroll={false}
            />

            {step.descAfterCode ? (
              <View style={styles.stepDescBlock}>
                {renderWithInlineCode(step.descAfterCode)}
              </View>
            ) : null}

            {step.circuitImage ? (
              <View style={styles.gifCard}>
                <Image
                  source={
                    typeof step.circuitImage === "string"
                      ? { uri: step.circuitImage }
                      : step.circuitImage.image
                      ? step.circuitImage.image
                      : step.circuitImage
                  }
                  style={styles.gifImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {step.hint ? (
              <View style={styles.hintBox}>
                <Ionicons name="bulb-outline" size={18} color="#6a5c1d" />
                <Text style={styles.hintText}>
                  <Text style={{ fontWeight: "700" }}>Hint: </Text>
                  {step.hint}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

/*----------------SIDE BAR---------------------*/
function LessonSidebar({
  lessonSteps,
  currentLesson,
  currentStepIndex,
  onSelectStep,
  fullWidth,
  isStepDone,
}) {
  return (
    <View style={[styles.lessonSidebar, fullWidth && styles.sidebarExpanded]}>
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
              const done = typeof isStepDone === "function" && isStepDone(lessonNum, idx);

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
                      !isActive && done && styles.sidebarStepTextDone,
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
  const _overallProgressKey = overallProgressKey || `${storagePrefix}:overallProgress`;
  const _globalBlanksKey = globalBlanksKey || `${storagePrefix}:blanks:GLOBAL`;
  const _localBlanksPrefixKey = localBlanksPrefixKey || `${storagePrefix}:blanks:LOCAL`;

  const router = useRouter();
  const { showEditor, toggle } = useEditorToggle();
  const [showCircuit, setShowCircuit] = React.useState(false);

  const showBoth = showEditor && showCircuit;

  const exitTools = () => {
    setShowCircuit(false);
    if (showEditor) toggle();
  };

  const [lesson, setLesson] = React.useState(1);
  const [stepIndex, setStepIndex] = React.useState(0);

  const scrollRef = React.useRef(null);
  const scrollToTop = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: true });
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
          if (Array.isArray(ids)) setDoneSet(new Set(ids));
        }
      } catch {}
    })();
  }, [STORAGE_KEYS.doneSet]);

  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.doneSet,
          JSON.stringify(Array.from(doneSet))
        );
      } catch {}
    })();
  }, [STORAGE_KEYS.doneSet, doneSet]);

  /* ---- safe step bounds ---- */
  const steps = lessonSteps[lesson] || [];
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;

  const makeStepKey = (lessonNumber, stepIdx) => `L${lessonNumber}-S${stepIdx}`;
  const currentStepKey = makeStepKey(lesson, safeStepIndex);

  const isDone = doneSet.has(currentStepKey);

  /* ---- PROGRESS CALCULATIONS ---- */
  const validDoneKeys = new Set();
  Object.entries(lessonSteps).forEach(([lessonNumStr, stepsArr]) => {
    const lessonNum = Number(lessonNumStr);
    (stepsArr || []).forEach((_, idx) => {
      const key = makeStepKey(lessonNum, idx);
      if (doneSet.has(key)) validDoneKeys.add(key);
    });
  });

  const overallCompletedSteps = validDoneKeys.size;
  const overallProgress =
    totalSteps > 0 ? Math.round((overallCompletedSteps / totalSteps) * 100) : 0;

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
  }, [STORAGE_KEYS.overallProgress, overallProgress]);

  let completedInThisLesson = 0;
  steps.forEach((_, idx) => {
    const key = makeStepKey(lesson, idx);
    if (doneSet.has(key)) completedInThisLesson++;
  });

  const lessonProgress =
    steps.length > 0 ? Math.round((completedInThisLesson / steps.length) * 100) : 0;

  const markDone = () =>
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });

  const unmarkDone = () =>
    setDoneSet((prev) => {
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

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace(backRoute)}>
          <Ionicons name="arrow-back" size={18} color="#c05454" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRightCol}>
          <TouchableOpacity style={styles.editorToggleBtn} onPress={toggle}>
            <Text style={styles.editorToggleText}>{`</>`}</Text>
          </TouchableOpacity>

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

      {/* Progress */}
      <View style={{ paddingHorizontal: 18 }}>
        <View style={styles.progressGroup}>
          <Text style={styles.progressHeader}>Overall progress</Text>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
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
            <Text style={[styles.navText, safeStepIndex === 0 && { color: "#aaa" }]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isDone ? (
              <TouchableOpacity style={[styles.btn, { marginRight: 8 }]} onPress={unmarkDone}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.btnText}>Marked</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btnGhost, { marginRight: 8 }]} onPress={markDone}>
                <Ionicons name="ellipse-outline" size={18} color="#c05454" />
                <Text style={styles.btnGhostText}>Mark done</Text>
              </TouchableOpacity>
            )}

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

  const CODE_ONLY_DEFAULT_LEFT_RATIO = 0.6;
  const SPLIT_PERSIST_CODE_ONLY = "esb:split:codeOnly:leftRatio:v2";
  const SPLIT_PERSIST_BOTH = "esb:split:both:leftRatio:v2";

  return (
    <View style={styles.screen}>
      {showBoth ? (
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
        <SplitView
          left={leftPane}
          right={
            showCircuit ? (
              <CircuitEditor showExit onExit={exitTools} />
            ) : (
              <ArduinoEditor />
            )
          }
          initialLeftRatio={
            !showCircuit && showEditor ? CODE_ONLY_DEFAULT_LEFT_RATIO : 0.6
          }
          persistKey={!showCircuit && showEditor ? SPLIT_PERSIST_CODE_ONLY : null}
          minRightPx={!showCircuit && showEditor ? 420 : 0}
          maxLeftRatio={!showCircuit && showEditor ? 0.9 : 0.85}
          fixedRightPx={showCircuit && !showEditor ? CIRCUIT_FIXED_WIDTH : null}
        />
      ) : (
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

  headerRightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },

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

  titleWrap: { paddingHorizontal: 18, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "800" },
  p: { fontSize: 15, color: "#444", marginTop: 2, lineHeight: 22 },

  progressBarWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: { height: 6, backgroundColor: "#c05454" },
  progressBarFillSecondary: { height: 6, backgroundColor: "#f97316" },
  progressLabel: { color: "#666", fontSize: 12, paddingTop: 4 },

  progressGroup: { marginTop: 4 },
  progressHeader: { fontSize: 12, fontWeight: "600", color: "#374151" },

  container: { padding: 18 },

  stepOuter: {
    backgroundColor: "#ffe4e6",
    borderRadius: 16,
    padding: 10,
    width: "75%",
    alignSelf: "flex-start",
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },

  stepHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  stepDescBlock: { marginTop: 8, marginBottom: 4 },
  richTextLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  stepDescText: { fontSize: 14, color: "#4b5563", lineHeight: 22 },

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

  inlineCodeStrong: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    backgroundColor: "#d1d8f7",
    color: "#000",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 16,
    fontWeight: "800",
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
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },

  boldGeneral: { fontWeight: "600", color: "#3a3c3fff" },
  boldWiring: {
    fontWeight: "800",
    color: "#c05454",
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },
  boldSetup: {
    fontWeight: "800",
    color: "#0b82dd",
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },
  boldLoop: {
    fontWeight: "800",
    color: "#16a34a",
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
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

  gifCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
    elevation: 0,
    alignSelf: "center",
    width: "100%",
    maxWidth: 600,
  },
  gifImage: {
    width: "100%",
    height: 500,
    aspectRatio: 16 / 9,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  gifCaption: {
    fontSize: 13,
    color: "#6a5c1d",
    marginTop: 3,
    fontStyle: "italic",
  },

  lessonLayoutRow: { flexDirection: "row", alignItems: "flex-start" },

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
  sidebarLessonBlock: { marginBottom: 12 },
  sidebarLessonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
  },
  sidebarLessonTitleActive: { color: "#c05454" },

  sidebarStepRow: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  sidebarStepRowActive: { backgroundColor: "#fee2e2" },
  sidebarStepRowDone: { backgroundColor: "#eaf9f0ff" },

  sidebarStepText: { fontSize: 13, color: "#374151" },
  sidebarStepTextActive: { color: "#b91c1c", fontWeight: "700" },
  sidebarStepTextDone: { color: "#15803d", fontWeight: "600" },

  sidebarExpanded: { maxWidth: 500, flexGrow: 1 },

  topicTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: "600",
    color: "#7b221bff",
  },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
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

  // placeholders to match references in your JSX (won't break build)
  imageGridWrap: {},
  imageGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  imageGridItem: { padding: 8, marginBottom: 12, alignItems: "center" },
  imageGridImgWrap: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  imageGridImg: { width: "100%", height: "100%" },
  imageGridLabel: {
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
});
