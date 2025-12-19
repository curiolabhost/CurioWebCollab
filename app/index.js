// app/index.js
// First page + subjects list on the same screen

import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const subjectsY = useRef(0);

  const handleBegin = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(subjectsY.current - 20, 0), // scroll slightly above subjects
        animated: true,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* LEFT SIDE — LOGO */}
          <Text style={styles.headerLogo}>
            <Text style={styles.logoCurio}>CURIO</Text>
            <Text style={styles.logoLab}>LAB</Text>
          </Text>

          {/* RIGHT SIDE — NAV MENU */}
          <View style={styles.navMenu}>
            <Text style={styles.navItem}>Kits</Text>
            <Text style={styles.navItem}>Programs</Text>
            <Text style={styles.navItem}>Curriculum</Text>
            <Text style={styles.navItem}>Resources</Text>
            <Text style={styles.navItem}>Blog</Text>

            {/* START BUTTON */}
            <TouchableOpacity style={styles.startBtn}>
              <Text style={styles.startBtnText}>Log in</Text>
            </TouchableOpacity>

            {/* Search */}
            <Ionicons name="search-outline" size={20} color="#1f2937" />

            {/* Cloud icon */}
            <Ionicons name="cloud-outline" size={22} color="#1f2937" />
          </View>
        </View>


        {/* Hero / first page */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            <Text style={styles.curio}>Curio</Text>
            <Text style={styles.lab}>Lab</Text>
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleBegin}>
            <Text style={styles.buttonText}>Begin</Text>
          </TouchableOpacity>
        </View>

        {/* Wrapper that we scroll to, and that centers the subject cards */}
        <View
          style={styles.subjectsOuter}
          onLayout={(e) => {
            subjectsY.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Inner section with fixed max width */}
          <View style={styles.subjectsSection}>

            {/* --- Coding card --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.iconBubble, { backgroundColor: "#0ea5e9" }]}
                >
                  <Ionicons
                    name="code-slash-outline"
                    size={22}
                    color="#111827"
                  />
                </View>
                <Text style={styles.cardTitle}>Coding</Text>
              </View>

              <View style={styles.cardBody}>
                {/* Arduino → route to /second */}
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => router.push("/second")}
                >
                  <Text style={styles.itemText}>Arduino</Text>
                </TouchableOpacity>

                {/* placeholders for future coding subjects */}
                <TouchableOpacity style={styles.itemRow}>
                  <Text style={styles.itemText}>Python (coming soon)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    Web dev basics (coming soon)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* --- Math: Pre-K – 8th grade --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.iconBubble, { backgroundColor: "#fbbf24" }]}
                >
                  <Ionicons name="grid-outline" size={22} color="#111827" />
                </View>
                <Text style={styles.cardTitle}>Math: Pre-K – 8th grade</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  "Pre-K through grade 2",
                  "2nd grade",
                  "3rd grade",
                  "4th grade",
                  "5th grade",
                  "6th grade",
                  "7th grade",
                  "8th grade",
                  "Basic geometry & measurement",
                ].map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- Math: High school & college --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.iconBubble, { backgroundColor: "#f97316" }]}
                >
                  <Ionicons
                    name="calculator-outline"
                    size={22}
                    color="#111827"
                  />
                </View>
                <Text style={styles.cardTitle}>Math: High school & college</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  "Algebra 1",
                  "Geometry",
                  "Algebra 2",
                  "Precalculus",
                  "Statistics & probability",
                  "AP/College Calculus AB",
                  "AP/College Calculus BC",
                  "Linear algebra",
                ].map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- Social studies --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.iconBubble, { backgroundColor: "#a855f7" }]}
                >
                  <Ionicons name="book-outline" size={22} color="#111827" />
                </View>
                <Text style={styles.cardTitle}>Social studies</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  "US history",
                  "World history",
                  "US government & civics",
                  "AP/College US History",
                  "AP/College World History",
                ].map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- Economics --- */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.iconBubble, { backgroundColor: "#22c55e" }]}
                >
                  <Ionicons name="cash-outline" size={22} color="#111827" />
                </View>
                <Text style={styles.cardTitle}>Economics</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  "Macroeconomics",
                  "Microeconomics",
                  "AP/College Macroeconomics",
                  "AP/College Microeconomics",
                ].map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Hero section (top)
  hero: {
  height: "83%",        // fill the entire first screen height
  minHeight: 0,        // optional fallback for very small screens
  backgroundColor: "#c05454ff",
  alignItems: "center",
  justifyContent: "center", 
  paddingBottom: 20,
  },
  title: {
    fontSize: 40,
    color: "white",
  },
  curio: {
    fontWeight: "400",
  },
  lab: {
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    color: "#c05454ff",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Outer wrapper that centers subjects
  subjectsOuter: {
    paddingHorizontal: 18,   // same side margins as before
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",    // center inner section horizontally
  },

  // Inner section with fixed max width
  subjectsSection: {
    width: "100%",
    maxWidth: 1200,
  },

  subjectsTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    width: "100%", // full width of subjectsSection (which is centered)
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  cardBody: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  itemRow: {
    width: "50%",
    paddingVertical: 4,
  },
  itemText: {
    fontSize: 17,
    color: "#131921ff",
  },
  header: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLogo: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  logoCurio: {
    color: "#0d9488",   // teal like Arduino
    fontWeight: "900",
  },

  logoLab: {
    color: "#f97316",   // orange like EDUCATION
    fontWeight: "400",
  },

  navMenu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },

  navItem: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },

  startBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },

  startBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },



});
