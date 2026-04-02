import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

interface OnboardingFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const steps = [
  { id: "partner", title: "Partner ID", subtitle: "Enter your Swiggy Partner ID", icon: "work" },
  { id: "mobile", title: "Mobile Number", subtitle: "We'll send you an OTP", icon: "smartphone" },
  { id: "otp", title: "Verify OTP", subtitle: "Enter the code sent to your phone", icon: "verified-user" },
  { id: "name", title: "Your Name", subtitle: "As per your Swiggy account", icon: "person" },
  { id: "income", title: "Weekly Income", subtitle: "Average weekly earnings", icon: "account-balance-wallet" },
  { id: "worktype", title: "Work Type", subtitle: "How do you work?", icon: "work" },
  { id: "location", title: "Location", subtitle: "Where do you deliver?", icon: "location-on" },
  { id: "aadhaar", title: "Aadhaar Verification", subtitle: "Quick KYC via OTP", icon: "verified-user" },
  { id: "pan", title: "PAN Card", subtitle: "For tax purposes", icon: "credit-card" },
  { id: "upi", title: "UPI ID", subtitle: "For instant payouts", icon: "account-balance-wallet" },
  { id: "confirm", title: "Confirmation", subtitle: "Review your plan", icon: "check-circle" },
];

const OnboardingFlow = ({ onComplete, onBack }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    partnerId: "", mobile: "", otp: "", name: "", income: "", workType: "", location: "",
    aadhaar: "", aadhaarOtp: "", pan: "", upi: "",
  });

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
    else onBack();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (current.id) {
      case "partner":
        return (
          <TextInput
            placeholder="e.g., SWG-12345"
            value={formData.partnerId}
            onChangeText={(value) => updateField("partnerId", value)}
            style={styles.textInput}
            placeholderTextColor="#9ca3af"
          />
        );
      case "mobile":
        return (
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChangeText={(value) => updateField("mobile", value)}
              style={styles.mobileInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#9ca3af"
            />
          </View>
        );
      case "otp":
        return (
          <View style={styles.otpSection}>
            <View style={styles.otpContainer}>
              {[0,1,2,3,4,5].map((i) => (
                <TextInput key={i} maxLength={1} style={styles.otpInput} placeholderTextColor="#9ca3af" />
              ))}
            </View>
            <Text style={styles.otpHint}>
              Sent to +91 {formData.mobile || "XXXXXXXXXX"}
            </Text>
          </View>
        );
      case "name":
        return (
          <TextInput
            placeholder="Full Name"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            style={styles.textInput}
            placeholderTextColor="#9ca3af"
          />
        );
      case "income":
        return (
          <View style={styles.incomeSection}>
            <View style={styles.incomeRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                placeholder="5,000"
                value={formData.income}
                onChangeText={(value) => updateField("income", value)}
                style={styles.incomeInput}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <Text style={styles.incomeHint}>Your premium will be calculated based on this</Text>
          </View>
        );
      case "worktype":
        return (
          <View style={styles.workTypeContainer}>
            {["Full-time", "Part-time"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => updateField("workType", type)}
                style={[
                  styles.workTypeOption,
                  formData.workType === type && styles.workTypeSelected
                ]}
              >
                <Text style={styles.workTypeTitle}>{type}</Text>
                <Text style={styles.workTypeSubtitle}>
                  {type === "Full-time" ? "6+ days per week" : "Less than 6 days per week"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case "location":
        return (
          <View style={styles.locationSection}>
            <TouchableOpacity style={styles.detectButton}>
              <Icon name="location-on" size={20} color="#2563eb" />
              <Text style={styles.detectButtonText}>Detect my location</Text>
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <TextInput
              placeholder="Enter city manually"
              value={formData.location}
              onChangeText={(value) => updateField("location", value)}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
          </View>
        );
      case "aadhaar":
        return (
          <View style={styles.aadhaarSection}>
            <TextInput
              placeholder="XXXX XXXX XXXX"
              value={formData.aadhaar}
              onChangeText={(value) => updateField("aadhaar", value)}
              style={styles.textInput}
              maxLength={14}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.aadhaarHint}>An OTP will be sent to your Aadhaar-linked mobile</Text>
          </View>
        );
      case "pan":
        return (
          <TextInput
            placeholder="ABCDE1234F"
            value={formData.pan}
            onChangeText={(value) => updateField("pan", value.toUpperCase())}
            style={styles.panInput}
            maxLength={10}
            placeholderTextColor="#9ca3af"
          />
        );
      case "upi":
        return (
          <TextInput
            placeholder="name@upi"
            value={formData.upi}
            onChangeText={(value) => updateField("upi", value)}
            style={styles.textInput}
            placeholderTextColor="#9ca3af"
          />
        );
      case "confirm":
        return (
          <View style={styles.confirmSection}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Partner ID</Text>
                <Text style={styles.confirmValue}>{formData.partnerId || "SWG-12345"}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Name</Text>
                <Text style={styles.confirmValue}>{formData.name || "Raju Kumar"}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Work Type</Text>
                <Text style={styles.confirmValue}>{formData.workType || "Full-time"}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Weekly Income</Text>
                <Text style={styles.confirmValue}>₹{formData.income || "5,000"}</Text>
              </View>
            </View>
            <View style={styles.premiumCard}>
              <Text style={styles.premiumLabel}>Your Weekly Premium</Text>
              <Text style={styles.premiumAmount}>₹29</Text>
              <Text style={styles.premiumCoverage}>
                Coverage: Weather, Traffic, Health disruptions
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepIndicator}>Step {step + 1} of {steps.length}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>
            <Icon name={current.icon} size={20} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.stepTitle}>{current.title}</Text>
            <Text style={styles.stepSubtitle}>{current.subtitle}</Text>
          </View>
        </View>

        <View style={styles.stepContent}>
          {renderStepContent()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>
            {step === steps.length - 1 ? "Activate Protection" : "Continue"}
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
  stepIndicator: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
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
    marginBottom: 8,
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
  stepContent: {
    marginTop: 24,
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
  otpSection: {
    gap: 16,
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
  otpHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  },
  incomeSection: {
    gap: 16,
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rupeeSymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  incomeInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  incomeHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  workTypeContainer: {
    gap: 12,
  },
  workTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  workTypeSelected: {
    backgroundColor: "#dbeafe",
  },
  workTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  workTypeSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6b7280",
    marginTop: 2,
  },
  locationSection: {
    gap: 12,
  },
  detectButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    fontSize: 12,
    color: "#6b7280",
  },
  aadhaarSection: {
    gap: 16,
  },
  aadhaarHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  panInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  confirmSection: {
    gap: 16,
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  premiumCard: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 20,
  },
  premiumLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  premiumAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
  premiumCoverage: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
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

export default OnboardingFlow;
