import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import ClaimsScreen from "@/screens/ClaimsScreen";

export default function ActivityTab() {
  const [key, setKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setKey(k => k + 1);
    }, [])
  );

  return <ClaimsScreen key={key} />;
}
