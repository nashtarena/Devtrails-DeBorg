import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Icon } from "../components/Icon";
import { shadowMd } from "../constants/shadows";
import { api } from "../lib/api";

interface ProfileScreenProps {
  onLogout: () => void;
}

const ProfileScreen = ({ onLogout, topPadding = 0 }: { onLogout: () => void; topPadding?: number }) => {
  const [profile, setProfile]     = useState<any>(null);
  const [coverage, setCoverage]   = useState<any>(null);
  const [mlPremium, setMlPremium] = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.partner.getProfile(),
      api.partner.getCoverage(),
      api.partner.getRiskScore(),   // already has ml_premium with real live data
    ])
      .then(([p, c, risk]) => {
        setProfile(p);
        setCoverage(c);
        if (risk?.ml_premium) setMlPremium(risk.ml_premium);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const coverageSince = coverage?.coverage_since
    ? new Date(coverage.coverage_since).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "--";

  const policyRows = [
    { label: "Plan", value: coverage?.plan ?? "--" },
    { label: "AI Weekly Premium", value: mlPremium ? `₹${mlPremium.weekly_premium_inr}/week · ${mlPremium.risk_tier}` : `₹${coverage?.weekly_premium ?? "--"}/week` },
    { label: "Coverage Since", value: coverageSince },
    { label: "Total Claims", value: `${coverage?.total_claims ?? 0} (₹${coverage?.total_payout ?? 0} received)` },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.name ?? "--"}</Text>
            <Text style={styles.profileMeta}>{profile?.swiggy_partner_id ?? "--"} · {profile?.work_type ?? "--"}</Text>
          </View>
        </View>

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Policy Details</Text>
          <View style={styles.policyList}>
            {policyRows.map((item, i) => (
              <View key={i}>
                <View style={styles.policyRow}>
                  <Text style={styles.policyLabel}>{item.label}</Text>
                  <Text style={styles.policyValue}>{item.value}</Text>
                </View>
                {i < policyRows.length - 1 && <View style={styles.policyDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.menuCard}>
          {[
            { icon: "person", label: "Personal Details", bgColor: "#dbeafe", iconColor: "#2563eb" },
            { icon: "phone", label: "Contact Info", bgColor: "#f0fdf4", iconColor: "#22c55e" },
            { icon: "location-on", label: "Delivery Zone", bgColor: "#fff7ed", iconColor: "#f97316" },
            { icon: "verified-user", label: "KYC Documents", bgColor: "#fef2f2", iconColor: "#ef4444" },
            { icon: "credit-card", label: "Payment Methods", bgColor: "#fefce8", iconColor: "#eab308" },
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

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
          <Icon name="logout" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#ffffff" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  profileMeta: { fontSize: 14, color: "#6b7280" },
  policyCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, gap: 12, ...shadowMd },
  policyTitle: { fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  policyList: { gap: 12 },
  policyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  policyLabel: { fontSize: 14, color: "#6b7280" },
  policyValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  policyDivider: { height: 1, backgroundColor: "#e5e7eb", marginTop: 12 },
  menuCard: { backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", ...shadowMd },
  menuItem: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },
  logoutButton: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: "#fef2f2" },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
});

export default ProfileScreen;
