import React, { useState } from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingFlow from "./screens/OnboardingFlow";
import LoginFlow from "./screens/LoginFlow";
import DashboardScreen from "./screens/DashboardScreen";
import ClaimsScreen from "./screens/ClaimsScreen";
import AlertsScreen from "./screens/AlertsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import BottomNav from "./components/BottomNav";

type Screen = "welcome" | "onboarding" | "login" | "home" | "activity" | "alerts" | "profile";

const App = () => {
  const [screen, setScreen] = useState<Screen>("welcome");

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
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  const showBottomNav = ["home", "activity", "alerts", "profile"].includes(screen);

  return (
    <View style={styles.container} suppressHydrationWarning>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webContainer: {
    minHeight: "100%",
  },
});

export default App;
