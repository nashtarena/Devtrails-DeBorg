import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

interface LoginFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const LoginFlow = ({ onComplete, onBack }: LoginFlowProps) => {
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onComplete();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <View>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="smartphone" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Mobile Number</Text>
                <Text style={styles.stepSubtitle}>Login to your account</Text>
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                style={styles.mobileInput}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}
        {step === 1 && (
          <View>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="verified-user" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Verify OTP</Text>
                <Text style={styles.stepSubtitle}>Enter the 6-digit code</Text>
              </View>
            </View>
            <View style={styles.otpContainer}>
              {[0,1,2,3,4,5].map((i) => (
                <TextInput key={i} maxLength={1} style={styles.otpInput} placeholderTextColor="#9ca3af" />
              ))}
            </View>
          </View>
        )}
        {step === 2 && (
          <View>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Icon name="work" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.stepTitle}>Partner ID</Text>
                <Text style={styles.stepSubtitle}>Your Swiggy Partner ID</Text>
              </View>
            </View>
            <TextInput
              placeholder="e.g., SWG-12345"
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>
            {step === 2 ? "Login" : "Continue"}
          </Text>
          <Icon name="chevron-right" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 12,
  },
  progressBar: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  stepSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  otpContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  otpInput: {
    width: 48,
    height: 56,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    color: "#111827",
  },
  textInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
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
});

export default LoginFlow;
