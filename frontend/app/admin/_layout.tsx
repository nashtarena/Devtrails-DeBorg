import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";

export default function AdminLayout() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated - use try/catch for web storage
    try {
      const token = typeof localStorage !== 'undefined' 
        ? localStorage.getItem("adminToken") 
        : null;
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('Storage access error:', e);
    }
    setCheckingAuth(false);
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // For demo: simple credential check
      // In production, this should verify against your admin authentication system
      if (email === "admin@secinsure.com" && password === "admin123") {
        const token = "admin_token_" + Date.now();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem("adminToken", token);
          sessionStorage.setItem("adminToken", token);
        }
        setIsAuthenticated(true);
        Alert.alert("Success", "Admin access granted");
      } else {
        Alert.alert("Error", "Invalid admin credentials");
      }
    } catch (err) {
      Alert.alert("Error", "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminToken");
      }
    } catch (e) {
      console.warn('Storage clearing error:', e);
    }
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    router.replace("/");
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <Text style={styles.title}>🔐 Admin Dashboard</Text>
          <Text style={styles.subtitle}>Secure Admin Access</Text>

          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Admin Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleAdminLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Admin Login</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>Demo credentials: admin@secinsure.com / admin123</Text>

          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.backLink}>← Back to App</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#f8fafc" },
        headerTitleStyle: { color: "#1f2937", fontWeight: "600" },
        headerRight: () => (
          <Pressable onPress={handleLogout} style={{ marginRight: 16 }}>
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>Logout</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Admin Dashboard" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loginBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  backLink: {
    color: "#2563eb",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
