import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import ToastProvider from "@/components/toast";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useNotifications from "@/hooks/useNotifications";
import { auth } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // register notifications (token + listeners) as early as possible
  useNotifications();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("[auth] onAuthStateChanged user=", u);
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, []);

  // Fallback: if auth doesn't report back within a short time, stop initializing
  useEffect(() => {
    const t = setTimeout(() => {
      if (initializing) {
        console.warn("[auth] auth init timeout, proceeding to app");
        setInitializing(false);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [initializing]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {initializing ? (
        <ActivityIndicator animating={true} size="large" style={{ flex: 1 }} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <Stack.Screen name="login" />
          )}
          <Stack.Screen name="restaurant" />
          <Stack.Screen name="address-selection" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
              headerShown: true,
            }}
          />
          <Stack.Screen name="cart" />
        </Stack>
      )}
      <StatusBar style="auto" />
      <ToastProvider />
    </ThemeProvider>
  );
}
