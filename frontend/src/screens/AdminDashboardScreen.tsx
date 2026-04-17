import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar,
} from "react-native";
import { Icon } from "../components/Icon";
import { shadowSm } from "../constants/shadows";

interface AdminDashboardScreenProps {
  onLogout?: () => void;
}

const AdminDashboardScreen = ({ onLogout }: AdminDashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const [stats] = useState({
    total_policies: 1247,
    total_claims: 389,
    approved_claims: 312,
    fraud_detected: 23,
    loss_ratio: 42.5,
    total_payout: 145000,
    total_premium: 341000,
    risk_prediction: "Heavy rain expected in North Delhi zone",
  });

  const [claims] = useState([
    { id: "1", user_name: "Rahul Kumar", disruption_type: "heavy_rain", amount: 250, status: "approved", created_at: "2026-04-17" },
    { id: "2", user_name: "Priya Singh", disruption_type: "extreme_heat", amount: 180, status: "pending", created_at: "2026-04-16" },
    { id: "3", user_name: "Amit Verma", disruption_type: "traffic", amount: 120, status: "approved", created_at: "2026-04-15" },
    { id: "4", user_name: "Sneha Patel", disruption_type: "aqi", amount: 300, status: "fraud", created_at: "2026-04-14" },
  ]);

  const [fraudClaims] = useState([
    { id: "4", user_name: "Sneha Patel", disruption_type: "aqi", amount: 300, reason: { description: "GPS spoofing detected" } },
    { id: "5", user_name: "Vikram Shah", disruption_type: "heavy_rain", amount: 450, reason: { description: "Duplicate claim pattern" } },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  const statCards = [
    { title: "Total Policies", value: stats.total_policies, icon: "assignment", color: "#2563eb", bg: "#eff6ff" },
    { title: "Total Claims", value: stats.total_claims, icon: "trending-up", color: "#7c3aed", bg: "#f3e8ff" },
    { title: "Approved", value: stats.approved_claims, icon: "check-circle", color: "#16a34a", bg: "#dcfce7" },
    { title: "Fraud", value: stats.fraud_detected, icon: "warning", color: "#dc2626", bg: "#fee2e2" },
  ];

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Loss Ratio Card */}
      <View style={styles.lossCard}>
        <Text style={styles.lossLabel}>Loss Ratio</Text>
        <Text style={styles.lossValue}>{stats.loss_ratio}%</Text>
        <Text style={styles.lossSub}>
          Rs.{stats.total_payout.toLocaleString()} paid of Rs.{stats.total_premium.toLocaleString()} premium
        </Text>
        <View style={styles.lossBarBg}>
          <View style={[styles.lossBarFill, { width: `${stats.loss_ratio}%` }]} />
        </View>
      </View>

      {/* Risk Prediction */}
      <View style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <Icon name="cloud" size={20} color="#f97316" />
          <Text style={styles.riskTitle}>Risk Prediction</Text>
        </View>
        <Text style={styles.riskText}>{stats.risk_prediction}</Text>
      </View>

      {/* Payout Trend */}
      <View style={styles.trendCard}>
        <Text style={styles.trendTitle}>Weekly Payout Trend</Text>
        <View style={styles.trendBars}>
          {[
            { day: "Mon", val: 45 },
            { day: "Tue", val: 70 },
            { day: "Wed", val: 55 },
            { day: "Thu", val: 80 },
            { day: "Fri", val: 90 },
            { day: "Sat", val: 65 },
            { day: "Sun", val: 100 },
          ].map((d, i) => (
            <View key={i} style={styles.trendBarCol}>
              <View style={styles.trendBarBg}>
                <View style={[styles.trendBarFill, { height: `${d.val}%` }]} />
              </View>
              <Text style={styles.trendBarDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderClaims = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Claims</Text>
      {claims.map((claim) => (
        <View key={claim.id} style={styles.claimCard}>
          <View style={styles.claimHeader}>
            <View style={[styles.claimDot, { backgroundColor: claim.status === "approved" ? "#16a34a" : claim.status === "fraud" ? "#dc2626" : "#f97316" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.claimName}>{claim.user_name}</Text>
              <Text style={styles.claimType}>{claim.disruption_type.replace(/_/g, " ")}</Text>
            </View>
            <Text style={[styles.claimAmt, { color: claim.status === "approved" ? "#16a34a" : "#64748b" }]}>
              Rs.{claim.amount}
            </Text>
          </View>
          <View style={styles.claimFooter}>
            <Text style={styles.claimDate}>{claim.created_at}</Text>
            <View style={[styles.statusBadge, { backgroundColor: claim.status === "approved" ? "#dcfce7" : claim.status === "fraud" ? "#fee2e2" : "#fef3c7" }]}>
              <Text style={[styles.statusText, { color: claim.status === "approved" ? "#16a34a" : claim.status === "fraud" ? "#dc2626" : "#f97316" }]}>
                {claim.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFraud = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Flagged Claims ({fraudClaims.length})</Text>
      {fraudClaims.map((claim) => (
        <View key={claim.id} style={styles.fraudCard}>
          <View style={styles.fraudHeader}>
            <Icon name="error" size={20} color="#dc2626" />
            <Text style={styles.fraudName}>{claim.user_name}</Text>
          </View>
          <Text style={styles.fraudType}>{claim.disruption_type.toUpperCase()} - Rs.{claim.amount}</Text>
          <View style={styles.fraudReason}>
            <Icon name="report-problem" size={14} color="#dc2626" />
            <Text style={styles.fraudReasonText}>{claim.reason.description}</Text>
          </View>
          <View style={styles.fraudActions}>
            <TouchableOpacity style={styles.overrideBtn}>
              <Text style={styles.overrideBtnText}>Override</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>Key Metrics</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Approval Rate</Text>
          <Text style={[styles.metricValue, { color: "#16a34a" }]}>80.2%</Text>
        </View>
        <View style={styles.metricBarBg}>
          <View style={[styles.metricBarFill, { width: "80.2%", backgroundColor: "#16a34a" }]} />
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Fraud Rate</Text>
          <Text style={[styles.metricValue, { color: "#dc2626" }]}>5.9%</Text>
        </View>
        <View style={styles.metricBarBg}>
          <View style={[styles.metricBarFill, { width: "5.9%", backgroundColor: "#dc2626" }]} />
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Payout Time</Text>
          <Text style={[styles.metricValue, { color: "#2563eb" }]}>2.4 hrs</Text>
        </View>
      </View>

      {/* Claims by Type */}
      <View style={styles.typeCard}>
        <Text style={styles.metricsTitle}>Claims by Type</Text>
        {[
          { type: "Heavy Rain", count: 145, color: "#2563eb" },
          { type: "Extreme Heat", count: 98, color: "#f97316" },
          { type: "Traffic", count: 76, color: "#7c3aed" },
          { type: "AQI", count: 70, color: "#64748b" },
        ].map((item, i) => (
          <View key={i} style={styles.typeRow}>
            <View style={[styles.typeDot, { backgroundColor: item.color }]} />
            <Text style={styles.typeLabel}>{item.type}</Text>
            <Text style={styles.typeCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPredictions = () => (
    <View style={styles.tabContent}>
      <View style={styles.predCard}>
        <Text style={styles.predTitle}>Next Week Forecast</Text>
        <View style={styles.predGrid}>
          <View style={styles.predItem}>
            <Text style={styles.predLabel}>Region</Text>
            <Text style={styles.predValue}>North Delhi</Text>
          </View>
          <View style={styles.predItem}>
            <Text style={styles.predLabel}>Disruption</Text>
            <Text style={styles.predValue}>Heavy Rain</Text>
          </View>
          <View style={styles.predItem}>
            <Text style={styles.predLabel}>Claims Spike</Text>
            <Text style={[styles.predValue, { color: "#16a34a" }]}>+35%</Text>
          </View>
          <View style={styles.predItem}>
            <Text style={styles.predLabel}>Confidence</Text>
            <Text style={[styles.predValue, { color: "#2563eb" }]}>87%</Text>
          </View>
        </View>
        <View style={styles.predRec}>
          <Icon name="lightbulb" size={16} color="#f97316" />
          <Text style={styles.predRecText}>Increase reserve fund by 20% for North zone</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Top Disruption Zones</Text>
      {[
        { zone: "North Delhi", count: 89 },
        { zone: "South Delhi", count: 67 },
        { zone: "East Delhi", count: 45 },
        { zone: "West Delhi", count: 38 },
      ].map((item, i) => (
        <View key={i} style={styles.zoneRow}>
          <Text style={styles.zoneName}>{item.zone}</Text>
          <View style={styles.zoneBarBg}>
            <View style={[styles.zoneBarFill, { width: `${(item.count / 89) * 100}%` }]} />
          </View>
          <Text style={styles.zoneCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>SecInsure Operations</Text>
        </View>
        {onLogout && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Icon name="logout" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <View style={[styles.statIconBox, { backgroundColor: card.color + "20" }]}>
              <Icon name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.statTitle}>{card.title}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {["overview", "claims", "fraud", "analytics", "predictions"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "claims" && renderClaims()}
        {activeTab === "fraud" && renderFraud()}
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "predictions" && renderPredictions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  
  // Header
  header: {
    backgroundColor: "#7c3aed",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#ffffff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    ...shadowSm,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statTitle: { fontSize: 11, color: "#64748b", marginTop: 4 },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: "#7c3aed" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  tabContent: { gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },

  // Overview Cards
  lossCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    ...shadowSm,
  },
  lossLabel: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  lossValue: { fontSize: 36, fontWeight: "800", color: "#16a34a", marginTop: 4 },
  lossSub: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  lossBarBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 12, overflow: "hidden" },
  lossBarFill: { height: "100%", backgroundColor: "#16a34a", borderRadius: 3 },

  riskCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  riskHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  riskText: { fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 20 },

  trendCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    ...shadowSm,
  },
  trendTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 16 },
  trendBars: { flexDirection: "row", justifyContent: "space-between", height: 100 },
  trendBarCol: { alignItems: "center", width: 40 },
  trendBarBg: { width: 12, height: 80, backgroundColor: "#e2e8f0", borderRadius: 6, overflow: "hidden" },
  trendBarFill: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#7c3aed", borderRadius: 6 },
  trendBarDay: { fontSize: 10, color: "#94a3b8", marginTop: 6 },

  // Claims
  claimCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    ...shadowSm,
  },
  claimHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  claimDot: { width: 10, height: 10, borderRadius: 5 },
  claimName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  claimType: { fontSize: 12, color: "#94a3b8", marginTop: 2, textTransform: "capitalize" },
  claimAmt: { fontSize: 16, fontWeight: "700" },
  claimFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  claimDate: { fontSize: 11, color: "#94a3b8" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "700" },

  // Fraud
  fraudCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  fraudHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  fraudName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  fraudType: { fontSize: 12, color: "#64748b", marginTop: 4 },
  fraudReason: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start" },
  fraudReasonText: { fontSize: 11, color: "#dc2626", fontWeight: "500" },
  fraudActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  overrideBtn: { backgroundColor: "#16a34a", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  overrideBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 12 },
  reviewBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  reviewBtnText: { color: "#64748b", fontWeight: "600", fontSize: 12 },

  // Analytics
  metricsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    ...shadowSm,
  },
  metricsTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 12 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  metricLabel: { fontSize: 13, color: "#64748b" },
  metricValue: { fontSize: 18, fontWeight: "700" },
  metricBarBg: { height: 5, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  metricBarFill: { height: "100%", borderRadius: 3 },

  typeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    ...shadowSm,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  typeLabel: { flex: 1, fontSize: 13, color: "#0f172a" },
  typeCount: { fontSize: 14, fontWeight: "600", color: "#64748b" },

  // Predictions
  predCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  predTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 14 },
  predGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  predItem: { width: "45%" },
  predLabel: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  predValue: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  predRec: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#bfdbfe" },
  predRecText: { fontSize: 12, color: "#64748b", flex: 1 },

  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    ...shadowSm,
  },
  zoneName: { fontSize: 13, fontWeight: "500", color: "#0f172a", width: 100 },
  zoneBarBg: { flex: 1, height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  zoneBarFill: { height: "100%", backgroundColor: "#f97316", borderRadius: 3 },
  zoneCount: { fontSize: 13, fontWeight: "700", color: "#0f172a", width: 30, textAlign: "right" },
});

export default AdminDashboardScreen;
