import { Stack, useRouter } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ElectricStatusBoard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      {/* Hide native header since we show our own back */}
      <Stack.Screen options={{ title: "Electric Status Board", headerShown: false }} />

      {/* BACK BUTTON BLOCK */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/index")} // ← go to list every time
        >
          <Ionicons name="arrow-back" size={18} color="#c05454" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      {/* END BACK BUTTON BLOCK */}

    <ScrollView contentContainerStyle={styles.scrollOuter}>
      <View style={styles.contentWrapper}>   {/* NEW WRAPPER */}
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

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/projects/electric-status-board/learn")}
        >
          <Text style={styles.buttonText}>Start Learning</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kitButton}
          onPress={() => router.push("/kits/electric-status-board")}
        >
          <Text style={styles.kitButtonText}>Find Kits</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    </SafeAreaView>
  );
}

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
  container: { padding: 18, gap: 16 },
  title: { fontSize: 35, fontWeight: "700", color: "#364e39ff" },
  subtitle: { fontSize: 16, color: "#1c1c1bff", lineHeight: 22 },
  section: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
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
    maxWidth: 300
  },
  buttonText: { fontSize: 18, fontWeight: "700", color: "#fff" },

  scrollOuter: {
  paddingVertical: 18,
  alignItems: "center",   
  },

  contentWrapper: {
    width: "95%",           
    maxWidth: 1200,          // fixes wide desktop screens
    gap: 16,
  },

  section: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    width: "100%",          // ensure cards stretch only inside wrapper
  },

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
  maxWidth: 300
  },

  kitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c05454",
  },


});
