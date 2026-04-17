import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const AdminDashboardPage = () => {
  const router = useRouter();
  const {
    stats,
    claims,
    fraudClaims,
    analytics,
    predictions,
    loading,
    error,
    refreshData,
    processPayout,
    approveClaim,
  } = useAdminDashboard();

  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has admin rights - redirect if not
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Try to verify admin access
        const response = await fetch('http://localhost:8000/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
          }
        });
        if (response.status === 401 || response.status === 403) {
          // Not authorized - redirect to home
          router.replace('/');
          Alert.alert('Access Denied', 'You do not have admin access');
        }
      } catch (e) {
        console.warn('Admin access check failed:', e);
      }
    };
    checkAdminAccess();
  }, [router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handlePayout = async (claimId: string, amount: number) => {
    try {
      const result = await processPayout(claimId, amount);
      if (result.success) {
        Alert.alert(
          "Success",
          `Payout processed! Transaction ID: ${result.transaction_id}`
        );
      } else {
        Alert.alert("Error", result.error || "Failed to process payout");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to process payout");
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      const result = await approveClaim(claimId);
      if (result.success) {
        Alert.alert("Success", "Claim approved!");
      } else {
        Alert.alert("Error", result.error || "Failed to approve claim");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to approve claim");
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Real-time parametric insurance operations
          </Text>
        </View>

        {/* Stats Cards */}
        {loading && <ActivityIndicator size="large" color="#3b82f6" />}

        {!loading && stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: "#3b82f6" }]}>
                <Text style={styles.statValue}>{stats.total_policies}</Text>
                <Text style={styles.statLabel}>Total Policies</Text>
                <Text style={styles.statSubtext}>Active workers</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#8b5cf6" }]}>
                <Text style={styles.statValue}>{stats.total_claims}</Text>
                <Text style={styles.statLabel}>Total Claims</Text>
                <Text style={styles.statSubtext}>All submissions</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
                <Text style={styles.statValue}>{stats.approved_claims}</Text>
                <Text style={styles.statLabel}>Approved</Text>
                <Text style={styles.statSubtext}>Ready for payout</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
                <Text style={styles.statValue}>{stats.fraud_detected}</Text>
                <Text style={styles.statLabel}>Fraud Detected</Text>
                <Text style={styles.statSubtext}>Suspicious claims</Text>
              </View>
            </View>

            {/* Overview Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
              <View style={styles.metricCard}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Loss Ratio</Text>
                  <Text style={styles.metricValue}>{stats.loss_ratio.toFixed(2)}%</Text>
                </View>
                <View style={styles.metricProgress}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(stats.loss_ratio, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.metricDetail}>
                  ₹{stats.total_payout.toFixed(2)} of ₹{stats.total_premium.toFixed(2)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.predictionTitle}>🌤️ Risk Prediction</Text>
                <Text style={styles.predictionText}>{stats.risk_prediction}</Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              {["overview", "claims", "fraud", "analytics"].map((tab) => (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab && styles.activeTabLabel,
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === "claims" && claims && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  All Claims ({claims.total})
                </Text>
                {claims.claims.slice(0, 10).map((claim) => (
                  <View key={claim.id} style={styles.claimCard}>
                    <View style={styles.claimHeader}>
                      <Text style={styles.claimName}>{claim.user_name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          claim.status === "approved" &&
                            styles.statusApproved,
                          claim.status === "fraud" && styles.statusFraud,
                          claim.status === "processing" &&
                            styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>{claim.status}</Text>
                      </View>
                    </View>
                    <View style={styles.claimDetails}>
                      <Text style={styles.claimType}>
                        {claim.disruption_type.toUpperCase()}
                      </Text>
                      <Text style={styles.claimAmount}>₹{claim.amount}</Text>
                    </View>
                    {claim.status === "approved" && (
                      <Pressable
                        style={styles.payoutButton}
                        onPress={() =>
                          handlePayout(claim.id, claim.amount)
                        }
                      >
                        <Text style={styles.payoutText}>Process Payout</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}

            {activeTab === "fraud" && fraudClaims && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Fraud Alerts ({fraudClaims.total})
                </Text>
                {fraudClaims.claims.map((claim) => (
                  <View key={claim.id} style={styles.fraudCard}>
                    <View style={styles.fraudHeader}>
                      <Text style={styles.fraudName}>{claim.user_name}</Text>
                    </View>
                    <View style={styles.fraudDetails}>
                      <Text style={styles.fraudType}>
                        {claim.disruption_type.toUpperCase()} • ₹{claim.amount}
                      </Text>
                      <View style={styles.reasonBox}>
                        <Text style={styles.reasonText}>
                          ⚠️ {claim.reason.description}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.overrideButton}
                      onPress={() => handleApprove(claim.id)}
                    >
                      <Text style={styles.overrideText}>Override & Approve</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {activeTab === "analytics" && analytics && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Analytics</Text>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticCard}>
                    <Text style={styles.analyticLabel}>Approval Rate</Text>
                    <Text style={styles.analyticValue}>
                      {analytics.approval_rate.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.analyticCard}>
                    <Text style={styles.analyticLabel}>Fraud Rate</Text>
                    <Text style={styles.analyticValue}>
                      {analytics.fraud_rate.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.analyticCard}>
                  <Text style={styles.analyticLabel}>Avg Payout Time</Text>
                  <Text style={styles.analyticValue}>
                    {analytics.average_payout_time_hours.toFixed(1)} hours
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top Disruption Zones</Text>
                  {analytics.top_disruption_zones.map((zone, index) => (
                    <View key={index} style={styles.zoneRow}>
                      <Text style={styles.zoneName}>{zone.zone}</Text>
                      <Text style={styles.zoneCount}>{zone.count} claims</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === "overview" && predictions && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Next Week Predictions</Text>
                <View style={styles.predictionCard}>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Region</Text>
                    <Text style={styles.predictionValue}>
                      {predictions.region}
                    </Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>
                      Expected Disruption
                    </Text>
                    <Text style={styles.predictionValue}>
                      {predictions.expected_disruption.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>
                      Claims Increase
                    </Text>
                    <Text
                      style={[
                        styles.predictionValue,
                        { color: "#10b981" },
                      ]}
                    >
                      +{predictions.predicted_claims_increase}%
                    </Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Confidence</Text>
                    <Text style={styles.predictionValue}>
                      {(predictions.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.predictionRecommendation}>
                    <Text style={styles.recommendationTitle}>
                      Recommendation:
                    </Text>
                    <Text style={styles.recommendationText}>
                      {predictions.recommendation}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
  metricProgress: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
  },
  metricDetail: {
    fontSize: 12,
    color: "#64748b",
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#3b82f6",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabLabel: {
    color: "#ffffff",
  },
  claimCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  claimHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  claimName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#f1f5f9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  statusApproved: {
    backgroundColor: "#d1fae5",
  },
  statusFraud: {
    backgroundColor: "#fee2e2",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  claimDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  claimType: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  claimAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  payoutButton: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  payoutText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  fraudCard: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  fraudHeader: {
    marginBottom: 8,
  },
  fraudName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991b1b",
  },
  fraudDetails: {
    marginBottom: 8,
  },
  fraudType: {
    fontSize: 12,
    color: "#7f1d1d",
    marginBottom: 8,
    fontWeight: "500",
  },
  reasonBox: {
    backgroundColor: "rgba(153, 27, 27, 0.1)",
    padding: 8,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 12,
    color: "#991b1b",
    fontWeight: "500",
  },
  overrideButton: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  overrideText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  analyticsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  analyticCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  analyticLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  analyticValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b82f6",
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  zoneName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1e293b",
  },
  zoneCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b82f6",
  },
  predictionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  predictionLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  predictionRecommendation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  statusFraudBadge: {
    backgroundColor: "#fee2e2",
  },
  statusFraudText: {
    color: "#dc2626",
  },
});

export default AdminDashboardPage;
