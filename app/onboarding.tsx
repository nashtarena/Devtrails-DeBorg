import { router } from "expo-router";
import OnboardingFlow from "@/screens/OnboardingFlow";

export default function OnboardingRoute() {
  return (
    <OnboardingFlow
      onComplete={() => router.replace("/(tabs)/home")}
      onBack={() => router.back()}
    />
  );
}
