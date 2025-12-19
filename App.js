import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import React from "react";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.curio}>Curio</Text>
        <Text style={styles.lab}>Lab</Text>
      </Text>

      {/* ✅ BEGIN BUTTON */}
      <Link href="/next" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Begin</Text>
        </TouchableOpacity>
      </Link>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c05454ff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 40,
    color: 'white',
  },
  curio: {
    fontWeight: '400',
  },
  lab: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    color: '#c05454ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
