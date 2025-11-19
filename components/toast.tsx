import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ToastOptions = {
  title?: string;
  body: string;
  duration?: number;
  // optional callback when toast is pressed
  onPress?: () => void;
};

let _showToast: (opts: ToastOptions) => void = () => {};

export function showToast(opts: ToastOptions) {
  _showToast(opts);
}

export default function ToastProvider() {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    _showToast = (opts: ToastOptions) => {
      // clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as any);
        timeoutRef.current = null;
      }
      setToast(opts);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        const dur = typeof opts.duration === "number" ? opts.duration : 4000;
        timeoutRef.current = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setToast(null));
        }, dur) as unknown as number;
      });
    };

    return () => {
      _showToast = () => {};
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
      timeoutRef.current = null;
    };
  }, [opacity]);

  if (!toast) return null;

  const { title, body, onPress } = toast;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { opacity }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          try {
            onPress && onPress();
          } catch (e) {
            // ignore
          }
          // dismiss immediately
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => setToast(null));
        }}
        style={styles.toastWrapper}
      >
        <View style={styles.toast}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text numberOfLines={4} style={styles.body}>
            {body}
          </Text>
          {Platform.OS === "ios" ? (
            <Text style={styles.swipeHint}>Tap to open</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 50,
    alignItems: "center",
    zIndex: 1000,
  },
  toastWrapper: {
    width: "100%",
  },
  toast: {
    backgroundColor: "rgba(20,20,20,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  body: {
    color: "white",
    fontSize: 13,
    lineHeight: 18,
  },
  swipeHint: {
    marginTop: 6,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
  },
});
