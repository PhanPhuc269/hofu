import { getExtra } from "@/utils/config";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Device from "expo-device";

const EXTRA = getExtra();

// Cấu hình hiển thị thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // 👈 NÊN SỬA: Bật âm thanh để dễ test hơn
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 1. SỬA LỖI: Dùng Device.isDevice thay vì Constants.isDevice
  if (!Device.isDevice) {
    console.warn("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Failed to get push token for push notification!");
    return null;
  }

  // 2. TỐI ƯU: Lấy Project ID an toàn hơn
  // Code này sẽ thử lấy từ EXTRA của bạn trước, nếu không có sẽ tự lấy từ Constants chuẩn của Expo
  const projectId = 
    EXTRA?.eas?.projectId ?? 
    Constants?.expoConfig?.extra?.eas?.projectId ?? 
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error("❌ Missing Project ID. Please run 'eas init' or check app.json");
    return null;
  }

  try {
    // 3. Gọi hàm lấy token với projectId đã check kỹ
    const token = await Notifications.getExpoPushTokenAsync({ 
      projectId: projectId 
    });
    
    // Setup Channel cho Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token.data;
  } catch (e) {
    console.error("❌ Error getting push token:", e);
    return null;
  }
}

// --- Các hàm Helper giữ nguyên ---
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds = 1
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true, // Nên thêm sound mặc định
    },
    trigger: { seconds },
  });
}

export function addNotificationReceivedListener(cb: (n: any) => void) {
  return Notifications.addNotificationReceivedListener(cb);
}

export function addNotificationResponseListener(cb: (r: any) => void) {
  // Lưu ý: Tên đúng của hàm này là addNotificationResponseReceivedListener
  return Notifications.addNotificationResponseReceivedListener(cb);
}

export async function cancelAllScheduledNotificationsAsync() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

export default {
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  cancelAllScheduledNotificationsAsync,
};