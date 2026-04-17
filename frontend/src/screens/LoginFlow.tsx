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
          <Icon name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 2) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="smartphone" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Login</Text>
                <Text style={styles.stepSubtitle}>Enter your mobile & Partner ID</Text>
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
                placeholderTextColor="#9ca3af"
              />
            </View>
            <TextInput
              placeholder="Swiggy Partner ID (e.g. SWG-12345)"
              value={partnerId}
              onChangeText={setPartnerId}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
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
                <Text style={styles.stepSubtitle}>Sent to +91 {mobile}</Text>
              </View>
            </View>
            <TextInput
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.primaryButtonText}>{step === 1 ? "Login" : "Continue"}</Text>
                <Icon name="chevron-right" size={18} color="#ffffff" />
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  backButton: { padding: 8, marginLeft: -8, borderRadius: 12 },
  progressBar: { marginTop: 12, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 3 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  stepSection: { gap: 16 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  stepIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  stepSubtitle: { fontSize: 12, color: "#6b7280" },
  inputRow: { flexDirection: "row", gap: 8 },
  countryCode: { paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  countryCodeText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  mobileInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, backgroundColor: "#f3f4f6", fontSize: 16, fontWeight: "500", color: "#111827" },
  textInput: { width: "100%", paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, backgroundColor: "#f3f4f6", fontSize: 16, fontWeight: "500", color: "#111827" },
  errorText: { color: "#ef4444", fontSize: 13, textAlign: "center" },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 },
  primaryButton: { paddingVertical: 16, borderRadius: 16, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});

export default LoginFlow;
