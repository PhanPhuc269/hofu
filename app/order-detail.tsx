import { ThemedText } from "@/components/themed-text";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

const { width } = Dimensions.get("window");

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const router1 = useRouter();
  const route = useRoute<RouteProp<any, any>>();

  const [orderData, setOrderData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchOrder = async () => {
      try {
        const orderId = route?.params?.orderId;
        if (!orderId) return;
        const repo = await import("@/services/repository/orderRepository");
        const order = await repo.orderRepository.fetchOrder(orderId);
        console.log("order", order);
        if (mounted) {
          setOrderData(order);
          setLoading(false);
        }
      } catch (e) {
        console.warn("Failed to load order", e);
        if (mounted) {
          setError("Failed to load order details. Please try again later.");
          setLoading(false);
        }
      }
    };
    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [route?.params?.orderId]);

  // Attempt to initialize expo-router's router if available (fallback)
  let router: any = null;
  try {
    // require at runtime so projects without expo-router don't fail static import
    const mod = require("expo-router");
    if (mod && mod.useRouter) router = mod.useRouter();
  } catch (e) {
    router = null;
  }

  // If orderData not loaded, show placeholder
  const displayData = orderData ?? {
    id: "--",
    date: "--",
    status: "Đang tải",
    statusColor: "#999",
    restaurant: { name: "--", image: undefined },
    items: [],
    deliveryInfo: { address: "--", recipient: "--", phone: "--", note: "" },
    driver: null,
    pricing: { subtotal: 0, deliveryFee: 0, discount: 0, total: 0 },
    estimatedTime: "--",
  };

  // Order tracking steps
  const trackingSteps = [
    {
      id: 1,
      title: "Đã xác nhận",
      description: "Đơn hàng đã được nhà hàng xác nhận",
      completed: true,
      icon: CheckCircle,
    },
    {
      id: 2,
      title: "Đang chuẩn bị",
      description: "Nhà hàng đang chuẩn bị món ăn",
      completed: true,
      icon: Package,
    },
    {
      id: 3,
      title: "Đang giao",
      description: "Tài xế đang trên đường giao hàng",
      completed: false,
      icon: Truck,
      active: true,
    },
    {
      id: 4,
      title: "Đã giao",
      description: "Đơn hàng đã được giao thành công",
      completed: false,
      icon: CheckCircle,
    },
  ];

  // Calculate order items total
  const itemsTotal = (displayData.items || []).reduce(
    (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  // Open order tracking screen (tries react-navigation first, then expo-router)
  const onTrackPress = () => {
    try {
      // @ts-ignore
      if (navigation && (navigation as any).navigate) {
        // Navigate to order-tracking and pass orderId (customerLocation optional)
        (navigation as any).navigate("order-tracking", {
          orderId: orderData.id,
        });
        return;
      }
    } catch (e) {
      // swallow and try router fallback
    }

    if (router && router.push) {
      // expo-router path (file-based): adjust path if your file is nested differently
      // Try to include query params if needed; fallback to simple push
      try {
        router.push({
          pathname: "/order-tracking",
          params: { orderId: orderData.id },
        } as any);
        return;
      } catch (e) {
        router.push("/order-tracking");
        return;
      }
    }

    console.warn(
      "Unable to open order tracking: no navigation/router available"
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-4 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router1.back()} className="p-2">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            Chi tiết đơn hàng
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#06b35f" />
          <ThemedText className="mt-4">Đang tải dữ liệu...</ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <ThemedText className="text-red-500">{error}</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 px-4 py-4">
            {/* Order Status Card */}
            <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-gray-800">
                  {orderData.id}
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${orderData.statusColor}20` }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: orderData.statusColor }}
                  >
                    {orderData.status}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-600 mb-4">{orderData.date}</Text>

              {/* Restaurant Info */}
              <View className="flex-row items-center mb-4">
                <Image
                  source={{ uri: orderData.restaurant.image }}
                  style={{ width: 60, height: 60 }}
                  className="rounded-lg mr-3"
                />
                <Text className="text-gray-800 font-bold text-lg">
                  {orderData.restaurant.name}
                </Text>
              </View>

              {/* Tracking Progress */}
              <View className="mt-4">
                {trackingSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <View key={step.id} className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          step.completed || step.active
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      >
                        <IconComponent
                          size={20}
                          color={
                            step.completed || step.active ? "white" : "#9CA3AF"
                          }
                        />
                      </View>

                      <View className="ml-3 flex-1">
                        <Text
                          className={`font-bold ${
                            step.completed || step.active
                              ? "text-gray-800"
                              : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </Text>
                        <Text
                          className={`text-sm ${
                            step.completed || step.active
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {step.description}
                        </Text>
                      </View>

                      {index < trackingSteps.length - 1 && (
                        <View
                          className={`h-8 w-0.5 mx-5 ${
                            step.completed ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Driver Information */}
            <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <User size={20} color="#34C759" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Thông tin tài xế
                </Text>
              </View>

              <View className="flex-row items-center py-2">
                <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Text className="text-green-700 font-bold text-lg">TV</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">
                    {orderData.driver.name}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    ⭐ {orderData.driver.rating}
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-green-600 py-2 px-4 rounded-lg flex-row items-center"
                  onPress={() => console.log("Call driver")}
                >
                  <Phone size={16} color="white" />
                  <Text className="text-white font-medium ml-1">Gọi</Text>
                </TouchableOpacity>
              </View>

              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-600 mb-1">
                  Biển số xe:{" "}
                  <Text className="text-gray-800 font-medium">
                    {orderData.driver.licensePlate}
                  </Text>
                </Text>
                <Text className="text-gray-600">
                  Dự kiến đến lúc:{" "}
                  <Text className="text-green-600 font-bold">
                    {orderData.estimatedTime}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <MapPin size={20} color="#34C759" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Địa chỉ giao hàng
                </Text>
              </View>

              <Text className="text-gray-800 font-medium mb-1">
                {orderData.deliveryInfo.recipient}
              </Text>
              <Text className="text-gray-600 mb-1">
                {orderData.deliveryInfo.address}
              </Text>
              <Text className="text-gray-600 mb-2">
                SĐT: {orderData.deliveryInfo.phone}
              </Text>
              {orderData.deliveryInfo.note ? (
                <View className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <Text className="text-yellow-700 font-medium">Ghi chú:</Text>
                  <Text className="text-yellow-700">
                    {orderData.deliveryInfo.note}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Order Items */}
            <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Chi tiết đơn hàng
              </Text>

              <View className="space-y-3">
                {(displayData.items || []).map((item: any) => (
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
                    {itemsTotal.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Phí vận chuyển</Text>
                  <Text className="text-gray-800">
                    {orderData.pricing.deliveryFee.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Giảm giá</Text>
                  <Text className="text-green-600">
                    -{orderData.pricing.discount.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
                <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-200">
                  <Text className="text-lg font-bold text-gray-800">
                    Tổng cộng
                  </Text>
                  <Text className="text-xl font-bold text-green-600">
                    {orderData.pricing.total.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
              </View>
            </View>

            {/* Estimated Delivery Time */}
            <View className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <View className="flex-row items-center">
                <Clock size={20} color="#34C759" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Thời gian giao hàng
                </Text>
              </View>
              <Text className="text-gray-600 mt-2">
                Dự kiến giao hàng trong{" "}
                <Text className="font-bold text-green-600">
                  {orderData.estimatedTime}
                </Text>
              </Text>
            </View>
          </ScrollView>

          <View className="bg-white p-4 shadow-lg border-t border-gray-200">
            <TouchableOpacity
              onPress={onTrackPress}
              className="bg-green-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white text-lg font-bold">
                Theo dõi đơn hàng
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default OrderDetailScreen;
