import { registerWithEmail } from "@/services/firebase";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password);
      router.replace("/login");
    } catch (e: any) {
      setError(e?.message ?? "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (platform: string) => {
    console.log(`Registering with ${platform}`);
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 pt-12">
        {/* Header Section */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-green-600 mb-2">
            FoodExpress
          </Text>
          <Text className="text-gray-500 text-center">
            Đăng ký tài khoản để tận hưởng dịch vụ đặt đồ ăn nhanh chóng
          </Text>
        </View>

        {/* Illustration */}
        <View className="items-center mb-6">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D",
            }}
            className="w-64 h-40 rounded-lg"
            resizeMode="contain"
          />
        </View>

        {/* Registration Form */}
        <View className="mb-6">
          {/* Name Field */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Họ và tên</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <User size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-700"
                placeholder="Nhập họ và tên của bạn"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email Field */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Mail size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-700"
                placeholder="Nhập email của bạn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Field */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Mật khẩu</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Lock size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-700"
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">
              Xác nhận mật khẩu
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Lock size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-700"
                placeholder="Nhập lại mật khẩu"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View className="flex-row items-start mb-6">
            <TouchableOpacity
              className="w-5 h-5 rounded border border-gray-300 mr-2 mt-1"
              onPress={() => Alert.alert("Điều khoản", "Chưa áp dụng")}
            >
              <View className="w-3 h-3 bg-green-500 rounded-full self-center mt-1 ml-1" />
            </TouchableOpacity>
            <Text className="text-gray-700 flex-1">
              Tôi đồng ý với{" "}
              <Text className="text-green-600">Điều khoản sử dụng</Text> và{" "}
              <Text className="text-green-600">Chính sách bảo mật</Text> của
              FoodExpress
            </Text>
          </View>

          <TouchableOpacity
            className="bg-green-600 py-4 rounded-xl items-center mb-6"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social Registration */}
        <View className="mb-8">
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300"></View>
            <Text className="text-gray-500 px-4">Hoặc đăng ký với</Text>
            <View className="flex-1 h-px bg-gray-300"></View>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mx-2 py-3 border border-gray-300 rounded-xl items-center"
              onPress={() => handleSocialRegister("Google")}
            >
              <Text className="text-gray-700 font-medium">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 mx-2 py-3 border border-gray-300 rounded-xl items-center"
              onPress={() => handleSocialRegister("Facebook")}
            >
              <Text className="text-gray-700 font-medium">Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="text-green-600 font-bold">Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
