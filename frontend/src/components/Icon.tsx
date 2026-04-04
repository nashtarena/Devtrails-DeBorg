import React from "react";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface IconProps {
  name: string;
  size: number;
  color: string;
}

/** Emoji fallback for web preview */
const webEmojiMap: Record<string, string> = {
  home: "🏠",
  timeline: "📊",
  notifications: "🔔",
  person: "👤",
  security: "🔒",
  "chevron-right": "→",
  check: "✓",
  "cloud-queue": "☁️",
  thermostat: "🌡️",
  air: "💨",
  "directions-car": "🚗",
  warning: "⚠️",
  close: "✕",
  menu: "☰",
  "arrow-back": "←",
  edit: "✎",
  delete: "🗑️",
  add: "+",
  "location-on": "📍",
  smartphone: "📱",
  work: "💼",
  "verified-user": "✓",
  "account-balance-wallet": "💳",
  "credit-card": "💳",
  "check-circle": "✓",
  "water-drop": "💧",
  grain: "🌾",
  "wb-sunny": "☀️",
  "trending-up": "📈",
  description: "📄",
  analytics: "📊",
  map: "🗺️",
  cloud: "☁️",
  phone: "📞",
  help: "❓",
  logout: "🚪",
  schedule: "⏰",
  error: "⚠️",
  "error-outline": "⚠️",
  "flash-on": "⚡",
  "info": "ℹ️",
};

/**
 * Maps app icon aliases to valid @expo/vector-icons MaterialIcons names.
 * See: https://icons.expo.fyi/Index/MaterialIcons
 */
const materialNameMap: Record<string, string> = {
  security: "security",
  timeline: "timeline",
  notifications: "notifications",
  person: "person",
  "chevron-right": "chevron-right",
  check: "check",
  "cloud-queue": "cloud-queue",
  thermostat: "thermostat",
  air: "air",
  "directions-car": "directions-car",
  warning: "warning",
  close: "close",
  menu: "menu",
  "arrow-back": "arrow-back",
  edit: "edit",
  delete: "delete",
  add: "add",
  "location-on": "location-on",
  smartphone: "smartphone",
  work: "work",
  "verified-user": "verified-user",
  "account-balance-wallet": "account-balance-wallet",
  "credit-card": "credit-card",
  "check-circle": "check-circle",
  "water-drop": "water-drop",
  grain: "grain",
  "wb-sunny": "wb-sunny",
  "trending-up": "trending-up",
  description: "description",
  analytics: "analytics",
  map: "map",
  cloud: "cloud",
  phone: "phone",
  help: "help-outline",
  logout: "logout",
  schedule: "schedule",
  error: "error",
  "error-outline": "error-outline",
  "flash-on": "flash-on",
  "info": "info",
};

const MaterialIconWeb: React.FC<IconProps> = ({ name, size, color }) => {
  const emoji = webEmojiMap[name] || "•";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size * 0.8,
        color,
        lineHeight: 1,
      }}
    >
      {emoji}
    </span>
  );
};

export const Icon: React.FC<IconProps> = ({ name, size, color }) => {
  if (Platform.OS === "web") {
    return <MaterialIconWeb name={name} size={size} color={color} />;
  }

  const glyph = materialNameMap[name] ?? name;
  return <MaterialIcons name={glyph as any} size={size} color={color} />;
};

export default Icon;
