import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { Icon } from "../components/Icon";
import { shadowMd, shadowSm } from "../constants/shadows";
import { api } from "../lib/api";

const DashboardScreen = () => {
  const [profile, setProfile]               = useState<any>(null);
  const [coverage, setCoverage]             = useState<any>(null);
  const [riskScore, setRiskScore]           = useState<any>(null);
  const [liveConditions, setLiveConditions] = useState<any>(null);
  const [claims, setClaims]                 = useState<any[]>([]);
  const [mlPremium, setMlPremium]           = useState<any>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, cov, risk, live, claimsRes] = await Promise.allSettled([
        api.partner.getProfile(),
        api.partner.getCoverage(),
        api.partner.getRiskScore(),
        api.partner.getLiveConditions(),
        api.claims.list(),
      ]);

      const prof  = p.status      === "fulfilled" ? p.value      : null;
      const covV  = cov.status    === "fulfilled" ? cov.value    : null;
      const riskV = risk.status   === "fulfilled" ? risk.value   : null;
      const liveV = live.status   === "fulfilled" ? live.value   : null;

      setProfile(prof);
      setCoverage(covV);
      setRiskScore(riskV);
      setLiveConditions(liveV);
      if (claimsRes.status === "fulfilled") setClaims(claimsRes.value?.claims?.slice(0, 3) || []);

      if (riskV?.ml_premium) setMlPremium(riskV.ml_premium);
      // Use live conditions from risk-score if available (saves a round trip)
      if (riskV?.live_conditions && !liveV) setLiveConditions(riskV.live_conditions);

      setLoading(false);
    };
    load();
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmitClaim = async (triggerType: string) => {
    setSubmitting(true);
    try {
      const res = await api.claims.submit({
        trigger_type: triggerType,
        // Real device signals would come from device sensors
        // Using reasonable defaults for now
        gps_accuracy_m: 14.0,
        accel_norm: 10.5,
        location_velocity_kmh: 18.0,
        network_type: 1,
        battery_drain_pct_per_hr: 11.0,
      });
      if (res.location_warning) {
        Alert.alert("Location Warning", res.location_warning);
      } else {
        Alert.alert("Claim Submitted", "Your claim is being processed. You'll be notified once verified.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const liveCards = [
    { icon: "thermostat", label: "Temp",    value: liveConditions?.temperature != null ? `${Math.round(liveConditions.temperature)}°C` : "--", color: "#fef2f2" },
    { icon: "water-drop", label: "Rain",    value: liveConditions?.rainfall     != null ? `${liveConditions.rainfall}mm`                : "--", color: "#dbeafe" },
    { icon: "air",        label: "AQI",     value: liveConditions?.aqi          != null ? `${liveConditions.aqi}`                       : "--", color: "#fefce8" },
    { icon: "directions-car", label: "Traffic", value: liveConditions?.traffic_delay != null ? `${liveConditions.traffic_delay}min`     : "--", color: "#fff7ed" },
  ];

  const score      = riskScore?.score ?? 0;
  const riskLevel  = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
  const riskColor  = score >= 70 ? "#ef4444" : score >= 40 ? "#f97316" : "#22c55e";
  const riskBg     = score >= 70 ? "#fef2f2" : score >= 40 ? "#fff7ed" : "#f0fdf4";

  const tierColor: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f97316", LOW: "#22c55e" };
  const mlTier     = mlPremium?.risk_tier ?? "LOW";
  const renewalDate = coverage?.renewal_date
    ? new Date(coverage.renewal_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "--";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Hello {profile?.name?.split(" ")[0] ?? "there"} 👋</Text>
          <Text style={styles.greetingSubtitle}>{coverage?.is_active ? "Your coverage is active" : "No active coverage"}</Text>
        </View>

        {/* Live Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Conditions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {liveCards.map((item) => (
              <View key={item.label} style={styles.liveCard}>
                <View style={[styles.liveIcon, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} size={18} color="#374151" />
                </View>
                <Text style={styles.liveValue}>{item.value}</Text>
                <Text style={styles.liveLabel}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Protection Card */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionHeader}>
            <View>
              <Text style={styles.protectionLabel}>AI Weekly Premium</Text>
              <Text style={styles.protectionAmount}>
                {mlPremium ? `₹${mlPremium.weekly_premium_inr}` : coverage?.weekly_premium ? `₹${coverage.weekly_premium}` : "--"}
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>{coverage?.is_active ? "✓ Active" : "Inactive"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.protectionFooter}>
            <View>
              <Text style={styles.protectionSubLabel}>Plan</Text>
              <Text style={styles.protectionSubValue}>{coverage?.plan ?? "--"}</Text>
            </View>
            <View style={styles.protectionRight}>
              <Text style={styles.protectionSubLabel}>Next Renewal</Text>
              <Text style={styles.protectionSubValue}>{renewalDate}</Text>
            </View>
          </View>
        </View>

        {/* ML Risk + Premium Card */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskTitle}>AI Risk Score</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLevel}</Text>
            </View>
          </View>

          {/* Score circle */}
          <View style={styles.riskMeter}>
            <View style={styles.riskCircleOuter}>
              <View style={[styles.riskCircleInner, { borderWidth: 4, borderColor: riskColor }]}>
                <Text style={[styles.riskScoreText, { color: riskColor }]}>{score}</Text>
                <Text style={styles.riskMax}>/100</Text>
              </View>
            </View>
          </View>

          {/* Contributing factors */}
          {riskScore?.contributing_factors?.length > 0 && (
            <View style={styles.factorsBox}>
              {riskScore.contributing_factors.map((f: string, i: number) => (
                <View key={i} style={styles.factorRow}>
                  <Icon name="warning" size={12} color="#f97316" />
                  <Text style={styles.factorText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ML Premium row */}
          {mlPremium && (
            <View style={styles.mlPremiumRow}>
              <View style={styles.mlPremiumLeft}>
                <Text style={styles.mlPremiumLabel}>AI-Computed Premium</Text>
                <Text style={styles.mlPremiumSub}>Based on live conditions + zone risk</Text>
              </View>
              <View style={styles.mlPremiumRight}>
                <Text style={[styles.mlPremiumAmount, { color: tierColor[mlTier] ?? "#111827" }]}>
                  ₹{mlPremium.weekly_premium_inr}
                </Text>
                <View style={[styles.mlTierBadge, { backgroundColor: riskBg }]}>
                  <Text style={[styles.mlTierText, { color: tierColor[mlTier] ?? "#111827" }]}>{mlTier}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Breakdown */}
          {mlPremium?.breakdown && (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Risk Breakdown</Text>
              {Object.entries(mlPremium.breakdown)
                .filter(([, val]) => typeof val === "number")
                .map(([key, val]: any) => (
                  <View key={key} style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>{key.replace(/_/g, " ")}</Text>
                    <View style={styles.breakdownBarBg}>
                      <View style={[styles.breakdownBarFill, { width: `${Math.round(val * 100)}%`, backgroundColor: riskColor }]} />
                    </View>
                    <Text style={styles.breakdownVal}>{Math.round(val * 100)}%</Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Submit Claim — shown when risk is elevated */}
        {score >= 30 && (
          <TouchableOpacity
            style={[styles.submitClaimBtn, submitting && { opacity: 0.6 }]}
            onPress={() => handleSubmitClaim(
              riskScore?.contributing_factors?.[0]?.toLowerCase().includes("rain") ? "heavy_rain"
              : riskScore?.contributing_factors?.[0]?.toLowerCase().includes("heat") ? "extreme_heat"
              : riskScore?.contributing_factors?.[0]?.toLowerCase().includes("traffic") ? "traffic"
              : "aqi"
            )}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Icon name="flash-on" size={18} color="#ffffff" />
                  <Text style={styles.submitClaimText}>Submit Claim Now</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Recent Claims */}
        {claims.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Claims</Text>
            {claims.map((claim: any, i: number) => (
              <View key={claim.id ?? i} style={styles.payoutCard}>
                <View style={styles.payoutIcon}>
                  <Icon name="trending-up" size={18} color="#22c55e" />
                </View>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutReason}>{claim.trigger_type ?? "Claim"}</Text>
                  <Text style={styles.payoutDate}>
                    {claim.created_at ? new Date(claim.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </Text>
                </View>
                <View style={styles.payoutRight}>
                  <Text style={styles.payoutAmount}>₹{claim.amount ?? 0}</Text>
                  <Text style={[styles.payoutStatus, { color: claim.status === "paid" ? "#22c55e" : "#f97316" }]}>
                    {claim.status === "paid" ? "Paid" : "Processing"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100, gap: 20 },
  greeting: { gap: 2 },
  greetingTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  greetingSubtitle: { fontSize: 14, color: "#6b7280" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  liveCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, minWidth: 100, alignItems: "center", gap: 8, marginRight: 12, ...shadowSm },
  liveIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  liveValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  liveLabel: { fontSize: 10, color: "#6b7280", fontWeight: "500" },
  protectionCard: { backgroundColor: "#2563eb", borderRadius: 16, padding: 20, gap: 16 },
  protectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protectionLabel: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.8)" },
  protectionAmount: { fontSize: 24, fontWeight: "800", color: "#ffffff" },
  activeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)" },
  activeText: { fontSize: 12, fontWeight: "600", color: "#ffffff" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  protectionFooter: { flexDirection: "row", justifyContent: "space-between" },
  protectionSubLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  protectionSubValue: { fontSize: 14, fontWeight: "600", color: "#ffffff", marginTop: 2 },
  protectionRight: { alignItems: "flex-end" },
  riskCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, gap: 16, ...shadowMd },
  riskHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  riskTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  riskBadgeText: { fontSize: 12, fontWeight: "600" },
  riskMeter: { alignItems: "center" },
  riskCircleOuter: { width: 144, height: 144, borderRadius: 72, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  riskCircleInner: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  riskScoreText: { fontSize: 28, fontWeight: "800" },
  riskMax: { fontSize: 12, color: "#6b7280" },
  factorsBox: { backgroundColor: "#fff7ed", borderRadius: 10, padding: 12, gap: 6 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  factorText: { fontSize: 12, color: "#92400e", flex: 1 },
  mlPremiumRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  mlPremiumLeft: { flex: 1 },
  mlPremiumLabel: { fontSize: 13, fontWeight: "600", color: "#111827" },
  mlPremiumSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  mlPremiumRight: { alignItems: "flex-end", gap: 4 },
  mlPremiumAmount: { fontSize: 20, fontWeight: "800" },
  mlTierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  mlTierText: { fontSize: 11, fontWeight: "700" },
  breakdownBox: { gap: 8 },
  breakdownTitle: { fontSize: 11, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownKey: { fontSize: 11, color: "#6b7280", width: 110, textTransform: "capitalize" },
  breakdownBarBg: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  breakdownBarFill: { height: "100%", borderRadius: 3 },
  breakdownVal: { fontSize: 11, fontWeight: "600", color: "#111827", width: 32, textAlign: "right" },
  submitClaimBtn: { backgroundColor: "#2563eb", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitClaimText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  payoutCard: { backgroundColor: "#ffffff", borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, ...shadowSm },
  payoutIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  payoutInfo: { flex: 1 },
  payoutReason: { fontSize: 14, fontWeight: "600", color: "#111827" },
  payoutDate: { fontSize: 12, color: "#6b7280" },
  payoutRight: { alignItems: "flex-end" },
  payoutAmount: { fontSize: 14, fontWeight: "700", color: "#111827" },
  payoutStatus: { fontSize: 10, fontWeight: "600" },
});

export default DashboardScreen;
