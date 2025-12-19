// app/projects/electric-status-board/index.js

import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

/* ------- Progress constants (from old learn.js) ------- */
const TOTAL_CIRCUIT_STEPS = 4;

const STORAGE_KEYS = {
  circuitDoneSet: "esb:circuit:doneSet",
  codingOverallProgress: "esb:coding:beginner:overallProgress",
  codingAdvOverallProgress: "esb:coding:advanced:overallProgress",
};

export default function ElectricStatusBoard() {
  const router = useRouter();

  // progress state (from learn.js)
  // progress state (from learn.js)
    const [circuitPct, setCircuitPct] = React.useState(0);
    const [codingPct, setCodingPct] = React.useState(0);
    const [codingAdvPct, setCodingAdvPct] = React.useState(0);
  // scroll refs
  const scrollRef = React.useRef(null);
  const learnY = React.useRef(0);

  const computePct = (doneCount, total) =>
    total > 0 ? Math.min(100, Math.round((doneCount / total) * 100)) : 0;

  const loadProgress = React.useCallback(async () => {
    try {
      const [dCircuit, dCodingOverall, dCodingAdvOverall] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.circuitDoneSet),
        AsyncStorage.getItem(STORAGE_KEYS.codingOverallProgress),
        AsyncStorage.getItem(STORAGE_KEYS.codingAdvOverallProgress),
      ]);

      // Circuit progress from doneSet
      const arrCircuit = dCircuit ? JSON.parse(dCircuit) : [];
      const circuitCount = Array.isArray(arrCircuit) ? arrCircuit.length : 0;
      setCircuitPct(computePct(circuitCount, TOTAL_CIRCUIT_STEPS));

      // Coding progress as direct %
      if (dCodingOverall !== null) {
        const stored = JSON.parse(dCodingOverall);
        const pct =
          typeof stored === "number" && !Number.isNaN(stored) ? stored : 0;
        setCodingPct(pct);
      } else {
        setCodingPct(0);
      }

      if (dCodingAdvOverall !== null) {
        const stored = JSON.parse(dCodingAdvOverall);
        const pct = typeof stored === "number" && !Number.isNaN(stored) ? stored : 0;
        setCodingAdvPct(pct);
      } else {
        setCodingAdvPct(0);
      }
    } catch (e) {
      console.warn("Failed to load progress:", e);
    }
  }, []);

  React.useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      return undefined;
    }, [loadProgress])
  );

  // Back behavior (same as old learn.js logic)
  const goBackOrProjects = () => {
    try {
      if (router?.canGoBack?.()) {
        router.back();
      } else {
        router.replace("/second");
      }
    } catch {
      router.replace("/second");
    }
  };

  // Scroll down to learn section (replaces routing to /learn)
  const handleStartLearning = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(learnY.current - 20, 0),
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Single Stack.Screen now — one combined page */}
      <Stack.Screen
        options={{ title: "Electric Status Board", headerShown: false }}
      />

      {/* BACK BUTTON BLOCK */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goBackOrProjects}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color="#c05454" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* WHOLE PAGE SCROLLABLE: top = overview, bottom = learn section */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollOuter}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ---------- TOP: OVERVIEW SECTION ---------- */}
          <Text style={styles.title}>Electric Status Board</Text>
          <Text style={styles.subtitle}>
            Build a programmable LCD status board that displays messages such as:
            {"\n"}• Studying {"\n"}• Do Not Disturb {"\n"}• Sleeping {"\n"}• Gaming
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal</Text>
            <Text style={styles.sectionText}>
              You will build a display that shows a customizable status message
              using an Arduino + LCD. It will allow the user to cycle through
              modes using buttons.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You’ll Learn</Text>
            <Text style={styles.sectionText}>
              • Digital input (buttons){"\n"}
              • LCD output (I²C){"\n"}
              • Menus + navigation{"\n"}
              • Arrays & variables
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Needed</Text>
            <Text style={styles.sectionText}>
              • Arduino UNO or Nano{"\n"}
              • 20×4 or 16×2 I²C LCD{"\n"}
              • 3 Pushbuttons{"\n"}
              • Breadboard + wires
            </Text>
          </View>

          {/* Start Learning scrolls to learn section */}
          <TouchableOpacity style={styles.button} onPress={handleStartLearning}>
            <Text style={styles.buttonText}>Start Learning</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kitButton}
            onPress={() => router.push("/kits/electric-status-board")}
          >
            <Text style={styles.kitButtonText}>Find Kits</Text>
          </TouchableOpacity>

          {/* ---------- BOTTOM: LEARN SECTION ---------- */}
          <View
            style={styles.learnBlock}
            onLayout={(e) => {
              learnY.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.learnTitle}>Electric Status Board</Text>
            <Text style={styles.learnSubtitle}>
              Follow the steps to build the prototype.
            </Text>

            {/* 🔹 NEW: main two-column layout: left = cards, right = figure 🔹 */}
            <View style={styles.learnMainRow}>
              {/* LEFT COLUMN: Circuit + Coding stacked */}
              <View style={styles.learnLeftCol}>
                {/* CIRCUIT CARD */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    router.push("/projects/electric-status-board/circuit")
                  }
                >
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={26}
                      color="#fff"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>1) Circuit</Text>
                    <Text style={styles.cardText}>
                      Wire the OLED and buttons step-by-step.
                    </Text>

                    <View
                      style={styles.barWrap}
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        now: circuitPct,
                        min: 0,
                        max: 100,
                      }}
                    >
                      <View
                        style={[styles.barFill, { width: `${circuitPct}%` }]}
                      />
                    </View>
                  </View>

                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{circuitPct}%</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#aaa"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* CODING CARD */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    router.push("/projects/electric-status-board/codeBeg")
                  }
                >
                  <View style={styles.iconWrap2}>
                    <Ionicons name="code-slash" size={26} color="#fff" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>2) Coding</Text>
                    <Text style={styles.cardText}>
                      Program menus and button logic.
                    </Text>

                    <View
                      style={styles.barWrap}
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        now: codingPct,
                        min: 0,
                        max: 100,
                      }}
                    >
                      <View
                        style={[styles.barFill, { width: `${codingPct}%` }]}
                      />
                    </View>
                  </View>

                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{codingPct}%</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#aaa"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* ADVANCED CODING CARD */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    router.push("/projects/electric-status-board/codeAdv")
                  }
                >
                  <View style={styles.iconWrap3}>
                    <Ionicons name="code-working" size={26} color="#fff" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>3) Advanced Coding</Text>
                    <Text style={styles.cardText}>
                      Advanced logic, optimization, and custom features.
                    </Text>

                    <View
                      style={styles.barWrap}
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        now: codingAdvPct,
                        min: 0,
                        max: 100,
                      }}
                    >
                      <View
                        style={[styles.barFill, { width: `${codingAdvPct}%` }]}
                      />
                    </View>
                  </View>

                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{codingAdvPct}%</Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#aaa"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>

              {/* RIGHT COLUMN: GIF + figure description */}
              <View style={styles.figureWrapper}>
                <Image
                  source={require("../../../assets/videos/CurioLabP1.gif")}
                  style={styles.figureImage}
                  resizeMode="contain"
                />
                <View style={styles.figureCard}>
                  <Text style={styles.figureTitle}>
                    Figure: Electric Status Board demo
                  </Text>
                  <Text style={styles.figureText}>
                    This animation shows the status board cycling through
                    different messages as you press the buttons. Your final
                    project will behave just like this: the display text changes
                    while the hardware (Arduino, buttons, and LCD) stays the
                    same.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffffff" },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
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
    alignSelf: "flex-start",
  },
  backText: { color: "#c05454", fontWeight: "700" },

  scrollOuter: {
    paddingVertical: 18,
    alignItems: "center",
  },

  contentWrapper: {
    width: "95%",
    maxWidth: 1200,
    gap: 16,
  },

  /* --- Top overview section --- */
  title: { fontSize: 35, fontWeight: "700", color: "#364e39ff" },
  subtitle: { fontSize: 16, color: "#1c1c1bff", lineHeight: 22 },

  section: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    width: "100%",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  sectionText: { fontSize: 14, lineHeight: 20, color: "#444" },

  button: {
    marginTop: 10,
    backgroundColor: "#c05454",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    maxWidth: 300,
  },
  buttonText: { fontSize: 18, fontWeight: "700", color: "#fff" },

  kitButton: {
    marginTop: 0,
    backgroundColor: "white",
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "#c05454",
    maxWidth: 300,
  },
  kitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c05454",
  },

  /* --- Learn section --- */
  learnBlock: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 14,
  },
  learnTitle: { fontSize: 26, fontWeight: "800" },
  learnSubtitle: { fontSize: 15, color: "#666", marginBottom: 10 },

  /* 🔹 New two-column layout in learn section 🔹 */
  learnMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap", // so on small screens figure can wrap below
  },

  learnLeftCol: {
    flex: 1,
    minWidth: 260,
    maxWidth: 600,
    gap: 14, // vertical spacing between the two cards
  },

  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    alignItems: "center",
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#768a5aff",
    justifyContent: "center",
    alignItems: "center",
  },

  iconWrap2: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#535981ff",
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardText: { fontSize: 14, color: "#666", marginBottom: 6 },

  pill: {
    backgroundColor: "#f0e6e6",
    borderWidth: 1,
    borderColor: "#e3c9c9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { color: "#c05454", fontWeight: "800", fontSize: 12 },

  barWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
  },
  barFill: {
    height: 6,
    backgroundColor: "#c05454",
  },
  iconWrap3: {
  width: 44,
  height: 44,
  borderRadius: 10,
  backgroundColor: "#1f2937", // darker = advanced
  justifyContent: "center",
  alignItems: "center",
  },
  /* --- Figure column --- */
  figureWrapper: {
    flex: 1,
    minWidth: 260,
    maxWidth: 600,
    alignItems: "center",
    gap: 10,
  },
  figureImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#00000010",
  },
  figureCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  figureTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  figureText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4b5563",
  },
});
