import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "../components/Icon";

interface WelcomeScreenProps {
  onNewUser: () => void;
  onExistingUser: () => void;
  onAdmin: () => void;
}

const WelcomeScreen = ({ onNewUser, onExistingUser, onAdmin }: WelcomeScreenProps) => {
  return (
    <View style={styles.container}>
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
          <TouchableOpacity style={styles.adminButton} onPress={onAdmin}>
            <Icon name="admin-panel-settings" size={18} color="#6b7280" />
            <Text style={styles.adminButtonText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 24,
    fontWeight: "500",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 40,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  pillText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "700",
  },
  ctaContainer: {
    gap: 14,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  adminButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  adminButtonText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default WelcomeScreen;
