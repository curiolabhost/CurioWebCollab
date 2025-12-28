"use client";

import * as React from "react";
import styles from "./GuidedCodeBlock.module.css";

/* =========================
   Keyword sets (unchanged)
========================= */
const TYPE_SET = new Set([
  "void","int","long","float","double","char","bool","boolean",
  "unsigned","short","byte","word","String","static","const",
]);

const CONTROL_SET = new Set([
  "for","while","do","switch","case","break","continue","if","else",
  "#define","#include",
]);

const ARDUINO_SET = new Set([
  "setup","loop","pinMode","digitalWrite","digitalRead","analogWrite",
  "analogRead","delay","millis","micros","Serial","Serial.begin",
  "Serial.print","Serial.println","HIGH","LOW","INPUT","OUTPUT","INPUT_PULLUP",
]);

const CHAR_W = 8.6;

/* =========================
   Component
========================= */
export default function GuidedCodeBlock(props: any) {
  const {
    step,
    block,
    blockIndex,
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
    aiHintLevelByBlank,
    setAiHintLevelByBlank,
    logBlankAnalytics,
    apiBaseUrl,
    analyticsTag,
  } = props;

  const code = block?.code || step?.code || "";
  const answerKey = block?.answerKey || step?.answerKey || {};

  const [localValues, setLocalValues] = React.useState(mergedBlanks || {});
  const localRef = React.useRef(localValues);
  localRef.current = localValues;

  React.useEffect(() => {
    setLocalValues((prev: Record<string, any>) => ({ ...mergedBlanks, ...prev }));
  }, [mergedBlanks]);

  /* =========================
     Syntax rendering
  ========================= */
  function renderToken(token: string, key: number) {
    let cls = styles.codeHighlight;
    if (token.startsWith("//")) cls = styles.syntaxComment;
    else if (TYPE_SET.has(token)) cls = styles.syntaxType;
    else if (CONTROL_SET.has(token)) cls = styles.syntaxControl;
    else if (ARDUINO_SET.has(token)) cls = styles.syntaxArduinoFunc;

    return (
      <span key={key} className={cls}>
        {token}
      </span>
    );
  }

  /* =========================
     Render
  ========================= */
  return (
    <div className={styles.codeCard}>
      <div className={styles.codeCardHeader}>
        <div className={styles.codeCardTitle}>Example Code</div>

        <div className={styles.codeHeaderButtons}>
          <button
            className={styles.copyBtn}
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Copy to Editor
          </button>
        </div>
      </div>

      <div className={styles.codeBox}>
        {code.split("\n").map((line: string, lineIdx: number) => (
          <div key={lineIdx} className={styles.codeLineRow}>
            <span className={styles.codeNormal}>
              {line.split(/(\s+)/).map(renderToken)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
