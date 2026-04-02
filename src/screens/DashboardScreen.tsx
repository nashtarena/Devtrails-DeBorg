import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

const liveDataColors: Record<string, string> = {
  "bg-si-red-50": "#fef2f2",
  "bg-si-blue-50": "#dbeafe",
  "bg-si-yellow-50": "#fefce8",
  "bg-si-orange-50": "#fff7ed",
  "bg-si-green-50": "#f0fdf4",
};

const DashboardScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Hello Raju 👋</Text>
          <Text style={styles.greetingSubtitle}>Your coverage is active</Text>
        </View>

        {/* Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Icon name="warning" size={18} color="#ffffff" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Heavy Rain Alert</Text>
            <Text style={styles.alertText}>
              Expected 40mm rainfall in your area. Claim auto-triggers if threshold exceeded.
            </Text>
          </View>
        </View>

        {/* Live Data Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Conditions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[
              { icon: "thermostat", label: "Temp", value: "34°C", color: "#fef2f2" },
              { icon: "water-drop", label: "Rain", value: "12mm", color: "#dbeafe" },
              { icon: "air", label: "AQI", value: "156", color: "#fefce8" },
              { icon: "directions-car", label: "Traffic", value: "Heavy", color: "#fff7ed" },
            ].map((item) => (
              <View key={item.label} style={[styles.liveCard, { backgroundColor: "#ffffff" }]}>
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
              <Text style={styles.protectionLabel}>Weekly Premium</Text>
              <Text style={styles.protectionAmount}>₹29</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>✓ Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.protectionFooter}>
            <View>
              <Text style={styles.protectionSubLabel}>Coverage</Text>
              <Text style={styles.protectionSubValue}>Weather + Traffic</Text>
            </View>
            <View style={styles.protectionRight}>
              <Text style={styles.protectionSubLabel}>Next Renewal</Text>
              <Text style={styles.protectionSubValue}>Mon, 7 Apr</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: "description", label: "Claims", color: "#dbeafe" },
              { icon: "analytics", label: "Risk Score", color: "#f0fdf4" },
              { icon: "credit-card", label: "Payments", color: "#fff7ed" },
              { icon: "map", label: "Map", color: "#fef2f2" },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.quickActionCard}>
                <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} size={20} color="#374151" />
                </View>
                <Text style={styles.quickActionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Risk Meter */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskTitle}>Risk Score</Text>
            <View style={styles.riskBadge}>
              <Text style={styles.riskBadgeText}>Moderate</Text>
            </View>
          </View>
          <View style={styles.riskMeter}>
            <View style={styles.riskCircleOuter}>
              <View style={styles.riskCircleInner}>
                <Text style={styles.riskScore}>72</Text>
                <Text style={styles.riskMax}>/100</Text>
              </View>
            </View>
          </View>
          <View style={styles.riskLabels}>
            <Text style={styles.riskSubLabel}>Weather Risk</Text>
            <Text style={styles.riskSubLabel}>Traffic Risk</Text>
          </View>
        </View>

        {/* 7-day Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[
              { day: "Mon", icon: "cloud", risk: "High", color: "#ef4444" },
              { day: "Tue", icon: "grain", risk: "Med", color: "#f97316" },
              { day: "Wed", icon: "wb-sunny", risk: "Low", color: "#22c55e" },
              { day: "Thu", icon: "wb-sunny", risk: "Low", color: "#22c55e" },
              { day: "Fri", icon: "cloud", risk: "High", color: "#ef4444" },
              { day: "Sat", icon: "air", risk: "Med", color: "#f97316" },
              { day: "Sun", icon: "wb-sunny", risk: "Low", color: "#22c55e" },
            ].map((item) => (
              <View key={item.day} style={styles.forecastCard}>
                <Text style={styles.forecastDay}>{item.day}</Text>
                <Icon name={item.icon} size={18} color="#6b7280" />
                <Text style={[styles.forecastRisk, { color: item.color }]}>{item.risk}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Payouts */}
        <View style={styles.section}>
          <View style={styles.payoutsHeader}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Icon name="chevron-right" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {[
            { reason: "Heavy Rainfall", amount: "₹150", date: "28 Mar", status: "Paid" },
            { reason: "Extreme Heat", amount: "₹80", date: "25 Mar", status: "Paid" },
            { reason: "Traffic Surge", amount: "₹120", date: "22 Mar", status: "Processing" },
          ].map((payout, i) => (
            <View key={i} style={styles.payoutCard}>
              <View style={styles.payoutIcon}>
                <Icon name="trending-up" size={18} color="#22c55e" />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutReason}>{payout.reason}</Text>
                <Text style={styles.payoutDate}>{payout.date}</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>{payout.amount}</Text>
                <Text style={[styles.payoutStatus, { color: payout.status === "Paid" ? "#22c55e" : "#f97316" }]}>
                  {payout.status}
                </Text>
              </View>
            </View>
          ))}
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
  greeting: {
    gap: 2,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  alertBanner: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  alertText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  horizontalScroll: {
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  liveCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    alignItems: "center",
    gap: 8,
    marginRight: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  liveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  liveValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  liveLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  protectionCard: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  protectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  protectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  protectionAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  activeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  protectionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  protectionSubLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  protectionSubValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 2,
  },
  protectionRight: {
    alignItems: "flex-end",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  riskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    elevation: 3,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  riskBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
  },
  riskMeter: {
    alignItems: "center",
  },
  riskCircleOuter: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  riskCircleInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  riskScore: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  riskMax: {
    fontSize: 12,
    color: "#6b7280",
  },
  riskLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  riskSubLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  forecastCard: {
    backgroundColor: "#ffffff",
    minWidth: 72,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
    marginRight: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
  },
  forecastRisk: {
    fontSize: 10,
    fontWeight: "700",
  },
  payoutsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  payoutCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    marginTop: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  payoutInfo: {
    flex: 1,
  },
  payoutReason: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  payoutDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  payoutRight: {
    alignItems: "flex-end",
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  payoutStatus: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default DashboardScreen;