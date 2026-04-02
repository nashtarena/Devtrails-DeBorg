import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

const claims = [
  {
    id: "CLM-001",
    reason: "Heavy Rainfall (42mm)",
    date: "28 Mar 2026",
    amount: "₹150",
    status: "paid" as const,
    timeline: [
      { label: "Event Detected", time: "2:30 PM", done: true },
      { label: "Claim Auto-Triggered", time: "2:31 PM", done: true },
      { label: "Verified by AI", time: "2:35 PM", done: true },
      { label: "Payout Sent", time: "2:40 PM", done: true },
    ],
  },
  {
    id: "CLM-002",
    reason: "Extreme Heat (44°C)",
    date: "25 Mar 2026",
    amount: "₹80",
    status: "paid" as const,
    timeline: [
      { label: "Event Detected", time: "12:15 PM", done: true },
      { label: "Claim Auto-Triggered", time: "12:16 PM", done: true },
      { label: "Verified by AI", time: "12:20 PM", done: true },
      { label: "Payout Sent", time: "12:25 PM", done: true },
    ],
  },
  {
    id: "CLM-003",
    reason: "Traffic Disruption",
    date: "22 Mar 2026",
    amount: "₹120",
    status: "processing" as const,
    timeline: [
      { label: "Event Detected", time: "6:45 PM", done: true },
      { label: "Claim Auto-Triggered", time: "6:46 PM", done: true },
      { label: "Under Review", time: "Pending", done: false },
      { label: "Payout", time: "—", done: false },
    ],
  },
];

const statusConfig = {
  paid: { label: "Paid", icon: "check-circle", bgColor: "#f0fdf4", textColor: "#22c55e" },
  processing: { label: "Processing", icon: "schedule", bgColor: "#fff7ed", textColor: "#f97316" },
  rejected: { label: "Rejected", icon: "error", bgColor: "#fef2f2", textColor: "#ef4444" },
};

const ClaimsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Track your auto-triggered claims</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>₹350</Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#f97316" }]}>1</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Claims list */}
        <View style={styles.claimsList}>
          {claims.map((claim) => {
            const sc = statusConfig[claim.status];
            return (
              <View key={claim.id} style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  <View>
                    <Text style={styles.claimReason}>{claim.reason}</Text>
                    <Text style={styles.claimMeta}>{claim.date} · {claim.id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bgColor }]}>
                    <Icon name={sc.icon} size={12} color={sc.textColor} />
                    <Text style={[styles.statusText, { color: sc.textColor }]}>{sc.label}</Text>
                  </View>
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                  {claim.timeline.map((step, i) => (
                    <View key={i} style={styles.timelineRow}>
                      <View style={styles.timelineDot}>
                        <View style={[styles.dot, { backgroundColor: step.done ? "#22c55e" : "#e5e7eb" }]} />
                        {i < claim.timeline.length - 1 && (
                          <View style={[styles.timelineLine, { backgroundColor: step.done ? "rgba(34,197,94,0.3)" : "#e5e7eb" }]} />
                        )}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={[styles.timelineLabel, { color: step.done ? "#111827" : "#6b7280" }]}>
                          {step.label}
                        </Text>
                        <Text style={styles.timelineTime}>{step.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.claimFooter}>
                  <Text style={styles.claimAmount}>{claim.amount}</Text>
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsText}>Details</Text>
                    <Icon name="chevron-right" size={14} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  claimsList: {
    gap: 16,
  },
  claimCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    elevation: 3,
  },
  claimHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  claimReason: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  claimMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  timelineDot: {
    flexDirection: "column",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 1,
    height: 24,
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -2,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  timelineTime: {
    fontSize: 10,
    color: "#6b7280",
  },
  claimFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  claimAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
});

export default ClaimsScreen;
