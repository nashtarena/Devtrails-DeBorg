import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { Icon } from "../components/Icon";
import { shadowSm } from "../constants/shadows";
import { api } from "../lib/api";

const severityStyles: Record<string, { bgColor: string; textColor: string }> = {
  high: { bgColor: "#fef2f2", textColor: "#ef4444" },
  medium: { bgColor: "#fff7ed", textColor: "#f97316" },
  low: { bgColor: "#fefce8", textColor: "#eab308" },
  info: { bgColor: "#dbeafe", textColor: "#2563eb" },
};

const severityIcon: Record<string, string> = {
  high: "warning",
  medium: "thermostat",
  low: "directions-car",
  info: "info",
};

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.alerts.list()
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.alerts.markRead(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Real-time disruption feed</Text>
        </View>

        {error ? (
          <Text style={{ color: "#ef4444", textAlign: "center" }}>{error}</Text>
        ) : alerts.length === 0 ? (
          <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>No alerts for your zone</Text>
        ) : (
          <View style={styles.alertsList}>
            {alerts.map((alert: any) => {
              const severity = alert.severity ?? "info";
              const style = severityStyles[severity] ?? severityStyles.info;
              const icon = severityIcon[severity] ?? "info";
              const timeAgo = alert.created_at
                ? new Date(alert.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertCard, alert.is_read && { opacity: 0.6 }]}
                  onPress={() => !alert.is_read && handleMarkRead(alert.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.alertIcon, { backgroundColor: style.bgColor }]}>
                    <Icon name={icon} size={18} color={style.textColor} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
                      <Text style={styles.alertTime}>{timeAgo}</Text>
                    </View>
                    <Text style={styles.alertDesc}>{alert.message ?? alert.description ?? ""}</Text>
                    {!alert.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                </TouchableOpacity>
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
  alertsList: { gap: 12 },
  alertCard: { backgroundColor: "#ffffff", borderRadius: 12, flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 16, paddingHorizontal: 4, ...shadowSm },
  alertIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  alertTime: { fontSize: 10, color: "#6b7280" },
  alertDesc: { fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb", marginTop: 6 },
});

export default AlertsScreen;
