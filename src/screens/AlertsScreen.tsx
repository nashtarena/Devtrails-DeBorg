import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Icon } from "../components/Icon";

const alerts = [
  { icon: "cloud-queue", title: "Heavy Rain Warning", desc: "40mm+ expected in Koramangala area. Auto-claim enabled.", time: "2 min ago", severity: "high" as const },
  { icon: "thermostat", title: "Heat Advisory", desc: "Temperature may exceed 42°C between 12-3 PM.", time: "1 hr ago", severity: "medium" as const },
  { icon: "air", title: "Poor Air Quality", desc: "AQI 180 in your zone. Consider wearing a mask.", time: "3 hr ago", severity: "medium" as const },
  { icon: "directions-car", title: "Traffic Congestion", desc: "Major jam on Outer Ring Road. Expect 30min delays.", time: "5 hr ago", severity: "low" as const },
  { icon: "warning", title: "Flood Risk", desc: "Low-lying areas near Silk Board may experience waterlogging.", time: "Yesterday", severity: "high" as const },
  { icon: "thermostat", title: "Heat Wave Ended", desc: "Temperatures back to normal. Coverage threshold reset.", time: "2 days ago", severity: "info" as const },
];

const severityStyles: Record<string, { bgColor: string; textColor: string }> = {
  high: { bgColor: "#fef2f2", textColor: "#ef4444" },
  medium: { bgColor: "#fff7ed", textColor: "#f97316" },
  low: { bgColor: "#fefce8", textColor: "#eab308" },
  info: { bgColor: "#dbeafe", textColor: "#2563eb" },
};

const AlertsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Real-time disruption feed</Text>
        </View>

        <View style={styles.alertsList}>
          {alerts.map((alert, i) => {
            const style = severityStyles[alert.severity];
            return (
              <View key={i} style={styles.alertCard}>
                <View style={[styles.alertIcon, { backgroundColor: style.bgColor }]}>
                  <Icon name={alert.icon} size={18} color={style.textColor} />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
                    <Text style={styles.alertTime}>{alert.time}</Text>
                  </View>
                  <Text style={styles.alertDesc}>{alert.desc}</Text>
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
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  alertTime: {
    fontSize: 10,
    color: "#6b7280",
  },
  alertDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 16,
  },
});

export default AlertsScreen;
