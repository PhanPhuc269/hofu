import { showToast } from "@/components/toast";
import api from "@/services/api";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerForPushNotificationsAsync,
} from "@/services/notifications";
import { useEffect, useState } from "react";
import { Platform, ToastAndroid } from "react-native";

// Hook registers for push notifications, returns the Expo push token (or null)
export default function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    let receivedSub: any = null;
    let responseSub: any = null;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      // Log token and send to backend for storage
      // eslint-disable-next-line no-console
      console.log("[notifications] expoPushToken", token);
      try {
        if (token) {
          // Send token to backend; adjust endpoint as your API expects
          await api.request("/push-tokens", {
            method: "POST",
            body: { token },
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[notifications] failed to send token to backend", e);
      }
      // TODO: send token to backend if you have an API: e.g. api.savePushToken(token)
    })();

    receivedSub = addNotificationReceivedListener((notification) => {
      // handle foreground notification: show a short toast (Android) or alert (iOS)
      try {
        const content =
          (notification &&
            (notification as any).request &&
            (notification as any).request.content) ||
          {};
        const title = content.title || "";
        const body = content.body || "";
        // eslint-disable-next-line no-console
        console.log("[notifications] received foreground", { title, body });
        // Use native short toast for Android; for iOS and Android foreground use app toast
        try {
          if (Platform.OS === "android") {
            // show native toast briefly as well for familiarity
            ToastAndroid.show(body || title || "Thông báo", ToastAndroid.LONG);
          }
        } catch (_e) {
          // ignore
        }
        // show cross-platform in-app toast
        // show cross-platform in-app toast with title + body
        // try {
        //   showToast({
        //     title: title || undefined,
        //     body: body || "Bạn có 1 thông báo",
        //   });
        // } catch (e) {
        //   // eslint-disable-next-line no-console
        //   console.warn("[notifications] showToast failed", e);
        // }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          "[notifications] error handling foreground notification",
          e
        );
      }
    });

    responseSub = addNotificationResponseListener((response) => {
      // handle user interaction with notification
      // console.log('Notification response', response);
    });

    return () => {
      if (receivedSub && receivedSub.remove) receivedSub.remove();
      if (responseSub && responseSub.remove) responseSub.remove();
    };
  }, []);

  return { expoPushToken };
}
