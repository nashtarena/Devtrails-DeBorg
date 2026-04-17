import React from "react";
import { Platform } from "react-native";

interface IconProps {
  name: string;
  size: number;
  color: string;
}

/**
 * Maps icon names to Material Icons ligature names.
 * On web: renders via Material Icons font (loaded in index.html).
 * On native: uses @expo/vector-icons/MaterialIcons.
 */
const materialNameMap: Record<string, string> = {
  // Navigation
  home: "home",
  "arrow-back": "arrow_back",
  "chevron-right": "chevron_right",
  menu: "menu",
  close: "close",
  // Auth / people
  person: "person",
  smartphone: "smartphone",
  "verified-user": "verified_user",
  badge: "badge",
  lock: "lock",
  login: "login",
  logout: "logout",
  visibility: "visibility",
  "visibility-off": "visibility_off",
  "admin-panel-settings": "admin_panel_settings",
  // Work / finance
  work: "work",
  "account-balance-wallet": "account_balance_wallet",
  "credit-card": "credit_card",
  "trending-up": "trending_up",
  analytics: "analytics",
  assignment: "assignment",
  description: "description",
  // Location / weather
  "location-on": "location_on",
  map: "map",
  cloud: "cloud",
  "cloud-queue": "cloud_queue",
  thermostat: "thermostat",
  air: "air",
  "water-drop": "water_drop",
  "wb-sunny": "wb_sunny",
  grain: "grain",
  "directions-car": "directions_car",
  // Status / alerts
  warning: "warning",
  error: "error",
  "error-outline": "error_outline",
  "report-problem": "report_problem",
  "check-circle": "check_circle",
  check: "check",
  "flash-on": "flash_on",
  info: "info",
  notifications: "notifications",
  schedule: "schedule",
  // Plans / misc
  security: "security",
  shield: "shield",
  verified: "verified",
  umbrella: "umbrella",
  lightbulb: "lightbulb",
  phone: "phone",
  help: "help_outline",
  edit: "edit",
  delete: "delete",
  add: "add",
  timeline: "timeline",
};

const MaterialIconWeb: React.FC<IconProps> = ({ name, size, color }) => {
  const ligature = materialNameMap[name] ?? name;
  return (
    <span
      className="material-icons"
      style={{
        fontSize: size,
        color,
        lineHeight: 1,
        userSelect: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      {ligature}
    </span>
  );
};

export const Icon: React.FC<IconProps> = ({ name, size, color }) => {
  if (Platform.OS === "web") {
    return <MaterialIconWeb name={name} size={size} color={color} />;
  }
  const MaterialIcons = require("@expo/vector-icons/MaterialIcons").default;
  const glyph = materialNameMap[name] ?? name;
  return <MaterialIcons name={glyph as any} size={size} color={color} />;
};

export default Icon;
