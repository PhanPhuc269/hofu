import orderRepository from "@/services/repository/orderRepository";
import paymentRepository from "@/services/repository/paymentRepository";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChevronRight, Clock, CreditCard, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PaymentScreen = () => {
  // Delivery address state (can be updated after returning from Address Selection)
  const route = useRoute();
  const [deliveryAddress, setDeliveryAddress] = useState<any>({
    name: "Nguyễn Văn An",
    street: "123 Đường ABC",
    ward: "Phường XYZ",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    phone: "0987654321",
  });

  // Payment methods (we'll track selection with state)
  const paymentMethods = [
    { id: 1, name: "Tiền mặt", icon: "�" },
    { id: 2, name: "Thẻ tín dụng", icon: "💳" },
    { id: 3, name: "Ví điện tử", icon: "📱" },
    { id: 4, name: "ZaloPay", icon: "🟦" },
  ];

  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(1);
  const router = useRouter();

  useEffect(() => {
    const native = NativeModules.PayZaloBridge;
    let subscription: any = null;
    if (native) {
      try {
        const emitter = new NativeEventEmitter(native);
        // Adjust the event name below to whatever your native module emits.
        subscription = emitter.addListener("EventPayZalo", (event: any) => {
          console.log("ZaloPay event", event);
          if (!event) {
            Alert.alert("Thanh toán", "Không nhận được kết quả.");
            return;
          }
          if (event.returnCode === 1 || event.status === "SUCCESS") {
            Alert.alert("Thanh toán", "Giao dịch thành công!");
          } else if (event.returnCode === 4 || event.status === "CANCELED") {
            Alert.alert("Thanh toán", "Bạn đã hủy giao dịch.");
          } else if (
            event.errorCode === "PAYMENT_APP_NOT_FOUND" ||
            event.errorCode === "-1"
          ) {
            Alert.alert(
              "Thanh toán",
              "Chưa cài đặt ZaloPay/Zalo. Vui lòng tải về ứng dụng để tiếp tục."
            );
          } else {
            Alert.alert(
              "Thanh toán",
              "Giao dịch thất bại. Mã lỗi: " +
                (event.errorCode || event.returnCode)
            );
          }
        });
      } catch (err) {
        console.warn("Failed to create ZaloPay emitter", err);
      }
    } else {
      console.log("Native PayZaloBridge not available");
    }

    return () => {
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
    };
  }, []);

  // Mock data for order items
  const orderItems = [
    { id: 1, name: "Phở Bò", quantity: 2, price: 45000 },
    { id: 2, name: "Gỏi Cuốn", quantity: 1, price: 25000 },
    { id: 3, name: "Trà Đá", quantity: 3, price: 5000 },
  ];

  // Calculate totals
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 15000;
  const discount = 5000;
  const total = subtotal + deliveryFee - discount;

  const handlePayment = async () => {
    try {
      // 1) Create order on backend
      const payload = {
        items: orderItems.map((it) => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
        deliveryInfo: deliveryAddress,
        paymentMethodId: selectedPaymentId,
      };

      const createdOrder = await orderRepository.createOrder(payload as any);

      // 2) If payment method requires a provider token (e.g., ZaloPay), ask backend to create payment
      if (selectedPaymentId === 4) {
        const payResp = await paymentRepository.createPayment(
          createdOrder.id,
          "zalo",
          { amount: subtotal + deliveryFee - discount }
        );

        // Expecting backend to return { provider: 'zalo', token: '...' } or similar
        const token = payResp?.token || payResp?.payUrl || null;
        const native = NativeModules.PayZaloBridge;
        if (token && native && typeof native.payOrder === "function") {
          native.payOrder(token);
          // User will receive native event; we optionally navigate to tracking page now
          // navigate to order tracking so user can see order status
          router.push({
            pathname: "/order-tracking",
            params: { orderId: createdOrder.id },
          } as any);
          return;
        }

        Alert.alert(
          "Thanh toán",
          "Không nhận được token thanh toán từ máy chủ"
        );
        return;
      }

      // For non-instant payment methods (cash, card-on-delivery), consider order placed
      Alert.alert("Đặt hàng", "Đơn hàng đã được tạo");
      router.push({
        pathname: "/order-tracking",
        params: { orderId: createdOrder.id },
      } as any);
    } catch (e) {
      console.error("Place order / payment failed", e);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  // Listen for returned selected address via route params
  // Read saved selected address from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const raw = await AsyncStorage.getItem("@hofu:selectedAddress");
          if (raw) {
            const parsed = JSON.parse(raw);
            console.log("Loaded selected address from AsyncStorage", parsed);

            // Map incoming LocationIQ-style object to the flat shape used by the UI
            const addr = parsed || {};
            const orig = addr.originalData?.address || {};

            const mapped = {
              // short display name or fallback to full place_name
              name:
                addr.text ||
                addr.place_name ||
                orig?.residential ||
                orig?.dormitory ||
                "",
              // try to use road/street-ish fields
              street: orig?.road || orig?.pedestrian || addr.place_name || "",
              // administrative/sub-locality
              ward: orig?.suburb || orig?.neighbourhood || "",
              // district/county/state-district
              district:
                orig?.county ||
                orig?.state_district ||
                orig?.city_district ||
                "",
              city: orig?.city || orig?.town || orig?.village || "",
              // no phone in LocationIQ response — keep existing if present
              phone: addr.phone || orig?.phone || "",
              // keep coordinates and full place_name for debugging/usage
              latitude: addr.latitude,
              longitude: addr.longitude,
              place_name: addr.place_name,
            };

            if (mounted)
              setDeliveryAddress((prev: any) => ({ ...prev, ...mapped }));

            // remove the stored value to avoid reapplying on every focus
            await AsyncStorage.removeItem("@hofu:selectedAddress");
          }
        } catch (e) {
          console.warn("Failed to load selected address", e);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-4">
        <Text className="text-white text-2xl font-bold text-center">
          Thanh toán
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Delivery Address Section */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#34C759" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Địa chỉ giao hàng
            </Text>
          </View>

          <View className="border-l-2 border-green-500 pl-4 ml-1 py-1">
            <Text className="text-gray-800 font-medium">
              {deliveryAddress.name || deliveryAddress.place_name || "--"}
            </Text>
            {/* Compose address from parts; fallback to full place_name when parts missing */}
            <Text className="text-gray-600 mt-1">
              {(() => {
                const parts = [
                  deliveryAddress.street,
                  deliveryAddress.ward,
                  deliveryAddress.district,
                  deliveryAddress.city,
                ].filter(Boolean);
                return parts.length > 0
                  ? parts.join(", ")
                  : deliveryAddress.place_name || "--";
              })()}
            </Text>
            <Text className="text-gray-600 mt-1">
              SĐT: {deliveryAddress.phone || "(chưa có)"}
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center mt-3"
            onPress={() => router.push("/address-selection")}
          >
            <Text className="text-green-600 font-medium">Thay đổi địa chỉ</Text>
            <ChevronRight size={16} color="#34C759" />
          </TouchableOpacity>
        </View>

        {/* Payment Method Section */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <View className="flex-row items-center mb-3">
            <CreditCard size={20} color="#34C759" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Phương thức thanh toán
            </Text>
          </View>

          <View className="space-y-3">
            {paymentMethods.map((method) => {
              const selected = selectedPaymentId === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setSelectedPaymentId(method.id)}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    selected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <Text className="text-2xl mr-3">{method.icon}</Text>
                  <Text className="text-gray-800 text-lg flex-1">
                    {method.name}
                  </Text>
                  {selected && (
                    <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center">
                      <View className="w-2 h-2 rounded-full bg-white"></View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order Details Section */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Chi tiết đơn hàng
          </Text>

          <View className="space-y-3">
            {orderItems.map((item) => (
              <View
                key={item.id}
                className="flex-row justify-between items-center py-2"
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Text className="text-green-700 font-bold">
                      {item.quantity}
                    </Text>
                  </View>
                  <Text className="text-gray-800">{item.name}</Text>
                </View>
                <Text className="text-gray-800 font-medium">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-gray-200 mt-4 pt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Tạm tính</Text>
              <Text className="text-gray-800">
                {subtotal.toLocaleString("vi-VN")}₫
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Phí vận chuyển</Text>
              <Text className="text-gray-800">
                {deliveryFee.toLocaleString("vi-VN")}₫
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Giảm giá</Text>
              <Text className="text-green-600">
                -{discount.toLocaleString("vi-VN")}₫
              </Text>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-200">
              <Text className="text-lg font-bold text-gray-800">Tổng cộng</Text>
              <Text className="text-xl font-bold text-green-600">
                {total.toLocaleString("vi-VN")}₫
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Time */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <View className="flex-row items-center">
            <Clock size={20} color="#34C759" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Thời gian giao hàng
            </Text>
          </View>
          <Text className="text-gray-600 mt-2">
            Dự kiến giao hàng trong 30-45 phút
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Order Button */}
      <View className="bg-white p-4 border-t border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-600 text-lg">Tổng cộng:</Text>
          <Text className="text-gray-900 text-2xl font-bold">
            {total.toLocaleString("vi-VN")}đ
          </Text>
        </View>
        <TouchableOpacity
          onPress={handlePayment}
          className="bg-green-600 py-4 rounded-xl items-center"
        >
          <Text className="text-white text-lg font-bold">Đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentScreen;
