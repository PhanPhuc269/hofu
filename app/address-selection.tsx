import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { ArrowLeft, MapPin, Navigation, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal, // Import Modal component
  SafeAreaView,
  StyleSheet, // Import StyleSheet
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getExtra } from "@/utils/config";

const EXTRA = getExtra();

// --- CẤU HÌNH API ---

// 1. Key LocationIQ (để TÌM KIẾM ĐỊA CHỈ)
// Lấy từ: https://locationiq.com/
// !!! THAY KEY CỦA BẠN VÀO ĐÂY
const LOCATIONIQ_API_KEY = EXTRA.LOCATIONIQ_API_KEY || "default_key";

// 2. Key MapTiler (để HIỂN THỊ BẢN ĐỒ)
// Lấy từ: https://maptiler.com/
// !!! THAY KEY CỦA BẠN VÀO ĐÂY
const MAPTILER_API_KEY = EXTRA.MAPTILER_API_KEY || "default_key";
const MAPTILER_URL_TEMPLATE = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
// --- KẾT THÚC CẤU HÌNH ---

/**
 * Màn hình tìm kiếm địa chỉ, lấy vị trí hiện tại,
 * và xác nhận địa chỉ bằng bản đồ trong Modal.
 */
const AddressSearchScreen = () => {
  const navigation = useNavigation();

  // State cho tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State cho vị trí
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  // State cho Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null); // Địa chỉ được chọn, chờ xác nhận

  // Ref và state cho việc chọn vị trí chính xác trên bản đồ
  const mapRef = useRef<any>(null);
  const [markerCoordinate, setMarkerCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  // State cho module bản đồ (vì nó là native)
  const [mapsModule, setMapsModule] = useState<any>(null);
  const [mapsLoading, setMapsLoading] = useState(true);

  // Effect 1: Lấy vị trí người dùng 1 lần khi màn hình mở lên
  // Dùng để ưu tiên kết quả tìm kiếm (proximity)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Cấp quyền vị trí để tìm kiếm chính xác hơn");
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Độ chính xác vừa phải, lấy cho nhanh
        });
        setUserLocation(location.coords);
      } catch (e) {
        console.warn("Không thể lấy vị trí để ưu tiên tìm kiếm", e);
      }
    })();
  }, []);

  // Effect 2: Tải module react-native-maps
  // Làm điều này một cách an toàn để không bị crash trên Expo Go
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Thử require module
        const mod = require("react-native-maps");
        if (mounted) setMapsModule(mod);
      } catch (e) {
        // Thất bại (ví dụ: chạy trên Expo Go)
        console.warn(
          "Không thể tải react-native-maps, modal sẽ không có bản đồ",
          e
        );
      } finally {
        if (mounted) setMapsLoading(false);
      }
    })();
    return () => {
      mounted = false; // Cleanup
    };
  }, []);

  // Effect 3: Hook "Debouncing"
  // Sẽ gọi API 300ms sau khi người dùng ngừng gõ
  useEffect(() => {
    // Chỉ tìm khi có hơn 2 ký tự
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms

    // Hủy timeout nếu người dùng gõ tiếp
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userLocation]); // Chạy lại nếu query hoặc vị trí người dùng thay đổi

  // Khi selectedLocation thay đổi (ví dụ vừa chọn 1 gợi ý hoặc lấy vị trí hiện tại)
  // đặt marker mặc định tại tọa độ đó và cố gắng centre map nếu có ref
  useEffect(() => {
    if (selectedLocation) {
      const coord = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };
      setMarkerCoordinate(coord);
      try {
        if (mapRef.current && mapRef.current.animateToRegion) {
          mapRef.current.animateToRegion(
            {
              latitude: coord.latitude,
              longitude: coord.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.002,
            },
            300
          );
        }
      } catch (e) {
        // ignore if animateToRegion not available on this runtime
      }
    } else {
      setMarkerCoordinate(null);
    }
  }, [selectedLocation]);

  // Reverse geocode helper: cập nhật selectedLocation.place_name khi user chọn điểm mới
  const reverseGeocodeCoordinate = async (coord: {
    latitude: number;
    longitude: number;
  }): Promise<void> => {
    setIsReverseLoading(true);
    try {
      const url = `https://api.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${coord.latitude}&lon=${coord.longitude}&format=json&accept-language=vi`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.place_id) {
        setSelectedLocation((prev: any) => ({
          ...(prev || {}),
          id: data.place_id,
          place_name: data.display_name,
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          originalData: data,
        }));
      } else {
        // Nếu API không trả về, chỉ cập nhật tọa độ
        setSelectedLocation((prev: any) => ({
          ...(prev || {}),
          latitude: coord.latitude,
          longitude: coord.longitude,
        }));
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
      setSelectedLocation((prev: any) => ({
        ...(prev || {}),
        latitude: coord.latitude,
        longitude: coord.longitude,
      }));
    } finally {
      setIsReverseLoading(false);
    }
  };

  /**
   * GỌI API TÌM KIẾM (GEOCODING) CỦA LOCATIONIQ
   */
  const fetchSuggestions = async () => {
    setIsLoading(true);

    // Xây dựng URL cho LocationIQ
    let apiUrl = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
      searchQuery
    )}&limit=5&dedupe=1&countrycodes=VN&accept-language=vi`;

    // Thêm tham số "ưu tiên vị trí gần" (proximity) nếu có
    if (userLocation) {
      // API của LocationIQ yêu cầu (latitude, longitude)
      apiUrl += `&lat=${userLocation.latitude}&lon=${userLocation.longitude}`;
    }

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Chuẩn hóa dữ liệu trả về của LocationIQ cho FlatList
      const formattedSuggestions = data.map((item: any) => ({
        id: item.place_id,
        text: item.address.name || item.display_name.split(",")[0], // Tên địa điểm
        place_name: item.display_name, // Địa chỉ đầy đủ
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        originalData: item, // Giữ lại dữ liệu gốc nếu cần
      }));
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Lỗi tìm kiếm LocationIQ:", error);
      setErrorMsg("Không thể tìm kiếm. Vui lòng thử lại.");
    }
    setIsLoading(false);
  };

  /**
   * GỌI API VỊ TRÍ HIỆN TẠI (REVERSE GEOCODING) CỦA LOCATIONIQ
   */
  const handleCurrentLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSearchQuery("");
    setSuggestions([]);

    try {
      // 1. Xin quyền (lần nữa)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Bạn cần cấp quyền truy cập vị trí");
        setIsLoading(false);
        return;
      }

      // 2. Lấy vị trí (chính xác cao)
      let location = await Location.getCurrentPositionAsync({});

      if (!userLocation) setUserLocation(location.coords); // Lưu lại nếu chưa có

      const { latitude, longitude } = location.coords;

      // 3. Gọi API Reverse Geocoding của LocationIQ
      const url = `https://api.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.place_id) {
        // Chuẩn hóa dữ liệu
        const bestMatch = {
          id: data.place_id,
          text: data.address.name || data.display_name.split(",")[0],
          place_name: data.display_name,
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          originalData: data,
        };
        // Mở Modal để xác nhận
        onAddressSelect(bestMatch);
      }
    } catch (error) {
      console.error("Lỗi lấy vị trí:", error);
      setErrorMsg("Không thể lấy vị trí hiện tại.");
    }
    setIsLoading(false);
  };

  /**
   * Được gọi khi người dùng bấm vào 1 gợi ý hoặc "Vị trí hiện tại"
   * Sẽ mở Modal xác nhận.
   */
  const onAddressSelect = (addressFeature: any) => {
    console.log("Địa chỉ được chọn (chờ xác nhận):", addressFeature);
    setSelectedLocation(addressFeature); // Lưu dữ liệu cho modal
    setIsModalVisible(true); // Mở modal
    setSuggestions([]); // Xóa danh sách gợi ý
  };

  /**
   * Được gọi khi người dùng bấm nút "Chọn địa điểm" trong Modal
   */
  const handleConfirmLocation = () => {
    if (!selectedLocation) return;

    // Nếu user đã di chuyển marker, dùng tọa độ marker làm final
    const finalLocation = markerCoordinate
      ? {
          ...selectedLocation,
          latitude: markerCoordinate.latitude,
          longitude: markerCoordinate.longitude,
        }
      : selectedLocation;

    console.log("Đã xác nhận địa chỉ:", finalLocation);

    // Cập nhật ô tìm kiếm (tùy chọn)
    setSearchQuery(finalLocation.place_name || searchQuery);

    // Persist selected address to AsyncStorage so previous screen can read it on focus
    (async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        await AsyncStorage.setItem(
          "@hofu:selectedAddress",
          JSON.stringify(finalLocation)
        );
      } catch (e) {
        console.warn("Failed to persist selected address", e);
      }
    })();

    // Go back to previous screen (payment)
    navigation.goBack();

    // Đóng và reset modal
    setIsModalVisible(false);
    setSelectedLocation(null);
    setMarkerCoordinate(null);
  };

  /**
   * Hàm render nội dung cho Modal xác nhận
   */
  const renderModalContent = () => {
    // Nếu không có địa chỉ nào được chọn thì không render gì cả
    if (!selectedLocation) return null;

    // Lấy component từ module đã tải
    // (Phải kiểm tra null phòng trường hợp `require` thất bại)
    const MapView = mapsModule?.default ?? mapsModule?.MapView;
    const Marker = mapsModule?.Marker;
    const UrlTile = mapsModule?.UrlTile;

    // Vùng bản đồ để hiển thị (zoom gần vào địa điểm)
    const region = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.005, // Zoom gần
      longitudeDelta: 0.002, // Zoom gần
    };

    // *** MỚI: Tạo coordinate object riêng cho Marker ***
    const markerCoordinate = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    };

    // Handler khi người dùng nhấn giữ (long press) để chọn vị trí chính xác
    const handleMapLongPress = (event: any) => {
      const coord = event.nativeEvent.coordinate;
      setMarkerCoordinate(coord);
      // Cố gắng lấy địa chỉ bằng reverse geocoding để hiển thị cho user
      reverseGeocodeCoordinate(coord);
    };

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Xác nhận địa điểm</Text>

          {/* Khu vực bản đồ */}
          <View style={styles.mapContainer}>
            {mapsLoading && <ActivityIndicator />}
            {!mapsModule && !mapsLoading && (
              <Text>Không thể tải bản đồ (module thiếu)</Text>
            )}
            {/* Chỉ render bản đồ nếu module đã tải thành công */}
            {mapsModule && MapView && (
              <MapView
                style={styles.map}
                initialRegion={region}
                ref={(r: any) => (mapRef.current = r)}
                onLongPress={handleMapLongPress}
              >
                {UrlTile && (
                  <UrlTile urlTemplate={MAPTILER_URL_TEMPLATE} maximumZ={19} />
                )}
                {/* Hiển thị marker tại vị trí đã chọn (mặc định là selectedLocation) */}
                {Marker && markerCoordinate && (
                  <Marker coordinate={markerCoordinate} />
                )}
              </MapView>
            )}
          </View>

          {/* Tên địa chỉ */}
          <Text style={styles.modalAddressText}>
            {isReverseLoading
              ? "Đang xác định địa chỉ..."
              : selectedLocation.place_name}
          </Text>

          {/* Nút xác nhận */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>Chọn địa điểm</Text>
          </TouchableOpacity>

          {/* Nút hủy */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- GIAO DIỆN CHÍNH (JSX) ---
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          {/* Nút Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>

          {/* Ô tìm kiếm */}
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg p-3 ml-2">
            <MapPin size={20} color="#666" />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Tìm kiếm địa chỉ giao hàng..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nút Vị trí hiện tại */}
        <TouchableOpacity
          className="flex-row items-center p-4 mt-4 border-b border-gray-200"
          onPress={handleCurrentLocation}
        >
          <Navigation size={22} color="#34C759" />
          <Text className="ml-3 text-green-600 text-base font-medium">
            Sử dụng vị trí hiện tại
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vạch chia */}
      <View className="h-2 bg-gray-100" />

      {/* Loading Indicator */}
      {isLoading && !suggestions.length && (
        <ActivityIndicator size="large" color="#34C759" className="mt-6" />
      )}

      {/* Thông báo lỗi */}
      {errorMsg && (
        <Text className="text-center text-red-500 mt-4">{errorMsg}</Text>
      )}

      {/* Danh sách kết quả tìm kiếm */}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-start p-4 border-b border-gray-100"
            onPress={() => onAddressSelect(item)}
          >
            <MapPin size={24} color="#333" className="mt-1" />
            <View className="flex-1 ml-4">
              <Text className="text-base font-medium text-gray-900">
                {item.text}
              </Text>
              <Text className="text-sm text-gray-600">{item.place_name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal Xác Nhận */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)} // Cho phép đóng bằng nút back trên Android
      >
        {renderModalContent()}
      </Modal>
    </SafeAreaView>
  );
};

// --- StyleSheet cho Modal ---
// (Dùng StyleSheet thay vì NativeWind cho Modal để dễ quản lý hơn)
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end", // Đẩy modal xuống dưới
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Nền mờ
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  mapContainer: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E7EB", // Màu nền xám nhạt
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Cho bản đồ lấp đầy View
  },
  modalAddressText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#34C759", // Màu xanh lá
    borderRadius: 10,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#666",
    fontSize: 16,
  },
});

export default AddressSearchScreen;
