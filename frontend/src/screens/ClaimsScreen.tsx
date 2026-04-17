import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Icon } from "../components/Icon";
import { shadowSm } from "../constants/shadows";
import { api } from "../lib/api";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid:       { label: "Paid",       color: "#16a34a", bg: "#f0fdf4" },
  processing: { label: "Processing", color: "#d97706", bg: "#fffbeb" },
  rejected:   { label: "Rejected",   color: "#dc2626", bg: "#fef2f2" },
};

// Factors that contribute to weekly income loss
const factorMeta: Record<string, { label: string; icon: string; color: string; threshold: string }> = {
  heavy_rain:   { label: "Heavy Rainfall",   icon: "water-drop",     color: "#2563eb", threshold: "≥40mm/hr" },
  extreme_heat: { label: "Extreme Heat",     icon: "thermostat",     color: "#ef4444", threshold: "≥42°C" },
  traffic:      { label: "Traffic Jam",      icon: "directions-car", color: "#f97316", threshold: "≥45min delay" },
  aqi:          { label: "Poor Air Quality", icon: "air",            color: "#6b7280", threshold: "AQI ≥300" },
};

const ClaimsScreen = ({ topPadding = 0 }: { topPadding?: number }) => {
  const [data, setData]           = useState<any>(null);
  const [weeklyLoss, setWeeklyLoss] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([api.claims.list(), api.claims.weeklyLoss()])
      .then(([claimsRes, lossRes]) => {
        if (claimsRes.status === "fulfilled") setData(claimsRes.value);
        else setError((claimsRes as any).reason?.message ?? "Failed to load");
        if (lossRes.status === "fulfilled") setWeeklyLoss(lossRes.value);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const claims: any[] = data?.claims ?? [];
  const weekTotal = weeklyLoss?.accumulated_loss_inr ?? 0;
  const daysLeft  = weeklyLoss?.days_until_settlement ?? 0;
  const willClaim = weeklyLoss?.will_trigger_claim ?? false;

  // Real per-factor breakdown from backend
  const factorMeta: Record<string, { label: string; icon: string; color: string; threshold: string }> = {
    heavy_rain:   { label: "Heavy Rainfall",   icon: "water-drop",     color: "#2563eb", threshold: "≥40mm/hr" },
    extreme_heat: { label: "Extreme Heat",     icon: "thermostat",     color: "#ef4444", threshold: "≥42°C" },
    traffic:      { label: "Traffic Jam",      icon: "directions-car", color: "#f97316", threshold: "≥45min delay" },
    aqi:          { label: "Poor Air Quality", icon: "air",            color: "#6b7280", threshold: "AQI ≥300" },
  };

  const rawFactors: Record<string, number> = weeklyLoss?.factors ?? {};
  const weekFactors = Object.entries(rawFactors)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll]} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.sub}>Weekly income protection</Text>
        </View>

        {/* This week card */}
        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <View>
              <Text style={styles.weekLabel}>This week's impact</Text>
              <Text style={[styles.weekAmount, { color: weekTotal > 0 ? "#dc2626" : "#16a34a" }]}>
                ₹{weekTotal.toFixed(0)}
              </Text>
            </View>
            <View style={styles.weekRight}>
              <View style={[styles.settleBadge, { backgroundColor: willClaim ? "#fef2f2" : "#f0fdf4" }]}>
                <Text style={[styles.settleBadgeText, { color: willClaim ? "#dc2626" : "#16a34a" }]}>
                  {willClaim ? "Claim due" : "No claim"}
                </Text>
              </View>
              <Text style={styles.settleDate}>
                {daysLeft === 0 ? "Settles tonight" : `Settles in ${daysLeft}d`}
              </Text>
            </View>
          </View>

          {/* Factor breakdown */}
          {weekFactors.length > 0 ? (
            <View style={styles.factorBreakdown}>
              <Text style={styles.factorBreakdownTitle}>Income loss by factor</Text>
              {weekFactors.map(([key, amount]) => {
                const meta = factorMeta[key] ?? { label: key, icon: "flash-on", color: "#6b7280", threshold: "" };
                const pct  = weekTotal > 0 ? amount / weekTotal : 0;
                return (
                  <View key={key} style={styles.factorRow}>
                    <View style={[styles.factorIcon, { backgroundColor: `${meta.color}12` }]}>
                      <Icon name={meta.icon} size={14} color={meta.color} />
                    </View>
                    <View style={styles.factorInfo}>
                      <View style={styles.factorTopRow}>
                        <Text style={styles.factorLabel}>{meta.label}</Text>
                        <Text style={[styles.factorAmount, { color: meta.color }]}>₹{amount.toFixed(0)}</Text>
                      </View>
                      <View style={styles.factorBarBg}>
                        <View style={[styles.factorBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: meta.color }]} />
                      </View>
                      <Text style={styles.factorThreshold}>{Math.round(pct * 100)}% of total · Threshold: {meta.threshold}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noImpact}>
              <Icon name="check-circle" size={16} color="#16a34a" />
              <Text style={styles.noImpactText}>No qualifying disruptions this week</Text>
            </View>
          )}

          {/* How it works */}
          <View style={styles.howBox}>
            <Text style={styles.howTitle}>How payouts work</Text>
            <Text style={styles.howText}>
              Disruptions are tracked all week. Only extreme events (heavy rain ≥40mm, heat ≥42°C, AQI ≥300, traffic ≥45min) reduce your estimated earnings. Every Sunday, the total loss is paid out as one claim.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{data?.total ?? 0}</Text>
            <Text style={styles.statLbl}>Claims</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={[styles.statNum, { color: "#16a34a" }]}>₹{data?.amount_received ?? 0}</Text>
            <Text style={styles.statLbl}>Received</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={[styles.statNum, { color: "#d97706" }]}>{data?.pending ?? 0}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
        </View>

        {/* Past claims */}
        {error ? (
          <Text style={{ color: "#dc2626", textAlign: "center" }}>{error}</Text>
        ) : claims.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No past claims</Text>
            <Text style={styles.emptySub}>Weekly payouts appear here after Sunday settlement</Text>
          </View>
        ) : (
          <View style={styles.claimsList}>
            <Text style={styles.sectionLabel}>Past Claims</Text>
            {claims.map((claim: any) => {
              const sc      = statusConfig[claim.status] ?? statusConfig.processing;
              const isOpen  = expanded === claim.id;
              const trigger = claim.trigger_type?.replace(/_/g, " ") ?? "Disruption";
              const date    = claim.created_at
                ? new Date(claim.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "";

              return (
                <TouchableOpacity
                  key={claim.id}
                  style={styles.claimCard}
                  onPress={() => setExpanded(isOpen ? null : claim.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.claimRow}>
                    <View style={styles.claimLeft}>
                      <Text style={styles.claimTrigger}>{trigger}</Text>
                      <Text style={styles.claimDate}>{date}</Text>
                    </View>
                    <View style={styles.claimRight}>
                      <Text style={[styles.claimAmount, { color: claim.status === "paid" ? "#16a34a" : "#0f172a" }]}>
                        ₹{claim.amount ?? 0}
                      </Text>
                      <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusChipText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>
                  </View>

                  {isOpen && (
                    <View style={styles.claimDetail}>
                      {/* Why paid / not paid */}
                      <View style={[styles.reasonBox, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.reasonText, { color: sc.color }]}>
                          {claim.status === "paid"
                            ? "Paid — qualifying disruptions reduced your estimated weekly earnings. Payout = accumulated income loss."
                            : claim.status === "rejected"
                            ? `Rejected: ${claim.reject_reason ?? "Did not meet claim criteria"}`
                            : "Being verified by AI fraud detection. Payout sent once approved."
                          }
                        </Text>
                      </View>

                      {/* Timeline */}
                      {(claim.timeline ?? []).map((step: any, i: number) => (
                        <View key={i} style={styles.timelineRow}>
                          <View style={[styles.tlDot, { backgroundColor: step.completed ? "#16a34a" : "#e2e8f0" }]} />
                          <Text style={[styles.tlLabel, { color: step.completed ? "#0f172a" : "#94a3b8" }]}>{step.event}</Text>
                          <Text style={styles.tlTime}>
                            {step.timestamp ? new Date(step.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  header: { gap: 2 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 13, color: "#64748b" },
  // Week card
  weekCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 16, ...shadowSm },
  weekTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  weekLabel: { fontSize: 12, color: "#64748b" },
  weekAmount: { fontSize: 28, fontWeight: "800", marginTop: 2 },
  weekRight: { alignItems: "flex-end", gap: 6 },
  settleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  settleBadgeText: { fontSize: 11, fontWeight: "700" },
  settleDate: { fontSize: 11, color: "#94a3b8" },
  // Factor breakdown
  factorBreakdown: { gap: 12 },
  factorBreakdownTitle: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  factorRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  factorIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  factorInfo: { flex: 1, gap: 4 },
  factorTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  factorLabel: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  factorAmount: { fontSize: 13, fontWeight: "700" },
  factorBarBg: { height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" },
  factorBarFill: { height: "100%", borderRadius: 2 },
  factorThreshold: { fontSize: 10, color: "#94a3b8" },
  noImpact: { flexDirection: "row", alignItems: "center", gap: 8 },
  noImpactText: { fontSize: 13, color: "#16a34a" },
  howBox: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12, gap: 4 },
  howTitle: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  howText: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  // Stats
  statsRow: { backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", ...shadowSm },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: "#f1f5f9" },
  statNum: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  statLbl: { fontSize: 10, color: "#94a3b8", fontWeight: "500", marginTop: 2 },
  // Empty
  empty: { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#334155" },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center", maxWidth: 240 },
  // Claims
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  claimsList: { gap: 10 },
  claimCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, ...shadowSm },
  claimRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  claimLeft: { gap: 3 },
  claimTrigger: { fontSize: 14, fontWeight: "600", color: "#0f172a", textTransform: "capitalize" },
  claimDate: { fontSize: 12, color: "#94a3b8" },
  claimRight: { alignItems: "flex-end", gap: 4 },
  claimAmount: { fontSize: 16, fontWeight: "800" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusChipText: { fontSize: 11, fontWeight: "600" },
  claimDetail: { marginTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  reasonBox: { borderRadius: 10, padding: 10 },
  reasonText: { fontSize: 12, lineHeight: 17 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tlDot: { width: 8, height: 8, borderRadius: 4 },
  tlLabel: { flex: 1, fontSize: 12, fontWeight: "500" },
  tlTime: { fontSize: 11, color: "#94a3b8" },
});

export default ClaimsScreen;
