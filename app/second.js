// List of Arduino Projects


import { Stack, useRouter } from "expo-router";
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

export default function Second() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Arduino Projects",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.replace("/")}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: "#c05454ff" },
          headerTitleStyle: { color: "#fff" },
          headerTintColor: "#fff",
        }}
      />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.badge}>Project Library</Text>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.replace("/")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#c05454ff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Arduino Projects</Text>
        <Text style={styles.subtitle}>
          Choose a project to explore build steps and code.
        </Text>
      </View>

      {/* Project cards */}
      <ScrollView contentContainerStyle={styles.cardsContainer}>
        <ProjectCard
          image={require("../assets/statusBoard1.png")}
          level="BEGINNER"
          age="AGE 10+"
          title="Electric Status Board"
          subtitle="Build an OLED status sign that shows modes like Studying, Sleeping, or Gaming using buttons and Arduino."
          onGo={() => router.push("/projects/electric-status-board/learn")}
          onLearn={() => {}}
        />

        <ProjectCard
          icon={<MaterialCommunityIcons name="car" size={40} color="#0f172a" />}
          level="INTERMEDIATE"
          age="AGE 12+"
          title="Remote Control Car"
          subtitle="Control a small car with DC motors and a handheld controller to explore motion and speed."
          onGo={() => {}}
          onLearn={() => {}}
        />

        <ProjectCard
          icon={<Ionicons name="time-outline" size={40} color="#0f172a" />}
          level="INTERMEDIATE"
          age="AGE 12+"
          title="Digital Clock"
          subtitle="Use Arduino and a display to keep time, adjust hours and minutes, and practice real-time code."
          onGo={() => {}}
          onLearn={() => {}}
        />

        <ProjectCard
          icon={<Ionicons name="alarm-outline" size={40} color="#0f172a" />}
          level="INTERMEDIATE"
          age="AGE 13+"
          title="Alarm Clock"
          subtitle="Add alarms to your clock project and trigger a buzzer or LED when it’s time."
          onGo={() => {}}
          onLearn={() => {}}
        />

        <ProjectCard
          icon={<MaterialCommunityIcons name="lock" size={40} color="#0f172a" />}
          level="INTERMEDIATE"
          age="AGE 13+"
          title="Electronic Safe"
          subtitle="Create a keypad-locked safe that uses a servo to open only with the correct code."
          onGo={() => {}}
          onLearn={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Card component matching the course-style layout */
function ProjectCard({ image, icon, level, age, title, subtitle, onGo, onLearn }) {
  return (
    <View style={styles.card}>
      
      {/* Image or Icon Area */}
      <View style={styles.cardImageArea}>
        {image ? (
          <Image source={image} style={styles.cardImage} />
        ) : (
          <View style={styles.iconBubble}>{icon}</View>
        )}
      </View>

      {/* Text Content */}
      <View style={styles.cardBody}>
        <Text style={styles.levelText}>
          {level.toUpperCase()} ({age})
        </Text>

        <View style={styles.levelDivider} />

        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.learnBtn}
          activeOpacity={0.8}
          onPress={onLearn}
        >
          <Text style={styles.learnBtnText}>LEARN MORE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goBtn}
          activeOpacity={0.9}
          onPress={onGo}
        >
          <Text style={styles.goBtnText}>GO TO PROJECT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f8f8ff" },

  hero: {
    backgroundColor: "#c05454ff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: 0.2 },
  subtitle: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 6 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  logoutText: {
    color: "#c05454ff",
    fontWeight: "700",
    fontSize: 12,
  },

  /* Cards container */
cardsContainer: {
  padding: 16,
  paddingBottom: 24,
  flexDirection: "row",
  flexWrap: "wrap",       
  justifyContent: "space-between",
  rowGap: 28, 
},

  /* Card layout similar to the screenshot */
card: {
  width: "48%",            
  marginBottom: 24,        // spacing between rows
  backgroundColor: "#ffffff",
  maxWidth: 500,         // how wide each card can grow
  minWidth: 300,
  borderRadius: 14,
  overflow: "hidden",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},

  cardImageArea: {
    height: 200,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f0faff", // soft graphic area

  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  levelText: {
    fontSize: 11,
    letterSpacing: 1,
    color: "#6b7280",
    fontWeight: "600",
  },
  levelDivider: {
    marginTop: 6,
    marginBottom: 10,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  learnBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  learnBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  goBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0d9488",
  },
  goBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

cardImage: {
  width: "100%",
  height: "100%",
  resizeMode: "contain",
},

});

