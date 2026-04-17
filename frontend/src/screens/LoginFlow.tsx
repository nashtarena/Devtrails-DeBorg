import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Icon } from "../components/Icon";
import { api, setToken } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

interface LoginFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const LoginFlow = ({ onComplete, onBack }: LoginFlowProps) => {
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    setError("");
    try {
      setLoading(true);
      if (step === 0) {
        // Request OTP after validating partner exists
        await api.auth.login(mobile, partnerId);
        setStep(1);
      } else if (step === 1) {
        const res = await api.auth.loginVerify(mobile, otp);
        setToken(res.access_token);  // set immediately before navigation
        login(res.access_token, res.partner_id);
        onComplete();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 2) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicator}>Step {step + 1} of 2</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="smartphone" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Welcome Back</Text>
                <Text style={styles.stepSubtitle}>Enter your credentials to login</Text>
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                placeholder="Mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                style={styles.mobileInput}
                placeholderTextColor="#cbd5e1"
              />
            </View>
            <TextInput
              placeholder="Swiggy Partner ID (e.g. SWG-12345)"
              value={partnerId}
              onChangeText={setPartnerId}
              style={styles.textInput}
              placeholderTextColor="#cbd5e1"
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="verified-user" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Verify OTP</Text>
                <Text style={styles.stepSubtitle}>Enter the code sent to +91 {mobile}</Text>
              </View>
            </View>
            <TextInput
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={[styles.textInput, { textAlign: "center", fontSize: 24, fontWeight: "700", letterSpacing: 8 }]}
              placeholderTextColor="#cbd5e1"
            />
          </View>
        )}

        {!!error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.primaryButtonText}>{step === 1 ? "Login" : "Continue"}</Text>
                <Icon name="chevron-right" size={20} color="#ffffff" />
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 12,
  },
  progressBar: {
    marginTop: 16,
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 4,
  },
  stepIndicator: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 10,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  stepSection: {
    gap: 18,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  stepSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textInput: {
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default LoginFlow;
