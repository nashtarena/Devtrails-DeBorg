import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

interface WelcomeScreenProps {
  onNewUser: () => void;
  onExistingUser: () => void;
}

const WelcomeScreen = ({ onNewUser, onExistingUser }: WelcomeScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="security" size={44} color="#ffffff" />
            </View>
          </View>

          <Text style={styles.title}>SecInsure</Text>
          <Text style={styles.subtitle}>
            AI-powered parametric insurance for delivery partners. Stay protected against weather, traffic & more.
          </Text>

          {/* Feature pills */}
          <View style={styles.pillsContainer}>
            {["Weather Protection", "Auto Claims", "Instant Payouts"].map((f) => (
              <View key={f} style={styles.pill}>
                <Text style={styles.pillText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onNewUser}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Icon name="chevron-right" size={18} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onExistingUser}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 32,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#dbeafe",
    borderRadius: 16,
  },
  pillText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaContainer: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default WelcomeScreen;
