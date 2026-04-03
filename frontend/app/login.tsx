import { router } from "expo-router";
import LoginFlow from "@/screens/LoginFlow";

export default function LoginRoute() {
  return (
    <LoginFlow
      onComplete={() => router.replace("/(tabs)/home")}
      onBack={() => router.back()}
    />
  );
}
