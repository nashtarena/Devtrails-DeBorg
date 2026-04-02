import React from "react";
import { Platform } from "react-native";

// For web, we'll use simple HTML elements styled as icons
// For native, we use MaterialIcons

interface IconProps {
  name: string;
  size: number;
  color: string;
}

const iconMap: Record<string, string> = {
  "home": "🏠",
  "timeline": "📊",
  "notifications": "🔔",
  "person": "👤",
  "security": "🔒",
  "chevron-right": "→",
  "check": "✓",
  "cloud-queue": "☁️",
  "thermostat": "🌡️",
  "air": "💨",
  "directions-car": "🚗",
  "warning": "⚠️",
  "close": "✕",
  "menu": "☰",
  "arrow-back": "←",
  "edit": "✎",
  "delete": "🗑️",
  "add": "+",
  "location-on": "📍",
};

const MaterialIconWeb: React.FC<IconProps> = ({ name, size, color }) => {
  const emoji = iconMap[name] || "•";
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size * 0.8,
        color: color,
        lineHeight: 1,
      }}
    >
      {emoji}
    </span>
  );
};

// Main Icon component that works on both web and native
export const Icon: React.FC<IconProps> = ({ name, size, color }) => {
  // On web, use our simple emoji-based icons
  // On native, it will use the @expo/vector-icons/MaterialIcons
  if (Platform.OS === "web") {
    return <MaterialIconWeb name={name} size={size} color={color} />;
  }

  // This shouldn't be reached on web, but fallback just in case
  return <MaterialIconWeb name={name} size={size} color={color} />;
};

export default Icon;
