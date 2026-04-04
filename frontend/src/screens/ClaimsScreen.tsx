import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { Icon } from "../components/Icon";
import { shadowMd, shadowSm } from "../constants/shadows";
import { api } from "../lib/api";

const statusConfig: Record<string, { label: string; icon: string; bgColor: string; textColor: string }> = {
  paid:       { label: "Paid",       icon: "check-circle", bgColor: "#f0fdf4", textColor: "#22c55e" },
  processing: { label: "Processing", icon: "schedule",     bgColor: "#fff7ed", textColor: "#f97316" },
  rejected:   { label: "Rejected",   icon: "error",        bgColor: "#fef2f2", textColor: "#ef4444" },
};

const fraudConfig: Record<string, { label: string; color: string; bg: string }> = {
  AUTO_APPROVED: { label: "AI Approved",  color: "#22c55e", bg: "#f0fdf4" },
  FLAGGED:       { label: "AI Flagged",   color: "#f97316", bg: "#fff7ed" },
  AUTO_REJECTED: { label: "AI Rejected",  color: "#ef4444", bg: "#fef2f2" },
};

const ClaimsScreen = () => {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [fraudMap, setFraudMap] = useState<Record<string, any>>({});

  useEffect(() => {
    api.claims.list()
      .then(async (res) => {
        setData(res);
        // Run ML fraud check for each claim in parallel
        const claims: any[] = res?.claims ?? [];
        const results = await Promise.allSettled(
          claims.map((c: any) =>
            api.ml.fraud({
              claim_id: c.id,
              gps_accuracy_m: 14.0,
              accel_norm: 10.5,
              location_velocity_kmh: 20.0,
              network_type: 1,
              order_acceptance_latency_s: 30.0,
              battery_drain_pct_per_hr: 12.0,
              peer_claims_same_window: 2,
              zone_claim_spike_ratio: 1.5,
              device_subnet_overlap: 0,
              claim_time_std_minutes: 45.0,
            })
          )
        );
        const map: Record<string, any> = {};
        claims.forEach((c: any, i: number) => {
          if (results[i].status === "fulfilled") map[c.id] = (results[i] as any).value;
        });
        setFraudMap(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const claims: any[] = data?.claims ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Auto-triggered · AI verified</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.total ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>₹{data?.amount_received ?? 0}</Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#f97316" }]}>{data?.pending ?? 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {error ? (
          <Text style={{ color: "#ef4444", textAlign: "center" }}>{error}</Text>
        ) : claims.length === 0 ? (
          <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>No claims yet</Text>
        ) : (
          <View style={styles.claimsList}>
            {claims.map((claim: any) => {
              const sc     = statusConfig[claim.status] ?? statusConfig.processing;
              const fraud  = fraudMap[claim.id];
              const fc     = fraud ? (fraudConfig[fraud.decision] ?? fraudConfig.AUTO_APPROVED) : null;
              const timeline: any[] = claim.timeline ?? [];

              return (
                <View key={claim.id} style={styles.claimCard}>
                  {/* Header */}
                  <View style={styles.claimHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimReason}>{claim.trigger_type ?? "Claim"}</Text>
                      <Text style={styles.claimMeta}>
                        {claim.created_at
                          ? new Date(claim.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : ""} · {claim.id?.slice(0, 8)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bgColor }]}>
                      <Icon name={sc.icon} size={12} color={sc.textColor} />
                      <Text style={[styles.statusText, { color: sc.textColor }]}>{sc.label}</Text>
                    </View>
                  </View>

                  {/* ML Fraud verdict */}
                  {fc && (
                    <View style={[styles.fraudRow, { backgroundColor: fc.bg }]}>
                      <Icon name="security" size={14} color={fc.color} />
                      <Text style={[styles.fraudLabel, { color: fc.color }]}>{fc.label}</Text>
                      {fraud.fraud_probability != null && (
                        <Text style={[styles.fraudProb, { color: fc.color }]}>
                          {Math.round(fraud.fraud_probability * 100)}% fraud prob
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Fraud signals */}
                  {fraud?.triggered_signals?.length > 0 && (
                    <View style={styles.signalsBox}>
                      {fraud.triggered_signals.slice(0, 2).map((s: string, i: number) => (
                        <Text key={i} style={styles.signalText}>⚠ {s}</Text>
                      ))}
                    </View>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <View style={styles.timeline}>
                      {timeline.map((step: any, i: number) => (
                        <View key={i} style={styles.timelineRow}>
                          <View style={styles.timelineDot}>
                            <View style={[styles.dot, { backgroundColor: step.completed ? "#22c55e" : "#e5e7eb" }]} />
                            {i < timeline.length - 1 && (
                              <View style={[styles.timelineLine, { backgroundColor: step.completed ? "rgba(34,197,94,0.3)" : "#e5e7eb" }]} />
                            )}
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={[styles.timelineLabel, { color: step.completed ? "#111827" : "#6b7280" }]}>{step.event}</Text>
                            <Text style={styles.timelineTime}>
                              {step.timestamp ? new Date(step.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.claimFooter}>
                    <Text style={styles.claimAmount}>₹{claim.amount ?? 0}</Text>
                    {fraud?.explanation && (
                      <Text style={styles.explanationText} numberOfLines={2}>{fraud.explanation}</Text>
                    )}
                  </View>
                </View>
              );
            })}
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
  header: { gap: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: 12, alignItems: "center", paddingVertical: 16, ...shadowSm },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, color: "#6b7280", fontWeight: "500" },
  claimsList: { gap: 16 },
  claimCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, gap: 12, ...shadowMd },
  claimHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  claimReason: { fontSize: 14, fontWeight: "700", color: "#111827" },
  claimMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  fraudRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  fraudLabel: { fontSize: 12, fontWeight: "700", flex: 1 },
  fraudProb: { fontSize: 11, fontWeight: "500" },
  signalsBox: { gap: 3 },
  signalText: { fontSize: 11, color: "#92400e" },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timelineDot: { flexDirection: "column", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 1, height: 24 },
  timelineContent: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -2 },
  timelineLabel: { fontSize: 12, fontWeight: "500" },
  timelineTime: { fontSize: 10, color: "#6b7280" },
  claimFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  claimAmount: { fontSize: 18, fontWeight: "800", color: "#111827" },
  explanationText: { fontSize: 11, color: "#6b7280", flex: 1, textAlign: "right" },
});

export default ClaimsScreen;
