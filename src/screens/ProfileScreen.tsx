import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";
import { shadowMd } from "../constants/shadows";

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Raju Kumar</Text>
            <Text style={styles.profileMeta}>SWG-12345 · Full-time</Text>
          </View>
        </View>

        {/* Policy Card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Policy Details</Text>
          <View style={styles.policyList}>
            {[
              { label: "Policy ID", value: "SI-2026-00429" },
              { label: "Plan", value: "Weather + Traffic Shield" },
              { label: "Weekly Premium", value: "₹29" },
              { label: "Coverage Since", value: "15 Mar 2026" },
              { label: "Total Claims", value: "3 (₹350 received)" },
            ].map((item, i) => (
              <View key={i}>
                <View style={styles.policyRow}>
                  <Text style={styles.policyLabel}>{item.label}</Text>
                  <Text style={styles.policyValue}>{item.value}</Text>
                </View>
                {i < 4 && <View style={styles.policyDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {[
            { icon: "person", label: "Personal Details", bgColor: "#dbeafe", iconColor: "#2563eb" },
            { icon: "phone", label: "Contact Info", bgColor: "#f0fdf4", iconColor: "#22c55e" },
            { icon: "location-on", label: "Delivery Zone", bgColor: "#fff7ed", iconColor: "#f97316" },
            { icon: "verified-user", label: "KYC Documents", bgColor: "#fef2f2", iconColor: "#ef4444" },
            { icon: "credit-card", label: "Payment Methods", bgColor: "#fefce8", iconColor: "#eab308" },
            { icon: "description", label: "Policy Documents", bgColor: "#dbeafe", iconColor: "#2563eb" },
            { icon: "help", label: "Help & Support", bgColor: "#f3f4f6", iconColor: "#6b7280" },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                <Icon name={item.icon} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-right" size={16} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Icon name="logout" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  profileMeta: {
    fontSize: 14,
    color: "#6b7280",
  },
  policyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    ...shadowMd,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  policyList: {
    gap: 12,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  policyLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  policyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  policyDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 12,
  },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    ...shadowMd,
  },
  menuItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  logoutButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
});

export default ProfileScreen;
