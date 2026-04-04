import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingFlow from "./screens/OnboardingFlow";
import LoginFlow from "./screens/LoginFlow";
import DashboardScreen from "./screens/DashboardScreen";
import ClaimsScreen from "./screens/ClaimsScreen";
import AlertsScreen from "./screens/AlertsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import BottomNav from "./components/BottomNav";

type Screen = "welcome" | "onboarding" | "login" | "home" | "activity" | "alerts" | "profile";

const AppInner = () => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activityKey, setActivityKey] = useState(0);
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  // Nav bar height = safe area top + icon row (~60px)
  const NAV_HEIGHT = Math.max(insets.top, 12) + 60;

  const handleNavigate = (tab: string) => {
    // Refresh activity screen every time it's opened
    if (tab === "activity") setActivityKey(k => k + 1);
    setScreen(tab as Screen);
  };

  const handleLogout = () => {
    logout();
    setScreen("welcome");
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return (
          <WelcomeScreen
            onNewUser={() => setScreen("onboarding")}
            onExistingUser={() => setScreen("login")}
          />
        );
      case "onboarding":
        return (
          <OnboardingFlow
            onComplete={() => setScreen("home")}
            onBack={() => setScreen("welcome")}
          />
        );
      case "login":
        return (
          <LoginFlow
            onComplete={() => setScreen("home")}
            onBack={() => setScreen("welcome")}
          />
        );
      case "home":
        return <DashboardScreen topPadding={NAV_HEIGHT} />;
      case "activity":
        return <ClaimsScreen key={activityKey} topPadding={NAV_HEIGHT} />;
      case "alerts":
        return <AlertsScreen topPadding={NAV_HEIGHT} />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} topPadding={NAV_HEIGHT} />;
      default:
        return null;
    }
  };

  const showBottomNav = ["home", "activity", "alerts", "profile"].includes(screen);

  return (
    <View style={styles.container}>
      {renderScreen()}
      {showBottomNav && (
        <BottomNav
          active={screen}
          onNavigate={handleNavigate}
        />
      )}
    </View>
  );
};

const App = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
});

export default App;
