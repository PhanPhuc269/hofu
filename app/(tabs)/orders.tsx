import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

/*
// Mock data for orders (kept as commented fallback)
const mockOrders = [
  {
    id: '1',
    restaurantName: 'Phở Hòa Bình',
    orderDate: '2023-05-15',
    totalAmount: '125.000đ',
    status: 'Đang giao',
    statusColor: '#34C759',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    restaurantName: 'Trà Sữa Gong Cha',
    orderDate: '2023-05-14',
    totalAmount: '85.000đ',
    status: 'Đã giao',
    statusColor: '#34C759',
    image: 'https://images.unsplash.com/photo-1612862300090-0e3c702f5d3d?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    restaurantName: 'Pizza Hut',
    orderDate: '2023-05-12',
    totalAmount: '250.000đ',
    status: 'Đã hủy',
    statusColor: '#FF3B30',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop',
  },
  {
    id: '4',
    restaurantName: 'Cơm Tấm Sài Gòn',
    orderDate: '2023-05-10',
    totalAmount: '95.000đ',
    status: 'Đã giao',
    statusColor: '#34C759',
    image: 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=200&fit=crop',
  },
  {
    id: '5',
    restaurantName: 'KFC',
    orderDate: '2023-05-08',
    totalAmount: '180.000đ',
    status: 'Đã giao',
    statusColor: '#34C759',
    image: 'https://images.unsplash.com/photo-1613564834361-9436948817d9?w=400&h=200&fit=crop',
  },
];
*/

const OrderHistoryScreen = () => {
  const [activeTab, setActiveTab] = useState<"ongoing" | "history">("ongoing");
  const router = useRouter();
  // Orders state (loaded from API). initial mock kept commented above.
  const [orders, setOrders] = useState<any[]>([]);
  const ordersRef = useRef<any[]>([]);

  // Filter orders based on active tab
  const ongoingOrders = orders.filter(
    (order: any) => order.status === "Đang giao"
  );
  const historyOrders = orders.filter(
    (order: any) => order.status !== "Đang giao"
  );

  // Load current user's orders on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { userRepository } = await import(
          "@/services/repository/userRepository"
        );
        const { orderRepository } = await import(
          "@/services/repository/orderRepository"
        );
        const user = await userRepository.fetchCurrentUser();
        if (!mounted) return;
        if (user && user.id) {
          try {
            const res = await orderRepository.fetchOrdersForUser(user.id);
            ordersRef.current = Array.isArray(res) ? res : [];
            if (mounted) setOrders(ordersRef.current);
            return;
          } catch (e) {
            // fallthrough to fallback
          }
        }

        // Fallback: try local JSON mocks
        try {
          const local = await import("@/data/GET - users [userId] orders.json");
          const val = (local as any).default ?? local;
          const arr = Array.isArray(val) ? val : [];
          ordersRef.current = arr;
          if (mounted) setOrders(arr);
          return;
        } catch (_e) {
          // try generic orders list
        }

        try {
          const generic = await import("@/data/GET - orders.json");
          const val = (generic as any).default ?? generic;
          const arr = Array.isArray(val) ? val : [];
          ordersRef.current = arr;
          if (mounted) setOrders(arr);
        } catch (_e) {
          // ignore, keep empty
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 items-center pt-12 pb-4 px-4">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold ml-4">
            Lịch sử đơn hàng
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-4 items-center rounded-lg ${
            activeTab === "ongoing" ? "bg-green-600" : "bg-transparent"
          }`}
          onPress={() => setActiveTab("ongoing")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "ongoing" ? "text-white" : "text-gray-600"
            }`}
          >
            Đang diễn ra
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center rounded-lg ${
            activeTab === "history" ? "bg-green-600" : "bg-transparent"
          }`}
          onPress={() => setActiveTab("history")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "history" ? "text-white" : "text-gray-600"
            }`}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView className="flex-1 px-4 py-4">
        {(activeTab === "ongoing" ? ongoingOrders : historyOrders).map(
          (order) => (
            <View
              key={order.id}
              className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
            >
              <Image source={{ uri: order.image }} className="w-full h-32" />
              <View className="p-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {order.restaurantName}
                    </Text>
                    <Text className="text-gray-500 mt-1">
                      {order.orderDate}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-gray-800">
                      {order.totalAmount}
                    </Text>
                    <View
                      className="px-3 py-1 rounded-full mt-2"
                      style={{ backgroundColor: `${order.statusColor}20` }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: order.statusColor }}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between mt-4">
                  <TouchableOpacity className="flex-1 bg-gray-100 py-3 rounded-lg items-center mr-2">
                    <Text className="text-gray-700 font-medium">Liên hệ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/order-detail?orderId=${order.id}`)
                    }
                    className="flex-1 bg-green-600 py-3 rounded-lg items-center ml-2"
                  >
                    <Text className="text-white font-medium">Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        )}

        {((activeTab === "ongoing" && ongoingOrders.length === 0) ||
          (activeTab === "history" && historyOrders.length === 0)) && (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-lg">Không có đơn hàng nào</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderHistoryScreen;
