import { loginWithEmail } from "@/services/firebase";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      setError(e?.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    console.log(`Logging in with ${platform}`);
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 pt-16">
        {/* Header Section */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-green-600 mb-2">
            FoodExpress
          </Text>
          <Text className="text-gray-500 text-center">
            Đăng nhập để tiếp tục trải nghiệm đặt đồ ăn tuyệt vời
          </Text>
        </View>

        {/* Illustration */}
        <View className="items-center mb-8">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D",
            }}
            className="w-64 h-40 rounded-lg"
            resizeMode="contain"
          />
        </View>

        {/* Login Form */}
        <View className="mb-6">
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

          <View className="mb-6">
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

          {error ? <Text className="text-red-500 mb-4">{error}</Text> : null}

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity
                className={`w-5 h-5 rounded border mr-2 ${rememberMe ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && (
                  <View className="w-3 h-3 bg-white rounded-full self-center mt-1 ml-1" />
                )}
              </TouchableOpacity>
              <Text className="text-gray-700">Ghi nhớ đăng nhập</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Chức năng", "Quên mật khẩu chưa được triển khai")
              }
            >
              <Text className="text-green-600 font-medium">Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-green-600 py-4 rounded-xl items-center mb-6"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social Login */}
        <View className="mb-8">
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300"></View>
            <Text className="text-gray-500 px-4">Hoặc đăng nhập với</Text>
            <View className="flex-1 h-px bg-gray-300"></View>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mx-2 py-3 border border-gray-300 rounded-xl items-center"
              onPress={() => handleSocialLogin("Google")}
            >
              <Text className="text-gray-700 font-medium">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 mx-2 py-3 border border-gray-300 rounded-xl items-center"
              onPress={() => handleSocialLogin("Facebook")}
            >
              <Text className="text-gray-700 font-medium">Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Bạn chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text className="text-green-600 font-bold">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
