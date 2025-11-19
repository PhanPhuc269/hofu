import { auth, logout } from "@/services/firebase";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  MapPin,
  User,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AccountScreen = () => {
  const user = {
    name: auth.currentUser?.displayName || "Nguyễn Văn An",
    email: auth.currentUser?.email || "nguyenvanan@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
  };

  const menuItems = [
    {
      id: 1,
      title: "Thông tin cá nhân",
      icon: User,
      onPress: () => router.push("/personalize"),
    },
    {
      id: 2,
      title: "Địa chỉ đã lưu",
      icon: MapPin,
      onPress: () => console.log("Địa chỉ đã lưu"),
    },
    {
      id: 3,
      title: "Phương thức thanh toán",
      icon: CreditCard,
      onPress: () => console.log("Phương thức thanh toán"),
    },
    {
      id: 4,
      title: "Trợ giúp",
      icon: HelpCircle,
      onPress: () => console.log("Trợ giúp"),
    },
  ];

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Replace navigation stack with login screen
      router.replace("/login");
    } catch (e) {
      Alert.alert("Lỗi", "Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-4">
        <Text className="text-white text-2xl font-bold text-center">
          Tài khoản
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Profile Section */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6 items-center">
          <Image
            source={{ uri: user.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text className="text-xl font-bold text-gray-800">{user.name}</Text>
          <Text className="text-gray-600 mt-1">{user.email}</Text>
        </View>

        {/* Menu Items */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? "border-b border-gray-100" : ""}`}
              onPress={item.onPress}
            >
              <item.icon size={24} color="#34C759" />
              <Text className="flex-1 ml-4 text-gray-800 text-lg">
                {item.title}
              </Text>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white rounded-xl shadow-sm p-4 mt-6"
          onPress={handleLogout}
        >
          <LogOut size={24} color="#FF3B30" />
          <Text className="ml-4 text-red-500 text-lg font-medium">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AccountScreen;
