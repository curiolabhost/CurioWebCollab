// app/guided-code-example/page.tsx
"use client";

import GuidedCodeBlock from "@/src/lesson-core/GuidedCodeBlock"; // Adjust import path to your component location
import { useState } from "react";

// Minimal lesson step data (matches GuidedCodeBlock's expected structure)
const LESSON_STEP = {
  title: "Arduino Serial Communication",
  phrase: "Learn to send data over serial port",
  codeTitle: "Serial Setup & Print",
  code: `^^#include <Arduino.h>^^

// Define pin for sensor
const int __BLANK[SENSOR_PIN]__ =  A0;

^^void setup()^^ {
  // Initialize serial communication
  Serial.begin(__BLANK[BAUD_RATE]__);
  
  // Wait for serial port to connect (for Leonardo/Micro)
  while (!Serial) {
    delay(10);
  }
}

^^void loop()^^ {
  // Read sensor value
  int sensorValue = analogRead(__BLANK[SENSOR_PIN_LOOP]__);
  
  // Print value to serial monitor
  Serial.println("Sensor Value: " + String(__BLANK[VALUE_VAR]__));
  
  // Add delay to stabilize readings
  delay(__BLANK[DELAY_MS]__);
}`,
  answerKey: {
    SENSOR_PIN: { equals: "SENSOR_PIN" },
    BAUD_RATE: { oneOf: ["9600", "115200"] },
    SENSOR_PIN_LOOP: { equals: "SENSOR_PIN" },
    VALUE_VAR: { equals: "sensorValue" },
    DELAY_MS: { matches: "^\\d+$", oneOf: ["100", "200", "500"] },
  },
  blankExplanations: {
    SENSOR_PIN: "Name your sensor pin constant (e.g., SENSOR_PIN)",
    BAUD_RATE: "Standard serial baud rate (9600 is most common)",
    SENSOR_PIN_LOOP: "Use the same constant defined earlier for the sensor pin",
    VALUE_VAR: "Variable that stores the analog sensor reading",
    DELAY_MS: "Delay in milliseconds between sensor readings",
  },
  blankDifficulties: {
    SENSOR_PIN: "easy",
    BAUD_RATE: "easy",
    SENSOR_PIN_LOOP: "medium",
    VALUE_VAR: "medium",
    DELAY_MS: "easy",
  },
};

export default function GuidedCodePage() {
  // Required state for GuidedCodeBlock (matches Props interface exactly)
  const [globalBlanks, setGlobalBlanks] = useState<Record<string, any>>({});
  const [localBlanks, setLocalBlanks] = useState<Record<string, any>>({});
  const [blankStatus, setBlankStatus] = useState<Record<string, boolean | null | undefined>>({});
  const [activeBlankHint, setActiveBlankHint] = useState<{
    name: string;
    text: string;
    blockIndex: number;
  } | null>(null);
  const [aiHelpByBlank, setAiHelpByBlank] = useState<Record<string, string>>({});
  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = useState<Record<string, number>>({});
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = useState<Record<string, number>>({});
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [blankAttemptsByName, setBlankAttemptsByName] = useState<Record<string, number>>({});

  // Merge local and global blanks (required by component)
  const mergedBlanks = { ...localBlanks, ...globalBlanks };

  // Minimal analytics logger (can be extended or replaced with your actual analytics)
  const logBlankAnalytics = (payload: any) => {
    console.log("Blank Interaction:", payload);
    // Optional: Send to your analytics API
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(payload) });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem", color: "#2d3748" }}>
        Guided Code Exercise: Arduino Serial Communication
      </h1>
      
      <p style={{ marginBottom: "2rem", color: "#4a5568", fontSize: "1.1rem" }}>
        Fill in the blanks to complete the Arduino code that reads a sensor and sends data over serial.
        Use the "Check Code" button to verify your answers and "?" for hints.
      </p>

      {/* Direct usage of GuidedCodeBlock (all props provided as required) */}
      <GuidedCodeBlock
        step={LESSON_STEP}
        block={LESSON_STEP}
        blockIndex={0}
        storageKey="arduino-serial-lesson"
        globalKey="arduino-global-blanks"
        apiBaseUrl="http://localhost:4000" // Keep component's default or replace with your API
        analyticsTag="arduino-serial-exercise"

        // Blank state management
        mergedBlanks={mergedBlanks}
        setLocalBlanks={setLocalBlanks}
        setGlobalBlanks={setGlobalBlanks}

        // Blank status and hints
        blankStatus={blankStatus}
        setBlankStatus={setBlankStatus}
        activeBlankHint={activeBlankHint}
        setActiveBlankHint={setActiveBlankHint}

        // AI Help features (maintained as-is)
        aiHelpByBlank={aiHelpByBlank}
        setAiHelpByBlank={setAiHelpByBlank}
        aiLoadingKey={aiLoadingKey}
        setAiLoadingKey={setAiLoadingKey}
        aiLastRequestAtByKey={aiLastRequestAtByKey}
        setAiLastRequestAtByKey={setAiLastRequestAtByKey}
        aiHintLevelByBlank={aiHintLevelByBlank}
        setAiHintLevelByBlank={setAiHintLevelByBlank}

        // Attempt tracking
        checkAttempts={checkAttempts}
        setCheckAttempts={setCheckAttempts}
        blankAttemptsByName={blankAttemptsByName}
        setBlankAttemptsByName={setBlankAttemptsByName}

        // Analytics
        logBlankAnalytics={logBlankAnalytics}

        // UI Preference (keep component's default)
        horizontalScroll={true}
      />
    </div>
  );
}