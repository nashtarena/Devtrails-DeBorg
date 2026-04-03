import { router } from "expo-router";
import WelcomeScreen from "@/screens/WelcomeScreen";

export default function WelcomeRoute() {
  return (
    <WelcomeScreen
      onNewUser={() => router.push("/onboarding")}
      onExistingUser={() => router.push("/login")}
    />
  );
}
