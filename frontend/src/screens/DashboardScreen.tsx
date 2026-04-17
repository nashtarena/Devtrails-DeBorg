import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, StatusBar,
} from "react-native";
import { Icon } from "../components/Icon";
import { shadowSm, shadowMd } from "../constants/shadows";
import { api } from "../lib/api";

const LIVE_ICONS: Record<string, string> = {
  Temp: "thermostat", Rain: "water-drop", AQI: "air", Traffic: "directions-car",
};

const DashboardScreen = ({ topPadding = 0 }: { topPadding?: number }) => {

  const [profile, setProfile]               = useState<any>(null);
  const [coverage, setCoverage]             = useState<any>(null);
  const [riskScore, setRiskScore]           = useState<any>(null);
  const [liveConditions, setLiveConditions] = useState<any>(null);
  const [mlPremium, setMlPremium]           = useState<any>(null);
  const [weeklyLoss, setWeeklyLoss]         = useState<any>(null);
  const [recentClaims, setRecentClaims]     = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showBreakdown, setShowBreakdown]   = useState(false);
  const [showSimulator, setShowSimulator]   = useState(false);
  const [simType, setSimType]               = useState("heavy_rain");
  const [simSeverity, setSimSeverity]       = useState(0.8);
  const [simDuration, setSimDuration]       = useState(2);
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, cov, risk, live] = await Promise.allSettled([
        api.partner.getProfile(),
        api.partner.getCoverage(),
        api.partner.getRiskScore(),
        api.partner.getLiveConditions(),
      ]);
      setProfile(p.status === "fulfilled" ? p.value : null);
      setCoverage(cov.status === "fulfilled" ? cov.value : null);
      const riskV = risk.status === "fulfilled" ? risk.value : null;
      setRiskScore(riskV);
      setLiveConditions(live.status === "fulfilled" ? live.value : riskV?.live_conditions ?? null);
      if (riskV?.ml_premium) setMlPremium(riskV.ml_premium);
      setLoading(false);
      api.claims.weeklyLoss().then(setWeeklyLoss).catch(() => {});
      api.claims.list().then(r => setRecentClaims(r?.claims?.slice(0, 3) ?? [])).catch(() => {});
    };
    load();
  }, []);

  const handleSimulate = async () => {
    setSubmitting(true);
    try {
      const res = await api.simulate({ trigger_type: simType, severity: simSeverity, duration_hours: simDuration });
      setShowSimulator(false);
      api.claims.weeklyLoss().then(setWeeklyLoss).catch(() => {});
      if (res.status === "below_threshold") {
        Alert.alert("Below Threshold", res.message);
      } else {
        Alert.alert("Impact Recorded", `₹${res.loss_added_inr} added to this week\n\nTotal: ₹${res.total_weekly_loss_inr}\nPaid out Sunday`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const score     = riskScore?.score ?? 0;
  const riskLevel = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
  const riskColor = score >= 70 ? "#ef4444" : score >= 40 ? "#f97316" : "#22c55e";
  const premium   = mlPremium?.weekly_premium_inr ?? coverage?.weekly_premium ?? "--";
  const mlTier    = mlPremium?.risk_tier ?? "LOW";
  const tierColor = mlTier === "HIGH" ? "#ef4444" : mlTier === "MEDIUM" ? "#f97316" : "#22c55e";
  const weekTotal = weeklyLoss?.accumulated_loss_inr ?? 0;
  const daysLeft  = weeklyLoss?.days_until_settlement ?? 0;

  const liveItems = [
    { label: "Temp",    value: liveConditions?.temperature != null ? `${Math.round(liveConditions.temperature)}°C` : "--" },
    { label: "Rain",    value: liveConditions?.rainfall     != null ? `${liveConditions.rainfall}mm`                : "--" },
    { label: "AQI",     value: liveConditions?.aqi          != null ? `${liveConditions.aqi}`                       : "--" },
    { label: "Traffic", value: liveConditions?.traffic_delay != null ? `${liveConditions.traffic_delay}min`          : "--" },
  ];

  const numericBreakdown = Object.entries(mlPremium?.breakdown ?? {})
    .filter(([, v]) => typeof v === "number") as [string, number][];

  const renewalDate = coverage?.renewal_date
    ? new Date(coverage.renewal_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "--";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {profile?.name?.split(" ")[0] ?? "there"} 👋</Text>
            <Text style={styles.greetingSub}>
              {profile?.zone ?? "Your zone"} · {profile?.work_type ?? ""}
            </Text>
          </View>
          <View style={[styles.riskPill, { backgroundColor: `${riskColor}15` }]}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.riskPillText, { color: riskColor }]}>{riskLevel} Risk</Text>
          </View>
        </View>

        {/* ── Premium card ────────────────────────────────────── */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumRow}>
            <View>
              <Text style={styles.premiumLabel}>AI Weekly Premium</Text>
              <Text style={styles.premiumAmount}>₹{premium}</Text>
              <Text style={styles.premiumSub}>Renews {renewalDate}</Text>
            </View>
            <View style={styles.premiumRight}>
              <View style={[styles.tierBadge, { backgroundColor: `${tierColor}25` }]}>
                <Text style={[styles.tierBadgeText, { color: tierColor }]}>{mlTier} RISK</Text>
              </View>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>{coverage?.is_active ? "Active" : "Inactive"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.premiumDivider} />

          <View style={styles.premiumStats}>
            <View style={styles.premiumStat}>
              <Text style={styles.premiumStatVal}>{coverage?.plan ?? "--"}</Text>
              <Text style={styles.premiumStatLbl}>Plan</Text>
            </View>
            <View style={styles.premiumStatDivider} />
            <View style={styles.premiumStat}>
              <Text style={styles.premiumStatVal}>₹{coverage?.total_payout ?? 0}</Text>
              <Text style={styles.premiumStatLbl}>Total received</Text>
            </View>
            <View style={styles.premiumStatDivider} />
            <View style={styles.premiumStat}>
              <Text style={styles.premiumStatVal}>{coverage?.total_claims ?? 0}</Text>
              <Text style={styles.premiumStatLbl}>Claims</Text>
            </View>
          </View>

          {numericBreakdown.length > 0 && (
            <TouchableOpacity style={styles.breakdownToggle} onPress={() => setShowBreakdown(!showBreakdown)}>
              <Text style={styles.breakdownToggleText}>{showBreakdown ? "Hide" : "Show"} premium breakdown</Text>
              <Icon name="chevron-right" size={13} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
          {showBreakdown && (
            <View style={styles.breakdownList}>
              <Text style={styles.breakdownNote}>Based on income, zone risk & claim history — not weather</Text>
              {numericBreakdown.map(([key, val]) => (
                <View key={key} style={styles.breakdownRow}>
                  <Text style={styles.breakdownKey}>{key.replace(/_/g, " ")}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.round(val * 100)}%` }]} />
                  </View>
                  <Text style={styles.breakdownPct}>{Math.round(val * 100)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Live conditions ─────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Conditions</Text>
          <Text style={styles.sectionSub}>{profile?.zone ?? ""}</Text>
        </View>
        <View style={styles.liveGrid}>
          {liveItems.map((item) => (
            <View key={item.label} style={styles.liveCard}>
              <View style={styles.liveIconBox}>
                <Icon name={LIVE_ICONS[item.label]} size={16} color="#2563eb" />
              </View>
              <Text style={styles.liveValue}>{item.value}</Text>
              <Text style={styles.liveLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── AI Risk score ───────────────────────────────────── */}
        <View style={styles.riskCard}>
          <View style={styles.riskTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.riskLabel}>AI Risk Score</Text>
              <Text style={[styles.riskScore, { color: riskColor }]}>
                {score}<Text style={styles.riskMax}>/100</Text>
              </Text>
            </View>
            <View style={[styles.riskCircle, { borderColor: riskColor }]}>
              <Text style={[styles.riskCircleText, { color: riskColor }]}>{riskLevel}</Text>
            </View>
          </View>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarFill, { width: `${score}%`, backgroundColor: riskColor }]} />
          </View>
          {riskScore?.contributing_factors?.length > 0 ? (
            <View style={styles.factorsList}>
              {riskScore.contributing_factors.map((f: string, i: number) => (
                <View key={i} style={[styles.factorChip, { borderColor: `${riskColor}40` }]}>
                  <Icon name="warning" size={10} color={riskColor} />
                  <Text style={[styles.factorChipText, { color: riskColor }]}>{f}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noFactorRow}>
              <Icon name="check-circle" size={14} color="#22c55e" />
              <Text style={styles.noFactors}>No active risk factors in your zone</Text>
            </View>
          )}
        </View>

        {/* ── Weekly impact ───────────────────────────────────── */}
        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <View>
              <Text style={styles.weekLabel}>This Week's Impact</Text>
              <Text style={[styles.weekAmount, { color: weekTotal > 0 ? "#ef4444" : "#22c55e" }]}>
                ₹{weekTotal.toFixed(0)}
              </Text>
              <Text style={styles.weekSub}>
                {daysLeft === 0 ? "Settles tonight" : `Settles in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.simBtn} onPress={() => setShowSimulator(true)}>
              <Icon name="flash-on" size={14} color="#7c3aed" />
              <Text style={styles.simBtnText}>Simulate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekBarBg}>
            <View style={[styles.weekBarFill, {
              width: `${Math.min((weekTotal / (coverage?.weekly_premium ?? 89)) * 100, 100)}%`,
              backgroundColor: weekTotal > 0 ? "#ef4444" : "#22c55e",
            }]} />
          </View>
          <Text style={styles.weekBarLabel}>
            {weekTotal > 0
              ? `₹${weekTotal.toFixed(0)} of estimated weekly earnings impacted`
              : "No qualifying disruptions this week"}
          </Text>
        </View>

        {/* ── Recent claims ───────────────────────────────────── */}
        {recentClaims.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Recent Claims</Text>
            {recentClaims.map((c: any) => {
              const isPaid = c.status === "paid";
              return (
                <View key={c.id} style={styles.claimRow}>
                  <View style={[styles.claimDot, { backgroundColor: isPaid ? "#22c55e" : c.status === "rejected" ? "#ef4444" : "#f97316" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimTrigger}>{c.trigger_type?.replace(/_/g, " ") ?? "Claim"}</Text>
                    <Text style={styles.claimDate}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                    </Text>
                  </View>
                  <Text style={[styles.claimAmt, { color: isPaid ? "#22c55e" : "#94a3b8" }]}>
                    {isPaid ? `+₹${c.amount}` : c.status}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ── Simulator modal ─────────────────────────────────── */}
      <Modal visible={showSimulator} transparent animationType="slide" onRequestClose={() => setShowSimulator(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Simulate Disruption</Text>
            <Text style={styles.sheetSub}>Adds income impact to this week's tracker. Paid out Sunday.</Text>

            <Text style={styles.sheetLabel}>Type</Text>
            <View style={styles.chipRow}>
              {["heavy_rain", "extreme_heat", "traffic", "aqi"].map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, simType === t && styles.chipActive]} onPress={() => setSimType(t)}>
                  <Text style={[styles.chipText, simType === t && { color: "#fff" }]}>{t.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Severity</Text>
            <View style={styles.chipRow}>
              {([0.5, 0.7, 0.9] as number[]).map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, simSeverity === s && styles.chipActive]} onPress={() => setSimSeverity(s)}>
                  <Text style={[styles.chipText, simSeverity === s && { color: "#fff" }]}>
                    {s === 0.5 ? "Moderate" : s === 0.7 ? "High" : "Extreme"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Duration</Text>
            <View style={styles.chipRow}>
              {([1, 2, 4, 6] as number[]).map((h) => (
                <TouchableOpacity key={h} style={[styles.chip, simDuration === h && styles.chipActive]} onPress={() => setSimDuration(h)}>
                  <Text style={[styles.chipText, simDuration === h && { color: "#fff" }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.sheetBtn, submitting && { opacity: 0.6 }]} onPress={handleSimulate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sheetBtnText}>Add Impact</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSimulator(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  greetingSub: { fontSize: 13, color: "#64748b", marginTop: 3, textTransform: "capitalize" },
  riskPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  riskDot: { width: 7, height: 7, borderRadius: 4 },
  riskPillText: { fontSize: 12, fontWeight: "700" },

  // Premium card
  premiumCard: { backgroundColor: "#1e3a8a", borderRadius: 20, padding: 20, gap: 16 },
  premiumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  premiumLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  premiumAmount: { fontSize: 34, fontWeight: "800", color: "#fff", marginTop: 2 },
  premiumSub: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 },
  premiumRight: { alignItems: "flex-end", gap: 8 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tierBadgeText: { fontSize: 11, fontWeight: "700" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
  activeText: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  premiumDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  premiumStats: { flexDirection: "row", justifyContent: "space-between" },
  premiumStat: { flex: 1, alignItems: "center", gap: 3 },
  premiumStatVal: { fontSize: 14, fontWeight: "700", color: "#fff", textTransform: "capitalize" },
  premiumStatLbl: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  premiumStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  breakdownToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  breakdownToggleText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  breakdownList: { gap: 8 },
  breakdownNote: { fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownKey: { fontSize: 11, color: "rgba(255,255,255,0.65)", width: 100, textTransform: "capitalize" },
  barBg: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 2 },
  breakdownPct: { fontSize: 11, color: "rgba(255,255,255,0.65)", width: 28, textAlign: "right" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#94a3b8" },

  // Live conditions
  liveGrid: { flexDirection: "row", gap: 10 },
  liveCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center", gap: 6, ...shadowSm },
  liveIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  liveValue: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  liveLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },

  // Risk card
  riskCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 12, ...shadowSm },
  riskTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  riskLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  riskScore: { fontSize: 30, fontWeight: "800", marginTop: 2 },
  riskMax: { fontSize: 14, color: "#94a3b8", fontWeight: "400" },
  riskCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  riskCircleText: { fontSize: 11, fontWeight: "700" },
  riskBarBg: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  riskBarFill: { height: "100%", borderRadius: 3 },
  factorsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  factorChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  factorChipText: { fontSize: 11, fontWeight: "500" },
  noFactorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  noFactors: { fontSize: 12, color: "#22c55e" },

  // Weekly impact
  weekCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 12, ...shadowSm },
  weekTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  weekLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  weekAmount: { fontSize: 26, fontWeight: "800", marginTop: 2 },
  weekSub: { fontSize: 11, color: "#94a3b8", marginTop: 3 },
  simBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f3e8ff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  simBtnText: { fontSize: 12, fontWeight: "600", color: "#7c3aed" },
  weekBarBg: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  weekBarFill: { height: "100%", borderRadius: 3 },
  weekBarLabel: { fontSize: 11, color: "#94a3b8" },

  // Recent claims
  claimRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, ...shadowSm },
  claimDot: { width: 10, height: 10, borderRadius: 5 },
  claimTrigger: { fontSize: 13, fontWeight: "600", color: "#0f172a", textTransform: "capitalize" },
  claimDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  claimAmt: { fontSize: 14, fontWeight: "700" },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  sheetSub: { fontSize: 13, color: "#64748b", marginTop: -8 },
  sheetLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#475569", textTransform: "capitalize" },
  sheetBtn: { backgroundColor: "#1e3a8a", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  sheetBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { color: "#94a3b8", fontSize: 14 },
});

export default DashboardScreen;
