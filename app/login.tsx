import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Title,
  Card,
  IconButton,
  Avatar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { loginWithEmail } from "@/services/firebase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email.trim(), password);
      // Navigate to home / or tabs
      router.replace("/");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/react-logo.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <View style={styles.overlay} />

          <Card style={styles.card} elevation={4}>
            <Card.Content>
              <View style={styles.header}>
                <Avatar.Icon size={64} icon="account" />
                <Title style={styles.title}>Welcome back</Title>
              </View>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!visible}
                mode="outlined"
                right={
                  <TextInput.Icon
                    icon={visible ? "eye-off" : "eye"}
                    onPress={() => setVisible((v) => !v)}
                  />
                }
                style={styles.input}
              />

              {error ? <HelperText type="error">{error}</HelperText> : null}

              <Button
                mode="contained"
                onPress={onSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={{ paddingVertical: 6 }}
              >
                Sign in
              </Button>

              <Button
                mode="text"
                onPress={() => router.push("/register")}
                compact
                style={styles.link}
              >
                Create account
              </Button>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  safe: { flex: 1 },
  keyboard: { flex: 1, justifyContent: "center", padding: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    marginTop: 8,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  link: {
    marginTop: 6,
    alignSelf: "center",
  },
});
