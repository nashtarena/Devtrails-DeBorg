import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Icon } from "../components/Icon";
import { shadowSm } from "../constants/shadows";
import { api, setToken } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

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
  { id: "plan", title: "Choose Your Plan", subtitle: "Select the coverage that fits you", icon: "shield" },
  { id: "confirm", title: "Confirmation", subtitle: "Review your details", icon: "check-circle" },
];

const OnboardingFlow = ({ onComplete, onBack }: OnboardingFlowProps) => {
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mlPremium, setMlPremium] = useState<any>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: "", mobile: "", otp: "", name: "", income: "", workType: "", location: "",
    aadhaar: "", aadhaarOtp: "", pan: "", upi: "", plan: "plus",
  });

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const detectLocation = async () => {
    try {
      setLocationLoading(true);

      if (!navigator.geolocation) {
        Alert.alert("Error", "Geolocation is not supported by your browser");
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Use reverse geocoding API to get city name from coordinates
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const cityName = data.address?.city || data.address?.town || data.address?.region || "Unknown Location";
            updateField("location", cityName);
          } catch (err) {
            Alert.alert("Error", "Could not determine your city from location");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          let errorMessage = "Failed to detect location";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location permission was denied";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out";
          }
          Alert.alert("Location Error", errorMessage);
          setLocationLoading(false);
        }
      );
    } catch (err: any) {
      Alert.alert("Location Error", err.message || "Failed to detect location");
      setLocationLoading(false);
    }
  };

  const next = async () => {
    setError("");

    // Check partner ID exists as soon as user leaves that step
    if (current.id === "partner" && formData.partnerId) {
      try {
        setLoading(true);
        const check = await api.auth.checkPartner(formData.partnerId);
        if (check.exists) {
          setError("This Partner ID is already registered. Please login instead.");
          setLoading(false);
          return;
        }
      } catch {
        // ignore check errors, let registration handle it
      } finally {
        setLoading(false);
      }
    }

    // Verify OTP when leaving otp step
    if (current.id === "otp") {
      try {
        setLoading(true);
        await api.auth.verifyOtp(formData.mobile, formData.otp);
      } catch (e: any) {
        setError(e.message || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Send OTP when leaving mobile step
    if (current.id === "mobile") {
      if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
        setError("Enter a valid 10-digit mobile number starting with 6-9.");
        return;
      }
      try {
        setLoading(true);
        await api.auth.requestOtp(formData.mobile);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    // Register on final plan step
    if (current.id === "plan") {
      try {
        setLoading(true);
        const res = await api.auth.register({
          swiggy_partner_id: formData.partnerId.startsWith("SWG-") ? formData.partnerId : `SWG-${formData.partnerId}`,
          name: formData.name,
          mobile: formData.mobile,
          otp: formData.otp,
          weekly_income: parseFloat(formData.income) || 0,
          work_type: formData.workType.toLowerCase().replace(" ", "-"),
          zone: formData.location,
          upi_id: formData.upi,
          pan: formData.pan,
          aadhaar_last4: formData.aadhaar.replace(/\s/g, "").slice(-4),
          plan: formData.plan,
        });
        setToken(res.access_token);
        login(res.access_token, res.partner_id);
        onComplete();
        return;
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    if (step < steps.length - 1) {
      const nextStep = steps[step + 1];
      // When reaching confirm step, calculate ML premium
      if (nextStep.id === "confirm" && formData.income && formData.location && formData.workType) {
        setPremiumLoading(true);
        api.auth.estimatePremium({
          zone: formData.location,
          work_type: formData.workType.toLowerCase().replace(" ", "-"),
          weekly_income_inr: parseFloat(formData.income) || 5000,
          tenure_weeks: 1,
          claim_ratio: 0,
        }).then(setMlPremium).catch(() => {}).finally(() => setPremiumLoading(false));
      }
      setStep(step + 1);
    }
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
            placeholderTextColor="#cbd5e1"
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
              placeholderTextColor="#cbd5e1"
            />
          </View>
        );
      case "otp":
        return (
          <View style={styles.otpSection}>
            <TextInput
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChangeText={(val) => updateField("otp", val.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.textInput, { textAlign: "center", fontSize: 24, fontWeight: "700", letterSpacing: 8 }]}
              placeholderTextColor="#cbd5e1"
            />
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
            placeholderTextColor="#cbd5e1"
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
                placeholderTextColor="#cbd5e1"
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
            <TouchableOpacity 
              style={styles.detectButton}
              onPress={detectLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#2563eb" size="small" />
              ) : (
                <>
                  <Icon name="location-on" size={20} color="#2563eb" />
                  <Text style={styles.detectButtonText}>Detect my location</Text>
                </>
              )}
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
              placeholderTextColor="#cbd5e1"
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
              placeholderTextColor="#cbd5e1"
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
            placeholderTextColor="#cbd5e1"
          />
        );
      case "upi":
        return (
          <TextInput
            placeholder="name@upi"
            value={formData.upi}
            onChangeText={(value) => updateField("upi", value)}
            style={styles.textInput}
            placeholderTextColor="#cbd5e1"
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
                <Text style={styles.confirmValue}>{formData.name}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Work Type</Text>
                <Text style={styles.confirmValue}>{formData.workType}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Weekly Income</Text>
                <Text style={styles.confirmValue}>₹{formData.income}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Zone</Text>
                <Text style={styles.confirmValue}>{formData.location}</Text>
              </View>
            </View>

            <View style={styles.premiumCard}>
              {premiumLoading ? (
                <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <Text style={styles.premiumLabel}>YOUR AI-COMPUTED WEEKLY PREMIUM</Text>
                  <Text style={styles.premiumAmount}>
                    ₹{mlPremium?.weekly_premium_inr ?? "--"}
                  </Text>
                  {mlPremium && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{mlPremium.risk_tier} RISK</Text>
                      </View>
                      <Text style={styles.premiumCoverage}>Based on your income & zone</Text>
                    </View>
                  )}
                  <Text style={[styles.premiumCoverage, { marginTop: 12 }]}>
                    ✓ Weather • ✓ Traffic • ✓ AQI disruptions
                  </Text>
                </>
              )}
            </View>
          </View>
        );
      case "plan": {
        const plans = [
          {
            id: "basic", name: "Basic", icon: "umbrella", color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db",
            price: mlPremium ? `₹${Math.round(mlPremium.weekly_premium_inr * 0.7)}/wk` : "₹20/wk",
            perks: ["Rain & heat coverage", "Auto claims", "Weekly payouts"],
          },
          {
            id: "plus", name: "Plus", icon: "verified", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd",
            price: mlPremium ? `₹${Math.round(mlPremium.weekly_premium_inr)}/wk` : "₹29/wk",
            perks: ["All Basic perks", "AQI & traffic coverage", "AI risk scoring", "Priority support"],
            recommended: true,
          },
          {
            id: "shield", name: "Shield", icon: "security", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd",
            price: mlPremium ? `₹${Math.round(mlPremium.weekly_premium_inr * 1.4)}/wk` : "₹40/wk",
            perks: ["All Plus perks", "Higher payout caps", "Accident coverage", "24/7 claim support"],
          },
        ];
        return (
          <View style={styles.planSection}>
            {plans.map((p) => {
              const selected = formData.plan === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => updateField("plan", p.id)}
                  style={[styles.planCard, { borderColor: selected ? p.color : p.border, backgroundColor: selected ? p.bg : "#fff" }]}
                >
                  {p.recommended && (
                    <View style={[styles.planBadge, { backgroundColor: p.color }]}>
                      <Text style={styles.planBadgeText}>Recommended</Text>
                    </View>
                  )}
                  <View style={styles.planCardHeader}>
                    <View style={[styles.planIconWrap, { backgroundColor: p.bg, borderColor: p.border }]}>
                      <Icon name={p.icon} size={20} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, { color: p.color }]}>{p.name}</Text>
                      <Text style={[styles.planPrice, { color: selected ? p.color : "#374151" }]}>{p.price}</Text>
                    </View>
                    <View style={[styles.planRadio, { borderColor: p.color }]}>
                      {selected && <View style={[styles.planRadioFill, { backgroundColor: p.color }]} />}
                    </View>
                  </View>
                  <View style={styles.planPerks}>
                    {p.perks.map((perk) => (
                      <View key={perk} style={styles.planPerkRow}>
                        <Icon name="check-circle" size={14} color={p.color} />
                        <Text style={styles.planPerkText}>{perk}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#0f172a" />
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
        <TouchableOpacity style={styles.primaryButton} onPress={next} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.primaryButtonText}>
                  {step === steps.length - 1 ? "Activate Protection" : "Continue"}
                </Text>
                <Icon name="chevron-right" size={20} color="#ffffff" />
              </>
          }
        </TouchableOpacity>
        {!!error && (
          <View style={{ backgroundColor: "#fee2e2", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 14, borderLeftWidth: 4, borderLeftColor: "#ef4444" }}>
            <Text style={{ color: "#991b1b", fontSize: 13, fontWeight: "600", lineHeight: 18 }}>{error}</Text>
          </View>
        )}
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
  stepContent: {
    marginTop: 12,
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
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
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
  otpSection: {
    gap: 18,
  },
  otpContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  otpInput: {
    width: 52,
    height: 60,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  otpHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  incomeSection: {
    gap: 18,
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rupeeSymbol: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563eb",
  },
  incomeInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  incomeHint: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  workTypeContainer: {
    gap: 14,
  },
  workTypeOption: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  workTypeSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  workTypeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  workTypeSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#64748b",
    marginTop: 6,
  },
  locationSection: {
    gap: 14,
  },
  detectButton: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#bfdbfe",
  },
  detectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  aadhaarSection: {
    gap: 16,
  },
  aadhaarHint: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  panInput: {
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  confirmSection: {
    gap: 18,
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    gap: 0,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  confirmLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  premiumCard: {
    backgroundColor: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e40af",
  },
  premiumLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  premiumAmount: {
    fontSize: 38,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 8,
  },
  premiumCoverage: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
    fontWeight: "500",
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
  planSection: { gap: 14 },
  planCard: { borderWidth: 2, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", backgroundColor: "#ffffff" },
  planBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  planBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  planCardHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  planIconWrap: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 17, fontWeight: "800" },
  planPrice: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  planRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  planRadioFill: { width: 11, height: 11, borderRadius: 5.5 },
  planPerks: { gap: 8 },
  planPerkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planPerkText: { fontSize: 13, color: "#475569", fontWeight: "500" },
});

export default OnboardingFlow;
