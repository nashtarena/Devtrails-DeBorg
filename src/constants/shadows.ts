import { Platform, ViewStyle } from "react-native";

/** Light card shadow — Android uses elevation; iOS uses shadow* */
export const shadowSm: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  android: { elevation: 2 },
  default: { elevation: 2 },
}) as ViewStyle;

/** Medium depth — cards / modals */
export const shadowMd: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  android: { elevation: 4 },
  default: { elevation: 4 },
}) as ViewStyle;
