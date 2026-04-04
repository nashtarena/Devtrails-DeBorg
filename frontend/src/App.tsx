import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
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
  const { logout } = useAuth();

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
        return <DashboardScreen />;
      case "activity":
        return <ClaimsScreen />;
      case "alerts":
        return <AlertsScreen />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} />;
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
          onNavigate={(tab) => setScreen(tab as Screen)}
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
