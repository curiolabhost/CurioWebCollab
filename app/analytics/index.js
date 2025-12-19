import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";

export default function ProgressDashboard() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "http://localhost:4000/api/progress-summary"
        );
        const data = await res.json();

        if (!data.ok) {
          throw new Error("Server returned ok: false");
        }

        setStats(data.statsByBlank || {});
      } catch (err) {
        console.log("Error loading stats:", err);
        setError("Could not load analytics.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading analytics…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text style={{ textAlign: "center" }}>
          No analytics recorded yet. Try doing some blanks and checking answers
          first.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          marginBottom: 12,
        }}
      >
        📊 Student Progress Analytics
      </Text>

      {Object.entries(stats).map(([blankName, stat]) => (
        <View
          key={blankName}
          style={{
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <Text style={{ fontWeight: "600", marginBottom: 2 }}>
            {blankName}
            {stat.difficulty ? ` · ${stat.difficulty}` : ""}
          </Text>
          <Text>Accuracy: {stat.accuracy ?? "n/a"}%</Text>
          <Text>Avg wrong attempts: {stat.avgWrongAttempts ?? "n/a"}</Text>
          <Text>AI hints used: {stat.hintCount}</Text>
          <Text>Total checks: {stat.checkEvents}</Text>
          <Text>Total wrong attempts: {stat.totalWrongAttempts ?? "n/a"}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
