import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Icon } from "./Icon";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "home",     icon: "home",          label: "Home" },
  { id: "activity", icon: "timeline",      label: "Activity" },
  { id: "alerts",   icon: "notifications", label: "Alerts" },
  { id: "profile",  icon: "person",        label: "Profile" },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  return (
    <View style={[styles.container, { paddingTop: 12 }]}>
      <View style={styles.navRow}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onNavigate(tab.id)}
              style={styles.tabButton}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Icon name={tab.icon} size={20} color={isActive ? "#2563eb" : "#6b7280"} />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 100,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 16,
    paddingTop: 4,
    borderRadius: 12,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 10,
  },
  activeIconWrapper: {
    backgroundColor: "#dbeafe",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabLabel: {
    fontWeight: "600",
    color: "#2563eb",
  },
});

export default BottomNav;
