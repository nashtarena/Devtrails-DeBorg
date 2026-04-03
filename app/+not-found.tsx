import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen does not exist.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2563eb",
    borderRadius: 12,
  },
  linkText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
