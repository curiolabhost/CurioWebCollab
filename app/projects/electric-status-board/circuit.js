// circuit.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---- Split + Editor (same paths & API as code.js) ---- */
import SplitView from "./components/SplitView";
import ArduinoEditor from "./components/ArduinoEditor";
import useEditorToggle from "./hooks/useEditorToggle";
import CircuitEditor from "./components/circuitEditor";

export default function Circuit() {
  return <CircuitLessons />;
}

/* -------------------- Data -------------------- */

const MATERIALS = [
  { name: "Arduino UNO (or Nano)", uri: "https://dummyimage.com/600x400/eeeeee/000000.png&text=Arduino+UNO" },
  { name: "SSD1306 OLED (I2C, 128x64/128x32)", uri: "https://dummyimage.com/600x400/eeeeee/000000.png&text=SSD1306+OLED+I2C" },
  { name: "3× Momentary Pushbuttons", uri: "https://dummyimage.com/600x400/eeeeee/000000.png&text=Pushbuttons" },
  { name: "Breadboard", uri: "https://dummyimage.com/600x400/eeeeee/000000.png&text=Breadboard" },
  { name: "Jumper Wires", uri: "https://dummyimage.com/600x400/eeeeee/000000.png&text=Jumper+Wires" },
];

const STEPS = [
  {
    id: 1,
    title: "Materials & OLED Wiring (Power + I²C)",
    imageUri: "https://dummyimage.com/1200x700/ddd/000.png&text=OLED+Circuit+Photo+Placeholder",
    sections: [
      {
        subtitle: "Power the OLED",
        why: "The SSD1306 OLED needs stable power.",
        do: [
          "OLED VCC → 5V (or 3.3V if your board requires).",
          "OLED GND → GND.",
          "Raw panels (no breakout) usually need 3.3V only.",
        ],
      },
      {
        subtitle: "I²C Data Lines (OLED ↔ Arduino)",
        why: "I²C uses SDA (data) and SCL (clock). On UNO, SDA=A4, SCL=A5.",
        do: ["OLED SDA → A4", "OLED SCL → A5", "Common I²C address is 0x3C (sometimes 0x3D)."],
      },
    ],
  },
  {
    id: 2,
    title: "Install OLED Libraries",
    sections: [
      {
        subtitle: "Adafruit Drivers",
        why: "Display driver + graphics helpers for text/shapes.",
        do: [
          "Arduino IDE → Tools → Manage Libraries…",
          "Install “Adafruit SSD1306”",
          "Install “Adafruit GFX Library”",
          "Restart IDE so examples appear.",
        ],
        imageUri: "https://dummyimage.com/1200x700/ddd/000.png&text=Arduino+IDE+Library+Manager",
        imageCaption: "Install Adafruit SSD1306 and Adafruit GFX.",
      },
      {
        subtitle: "Common Issues",
        why: "Quick fixes if it won’t compile or screen is blank.",
        do: [
          "“SSD1306 allocation failed” → choose correct screen size example.",
          "If blank: confirm I²C address (0x3C/0x3D) and wiring.",
          "Reconnect USB and press reset if uploads stall.",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Run an Example (Sanity Check)",
    sections: [
      {
        subtitle: "Open Example Code",
        why: "Confirm screen works before writing menus.",
        do: [
          "File → Examples → Adafruit SSD1306 → ssd1306_128x64 (or 128x32).",
          "Loads a test sketch that draws shapes/text.",
        ],
        imageUri: "https://dummyimage.com/1200x700/ddd/000.png&text=File+%E2%86%92+Examples+%E2%86%92+Adafruit+SSD1306",
        imageCaption: "Finding the SSD1306 example in Arduino IDE.",
      },
      {
        subtitle: "Upload Test Sketch",
        why: "If it runs, wiring+libraries are good.",
        do: ["Select board + COM port", "Upload (right-arrow)"],
        imageUri: "https://dummyimage.com/1200x700/ddd/000.png&text=Click+Upload+%28Right-Arrow%29",
        imageCaption: "Flash the example.",
      },
      {
        subtitle: "What You Should See",
        why: "Visual confirmation of success.",
        do: ["Adafruit splash", "Scrolling/updating text", "If graphics appear → SUCCESS!"],
        imageUri: "https://dummyimage.com/1200x700/ddd/000.png&text=OLED+Test+Output",
        imageCaption: "Expected output after upload.",
      },
    ],
  },
  {
    id: 4,
    title: "Buttons with Internal Pull-Ups",
    sections: [
      { customDiagram: true, do: [] },
      {
        subtitle: "2-Leg Buttons (Simple)",
        why: "Two terminals: one to pin, one to GND.",
        imageUri:
          "https://dummyimage.com/1200x500/ffffff/000000.png&text=2-Leg:+Pin+%E2%86%92+Button+%E2%86%92+GND+(INPUT_PULLUP)",
        imageCaption: "Pressed ties the pin to GND (reads LOW).",
        do: [
          "Use pinMode(pin, INPUT_PULLUP).",
          "Prev: D2 ↔ GND",
          "Next: D3 ↔ GND",
          "Select: D4 ↔ GND",
        ],
      },
      {
        subtitle: "4-Leg Buttons (Breadboard)",
        why: "Legs are paired internally; straddle the gap.",
        imageUri:
          "https://dummyimage.com/1200x500/ffffff/000000.png&text=4-Leg:+Across+breadboard+gap",
        imageCaption: "Place across the gap so pairs are split.",
        do: ["Ensure proper orientation", "D2/D3/D4 to one side; other side to GND"],
      },
    ],
  },
];

const TOTAL_LESSONS = 4;
const STORAGE_KEYS = { doneSet: "esb:circuit:doneSet" };

/* -------------------- Screen -------------------- */

export function CircuitLessons() {
  const router = useRouter();
  const { showEditor, toggle } = useEditorToggle(); // SAME API as code.js


  const [showCircuit, setShowCircuit] = React.useState(false);

  const showBoth = showEditor && showCircuit;

  const exitTools = () => {
    // Close BOTH tools and return to lessons
    setShowCircuit(false);
    if (showEditor) toggle();
  };

  const [lesson, setLesson] = React.useState(1);
  const [doneSet, setDoneSet] = React.useState(new Set());

  const isDone = doneSet.has(lesson);
  const progress = Math.round((doneSet.size / TOTAL_LESSONS) * 100);

  // load progress
  React.useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem(STORAGE_KEYS.doneSet);
        if (d) {
          const arr = JSON.parse(d);
          const ids = Array.isArray(arr) ? arr.map((n) => Number(n)) : [];
          setDoneSet(new Set(ids));
        }
      } catch (e) {
        console.warn("Failed to load circuit lessons progress:", e);
      }
    })();
  }, []);

  // save progress
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.doneSet,
          JSON.stringify(Array.from(doneSet))
        );
      } catch (e) {
        console.warn("Failed to save circuit lessons progress:", e);
      }
    })();
  }, [doneSet]);

  const markDone = () => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.add(lesson);
      return next;
    });
  };

  const unmarkDone = () => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.delete(lesson);
      return next;
    });
  };

  const step = STEPS[lesson - 1] || STEPS[0];

  /* ---- LEFT PANE (content) ---- */
  const leftPane = (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back + Editor Toggle (top-right) */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/projects/electric-status-board/learn")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color="#c05454" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editorToggleBtn} onPress={toggle}>
          <Text style={styles.editorToggleText}>{`</>`}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circuitToggleBtn}
          onPress={() => setShowCircuit((v) => !v)}
        >
          <Text style={styles.circuitToggleText}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Title + Tabs */}
      <View style={styles.titleWrap}>
        <Text style={styles.h1}>Circuitry Lessons</Text>
        <Text style={styles.p}>Wire the OLED and buttons step-by-step.</Text>
      </View>

      <View style={styles.tabRow}>
        {[1, 2, 3, 4].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.tabBtn, lesson === n && styles.tabBtnActive]}
            onPress={() => setLesson(n)}
          >
            <Text style={[styles.tabText, lesson === n && styles.tabTextActive]}>
              Lesson {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: 18 }}>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{progress}% complete</Text>
      </View>

      {/* Lesson body */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h2}>{step.title}</Text>

        {/* Lesson 1 materials */}
        {lesson === 1 ? (
          <>
            <Text style={[styles.p, { marginBottom: 6 }]}>Gather these parts first.</Text>
            <View style={styles.grid}>
              {MATERIALS.map((m, i) => (
                <View key={i} style={styles.matCard}>
                  <Image source={{ uri: m.uri }} style={styles.matImg} resizeMode="cover" />
                  <Text style={styles.matLabel}>{m.name}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Step hero image (optional) */}
        {step.imageUri ? (
          <View style={styles.card}>
            <Text style={styles.h3}>Reference Photo</Text>
            <Image source={{ uri: step.imageUri }} style={styles.circuitImg} resizeMode="cover" />
            <Text style={styles.caption}>Replace with your actual build photo when ready.</Text>
          </View>
        ) : null}

        {/* Sections */}
        {Array.isArray(step.sections)
          ? step.sections.map((sec, idx) => (
              <View key={idx} style={styles.card}>
                {sec.subtitle ? <Text style={styles.h3}>{sec.subtitle}</Text> : null}
                {sec.why ? <Text style={styles.p}>{sec.why}</Text> : null}

                {sec.customDiagram ? (
                  <View style={styles.diagramWrap}>
                    {[{ label: "Prev", icon: "gesture-tap-button" },
                      { label: "Next", icon: "gesture-tap-button" },
                      { label: "Select", icon: "gesture-tap-button" }].map((btn, i) => (
                      <View key={i} style={styles.circleBlock}>
                        <MaterialCommunityIcons name={btn.icon} size={42} color="#09639bff" />
                        <Text style={styles.circleLabel}>{btn.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {sec.imageUri ? (
                  <>
                    <Image source={{ uri: sec.imageUri }} style={styles.secImg} resizeMode="cover" />
                    {sec.imageCaption ? (
                      <Text style={styles.secCaption}>{sec.imageCaption}</Text>
                    ) : null}
                  </>
                ) : null}

                {Array.isArray(sec.do) && sec.do.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {sec.do.map((line, j) => (
                      <Text key={j} style={styles.li}>
                        • {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          : null}

        {/* Quick UNO pin reference */}
        {lesson === 4 ? (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.h3}>Pin Reference (UNO)</Text>
            <Text style={styles.mono}>
              SDA → A4{"\n"}
              SCL → A5{"\n"}
              Prev → D2 (to GND on press){"\n"}
              Next → D3 (to GND on press){"\n"}
              Select → D4 (to GND on press)
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer: Mark done / Done button */}
      <View style={styles.footer}>
        <View style={styles.row}>
          {isDone ? (
            <TouchableOpacity style={styles.btn} onPress={unmarkDone}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.btnText}>Mark as done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnGhost} onPress={markDone}>
              <Ionicons name="close-circle" size={18} color="#c05454" />
              <Text style={styles.btnGhostText}>Mark as not done</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btnPrimaryWide, { marginLeft: 8 }]}
            onPress={() => router.replace("/projects/electric-status-board/learn")}
          >
            <Text style={styles.btnPrimaryWideText}>Done</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

/* ---- MAIN OUTER VIEW ---- */
// pick whatever size you want for the circuit editor when it's the only tool open
const CIRCUIT_FIXED_WIDTH = 1000;

// ratio limits when BOTH editors are open (tools-only mode)
const BOTH_MIN_LEFT_RATIO = 0.35; // circuit min %
const BOTH_MAX_LEFT_RATIO = 0.65; // circuit max %
const BOTH_MIN_PX = 320;          // keep either pane usable

return (
  <View style={styles.screen}>
    {showBoth ? (
      <>
        {/* BOTH tools: resizable but constrained by ratio */}
      <SplitView
        left={<CircuitEditor showExit onExit={exitTools} />}
        right={<ArduinoEditor />}
        initialLeftRatio={0.55}
        minLeftRatio={BOTH_MIN_LEFT_RATIO}
        maxLeftRatio={BOTH_MAX_LEFT_RATIO}
        minLeftPx={BOTH_MIN_PX}
        minRightPx={BOTH_MIN_PX}
      />
      </>
    ) : showEditor || showCircuit ? (
      <SplitView
        left={leftPane}
        right={showCircuit ? <CircuitEditor /> : <ArduinoEditor />}

        // ONLY circuit open: hard set size (no resize)
        fixedRightPx={showCircuit && !showEditor ? CIRCUIT_FIXED_WIDTH : null}
      />
    ) : (
      leftPane
    )}
  </View>
);

}

/* -------------------- Styles (kept aligned with code.js) -------------------- */

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

  /* Editor button (top-right) */
  editorToggleBtn: {
    marginLeft: "auto",
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

  circuitToggleBtn: {
    marginLeft: 10,
    backgroundColor: "#c05454",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  circuitToggleText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  titleWrap: { paddingHorizontal: 18, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "800" },
  h2: { fontSize: 18, fontWeight: "800" },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  p: { fontSize: 15, color: "#444", lineHeight: 22 },

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

  container: { padding: 18 },

  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, elevation: 2 },

  li: { fontSize: 15, color: "#444", lineHeight: 22, marginTop: 2 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matCard: { width: "48%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 2 },
  matImg: { width: "100%", height: 110, backgroundColor: "#eee" },
  matLabel: { padding: 10, fontSize: 13.5, fontWeight: "600", color: "#222" },

  circuitImg: {
    width: "100%",
    height: 190,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 6,
  },
  caption: { fontSize: 12, color: "#666", marginTop: 6 },
  secImg: {
    width: "100%",
    height: 190,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 8,
  },
  secCaption: { fontSize: 12, color: "#666", marginTop: 6 },

  diagramWrap: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 20,
  },
  circleBlock: { alignItems: "center", gap: 6 },
  circleLabel: { fontSize: 14, fontWeight: "600", color: "#333" },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },

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
  btnPrimaryWide: {
    backgroundColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  btnPrimaryWideText: { color: "#fff", fontWeight: "800" },

  mono: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
});
