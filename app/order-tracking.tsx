import { ArrowLeft } from "lucide-react-native"; // Giả sử bạn đã cài lucide
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { RootStackParamList } from "@/navigation/types";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import { getExtra } from "@/utils/config";

const EXTRA = getExtra();
// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: EXTRA.API_KEY,
  authDomain: EXTRA.AUTH_DOMAIN,
  databaseURL:
    EXTRA.DATABASE_URL,
  projectId: EXTRA.PROJECT_ID,
  storageBucket: EXTRA.STORAGE_BUCKET,
  messagingSenderId: EXTRA.MESSAGING_SENDER_ID,
  appId: EXTRA.APP_ID,
  measurementId: EXTRA.MEASUREMENT_ID,
};
// 2. Key LocationIQ (để VẼ LỘ TRÌNH)
const LOCATIONIQ_API_KEY = EXTRA.LOCATIONIQ_API_KEY || "default_key";

// 3. ID Ứng dụng (Nếu bạn dùng chung logic với file HTML)
const appId = EXTRA.APP_ID;

// Khởi tạo Firebase
let firebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}
const db = getDatabase(firebaseApp);
// --- KẾT THÚC CẤU HÌNH ---

/**
 * Màn hình Theo dõi Đơn hàng
 */
const OrderTrackingScreen = ({ navigation }: any) => {
  // Giả sử 'orderId' và 'customerLocation' được truyền qua navigation
  const route = useRoute<RouteProp<RootStackParamList, "order-tracking">>();

  // --- (MOCK) DỮ LIỆU ĐỂ TEST ---
  // (Trong app thật, route.params sẽ cung cấp giá trị)
  const MOCK_ORDER_ID = "order_123456";
  const MOCK_CUSTOMER_LOCATION = {
    latitude: 10.9807, // Dĩ An, Bình Dương
    longitude: 106.742,
  };

  const orderId = route?.params?.orderId ?? MOCK_ORDER_ID;
  const customerLocation =
    route?.params?.customerLocation ?? MOCK_CUSTOMER_LOCATION;
  // --- HẾT MOCK ---

  const mapRef = useRef<any>(null);
  const [shipperLocation, setShipperLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [etaInfo, setEtaInfo] = useState({ duration: 0, distance: 0 });
  const [statusText, setStatusText] = useState("Đang tìm tài xế...");
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const router = useRouter();
  // Effect 1: Lắng nghe vị trí shipper từ Firebase Realtime Database
  useEffect(() => {
    // Đường dẫn tới dữ liệu vị trí của đơn hàng này
    const dbPath = `/tracking/shipper`;
    // const dbPath = `/order_tracking/${appId}/${orderId}/shipperLocation`;
    const locationRef = ref(db, dbPath);

    console.log(`Đang lắng nghe tại: ${dbPath}`);

    // Bắt đầu lắng nghe
    // `onValue` trả về 1 hàm unsubscribe (modular SDK). Trong DB bạn có thể lưu
    // cả { latitude, longitude } hoặc { lat, lng } — chuẩn hoá cả hai.
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const locationData = snapshot.val();

      if (locationData) {
        // Hỗ trợ cả hai cấu trúc: { latitude, longitude } hoặc { lat, lng }
        const lat =
          locationData.latitude !== undefined
            ? locationData.latitude
            : locationData.lat !== undefined
              ? locationData.lat
              : null;
        const lon =
          locationData.longitude !== undefined
            ? locationData.longitude
            : locationData.lng !== undefined
              ? locationData.lng
              : null;

        if (lat !== null && lon !== null) {
          setShipperLocation({ latitude: lat, longitude: lon });
          setStatusText("Tài xế đang đến!");
          return;
        }
      }

      // Nếu không có dữ liệu hoặc không đủ trường, reset
      setStatusText("Đang tìm tài xế...");
      setShipperLocation(null);
    });

    // Cleanup: onValue trả về unsubscribe(). Gọi nó khi unmount.
    return () => {
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (e) {
        console.warn("Không thể hủy lắng nghe Firebase:", e);
      }
      console.log("Đã ngừng lắng nghe Firebase");
    };
  }, [orderId, appId]); // Chạy lại nếu orderId thay đổi

  // Effect 2: Cập nhật lộ trình khi vị trí shipper thay đổi
  useEffect(() => {
    if (shipperLocation && customerLocation && mapRef.current) {
      updateRouteAndFitMap();
    }
  }, [shipperLocation]); // Chạy lại khi shipperLocation thay đổi

  /**
   * Gọi API MapTiler Routing, cập nhật state và zoom bản đồ
   */
  const updateRouteAndFitMap = async () => {
    setIsLoadingRoute(true);
    try {
      // 1. Lấy lộ trình
      const { coordinates, duration, distance } = await fetchRoute(
        shipperLocation,
        customerLocation
      );

      setRouteCoordinates(coordinates);
      setEtaInfo({ duration, distance });

      // 2. Zoom bản đồ
      // (Delay một chút để đảm bảo map đã render Polyline)
      setTimeout(() => {
        if (
          mapRef.current &&
          typeof mapRef.current.fitToCoordinates === "function"
        ) {
          mapRef.current.fitToCoordinates([shipperLocation, customerLocation], {
            edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
            animated: true,
          });
        }
      }, 500);
    } catch (error) {
      console.error("Lỗi cập nhật lộ trình:", error);
      setEtaInfo({ duration: 0, distance: 0 }); // Reset
    } finally {
      setIsLoadingRoute(false);
    }
  };

  /**
   * Gọi API LocationIQ Routing
   */
  const fetchRoute = async (shipperLoc: any, customerLoc: any) => {
    const coords = `${shipperLoc.longitude},${shipperLoc.latitude};${customerLoc.longitude},${customerLoc.latitude}`;

    // LocationIQ Directions API
    const locationiqUrl = `https://us1.locationiq.com/v1/directions/driving/${coords}?key=${LOCATIONIQ_API_KEY}&overview=full&steps=true&geometries=polyline`;

    // Try LocationIQ first
    console.log("[Routing] Trying LocationIQ:", locationiqUrl);
    let data: any = null;
    try {
      const response = await fetch(locationiqUrl).catch((e) => {
        console.error("[LocationIQ] Network error when calling routing API", e);
        throw e;
      });

      if (response.ok) {
        data = await response.json();
        if (!data || !data.routes || data.routes.length === 0) {
          console.warn("[LocationIQ] response OK but no routes", data);
          data = null; // trigger fallback
        } else {
          console.log("[LocationIQ] routing succeeded");
        }
      } else {
        // Non-OK — log body and fall through to fallback
        let bodyText = "no body";
        try {
          bodyText = await response.text();
        } catch (e) {
          bodyText = `unable to read body: ${e}`;
        }
        console.error(
          `[LocationIQ] Routing API returned status ${response.status}: ${bodyText}`
        );
        data = null;
      }
    } catch (e) {
      console.warn("[LocationIQ] failed, will try fallback provider", e);
      data = null;
    }

    // If MapTiler failed or returned no route, try OSRM public endpoint as a fallback
    if (!data) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      console.log("[Routing] Falling back to OSRM:", osrmUrl);
      try {
        const res2 = await fetch(osrmUrl);
        if (!res2.ok) {
          let txt = "no body";
          try {
            txt = await res2.text();
          } catch (e) {
            txt = `unable to read body: ${e}`;
          }
          console.error(`[OSRM] returned status ${res2.status}: ${txt}`);
          throw new Error("Không thể lấy tuyến đường từ OSRM");
        }
        data = await res2.json();
        if (!data || !data.routes || data.routes.length === 0) {
          console.error("[OSRM] no routes in response", data);
          throw new Error("Không tìm thấy đường đi (OSRM)");
        }
        console.log("[OSRM] routing succeeded");
      } catch (e) {
        console.error("[Routing] Both LocationIQ and OSRM failed", e);
        throw new Error("Lỗi API Định tuyến LocationIQ và OSRM");
      }
    }

    const route = data.routes[0];

    // QUAN TRỌNG: Chuyển đổi geometry sang {latitude, longitude} (react-native-maps)
    if (!route.geometry) {
      console.error("[Routing] Unexpected route geometry", route);
      throw new Error("Dữ liệu tuyến đường không hợp lệ");
    }

    let coordinates;

    // LocationIQ trả về polyline encoded string, OSRM trả về GeoJSON coordinates
    if (typeof route.geometry === "string") {
      // Decode polyline từ LocationIQ
      coordinates = decodePolyline(route.geometry);
    } else if (route.geometry.coordinates) {
      // GeoJSON từ OSRM
      coordinates = route.geometry.coordinates.map((coord: any) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    } else {
      throw new Error("Dữ liệu tuyến đường không hợp lệ");
    }

    return {
      coordinates,
      duration: route.duration, // Giây
      distance: route.distance, // Mét
    };
  };

  // Hàm decode polyline (Google Encoded Polyline Algorithm)
  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Format ETA text
  const getEtaText = () => {
    if (!shipperLocation) return "Vui lòng chờ trong giây lát.";
    if (isLoadingRoute) return "Đang tính toán lại lộ trình...";
    if (etaInfo.duration === 0) return "Không thể tính toán đường đi.";

    const etaMinutes = Math.ceil(etaInfo.duration / 60);
    const distanceKm = (etaInfo.distance / 1000).toFixed(1);
    return `Khoảng ${etaMinutes} phút (${distanceKm} km)`;
  };

  // Vị trí ban đầu của bản đồ
  const initialRegion = {
    ...customerLocation,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>

      {/* Bản đồ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE} // Dùng Google Maps (khuyến nghị) hoặc xóa dòng này
        initialRegion={initialRegion}
      >
        {/* 1. Marker Khách hàng (Bạn) */}
        <Marker coordinate={customerLocation} title="Vị trí của bạn" />

        {/* 2. Marker Shipper */}
        {shipperLocation && (
          <Marker
            coordinate={shipperLocation}
            title="Tài xế"
            pinColor="blue" // Hoặc dùng <Image> để custom
          >
            {/* Custom Marker View (Giống Grab) */}
            <View style={styles.shipperMarkerContainer}>
              <View style={styles.shipperMarker} />
            </View>
          </Marker>
        )}

        {/* 3. Lộ trình */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6" // Màu xanh dương
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Bảng thông tin */}
      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          {isLoadingRoute || !shipperLocation ? (
            <ActivityIndicator
              size="small"
              color="#000"
              style={styles.spinner}
            />
          ) : (
            <View style={styles.fakeSpinner} /> // Placeholder để giữ layout
          )}
          <View style={styles.infoTextContainer}>
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.etaText}>{getEtaText()}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Lấy kích thước màn hình
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: "absolute",
    top: 60, // Điều chỉnh cho SafeArea
    left: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPanel: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: 15,
  },
  fakeSpinner: {
    width: 20, // Bằng kích thước ActivityIndicator (small)
    height: 20,
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  etaText: {
    fontSize: 15,
    color: "#555",
    marginTop: 2,
  },
  // Custom marker cho Shipper
  shipperMarkerContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  shipperMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default OrderTrackingScreen;
