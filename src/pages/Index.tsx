import { useState } from "react";
import { View } from "react-native";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/screens/WelcomeScreen";
import OnboardingFlow from "@/screens/OnboardingFlow";
import LoginFlow from "@/screens/LoginFlow";
import DashboardScreen from "@/screens/DashboardScreen";
import ClaimsScreen from "@/screens/ClaimsScreen";
import AlertsScreen from "@/screens/AlertsScreen";
import ProfileScreen from "@/screens/ProfileScreen";

type AppState = "welcome" | "onboarding" | "login" | "app";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("welcome");
  const [activeTab, setActiveTab] = useState("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home": return <DashboardScreen />;
      case "activity": return <ClaimsScreen />;
      case "alerts": return <AlertsScreen />;
      case "profile": return <ProfileScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <View className="flex-1">
      {appState === "welcome" && (
        <WelcomeScreen
          onNewUser={() => setAppState("onboarding")}
          onExistingUser={() => setAppState("login")}
        />
      )}
      {appState === "onboarding" && (
        <OnboardingFlow
          onComplete={() => setAppState("app")}
          onBack={() => setAppState("welcome")}
        />
      )}
      {appState === "login" && (
        <LoginFlow
          onComplete={() => setAppState("app")}
          onBack={() => setAppState("welcome")}
        />
      )}
      {appState === "app" && (
        <View className="relative flex-1">
          {renderScreen()}
          <BottomNav active={activeTab} onNavigate={setActiveTab} />
        </View>
      )}
    </View>
  );
};

export default Index;
