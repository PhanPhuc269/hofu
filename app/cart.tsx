import { useRouter } from "expo-router";
import { ArrowLeft, Minus, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CartScreen = () => {
  const router = useRouter();
  // Mock cart items data
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cartRepo = await import("@/services/repository/cartRepository");
        const cart = await cartRepo.cartRepository.getCart(undefined);
        if (mounted) setCartItems(cart?.items ?? []);
      } catch (e) {
        console.warn("Failed to load cart", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate order summary
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 15000;
  const total = subtotal + deliveryFee;

  // Handle quantity changes
  const increaseQuantity = async (id: string) => {
    try {
      const cartRepo = await import("@/services/repository/cartRepository");
      await cartRepo.cartRepository.updateItem(undefined, id, { quantity: 1 });
      const cart = await cartRepo.cartRepository.getCart(undefined);
      setCartItems(cart?.items ?? []);
    } catch (e) {
      console.warn("increaseQuantity failed", e);
    }
  };

  const decreaseQuantity = async (id: string) => {
    try {
      // decrease by 1 via updateItem payload (repository will handle removal if qty <=0)
      const cartRepo = await import("@/services/repository/cartRepository");
      // fetch current cart to compute
      const cart = await cartRepo.cartRepository.getCart(undefined);
      const item = (cart?.items ?? []).find((it: any) => it.id === id);
      if (!item) return;
      if (item.quantity > 1) {
        await cartRepo.cartRepository.updateItem(undefined, id, {
          quantity: item.quantity - 1,
        });
      } else {
        await cartRepo.cartRepository.removeItem(undefined, id);
      }
      const newCart = await cartRepo.cartRepository.getCart(undefined);
      setCartItems(newCart?.items ?? []);
    } catch (e) {
      console.warn("decreaseQuantity failed", e);
    }
  };

  // Remove item from cart
  const removeItem = async (id: string) => {
    try {
      const cartRepo = await import("@/services/repository/cartRepository");
      await cartRepo.cartRepository.removeItem(undefined, id);
      const cart = await cartRepo.cartRepository.getCart(undefined);
      setCartItems(cart?.items ?? []);
    } catch (e) {
      console.warn("removeItem failed", e);
    }
  };

  // Render cart item
  const renderCartItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl shadow-sm mb-4 p-4 flex-row">
      <Image source={{ uri: item.image }} className="w-20 h-20 rounded-lg" />

      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-600">{item.restaurant}</Text>
        <Text className="text-green-600 font-bold mt-1">
          {item.price.toLocaleString("vi-VN")}₫
        </Text>

        <View className="flex-row items-center mt-2">
          <TouchableOpacity
            className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center"
            onPress={() => decreaseQuantity(item.id)}
          >
            <Minus size={16} color="#34C759" />
          </TouchableOpacity>

          <Text className="mx-4 text-lg font-semibold">{item.quantity}</Text>

          <TouchableOpacity
            className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center"
            onPress={() => increaseQuantity(item.id)}
          >
            <Plus size={16} color="#34C759" />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-4"
            onPress={() => removeItem(item.id)}
          >
            <Text className="text-red-500">Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1 text-center">
            Giỏ hàng
          </Text>
          <View className="w-6" /> {/* Spacer for alignment */}
        </View>
      </View>

      {/* Cart Items */}
      <ScrollView className="flex-1 px-4 py-6">
        {cartItems.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Giỏ hàng trống</Text>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Order Summary */}
        <View className="bg-white rounded-xl shadow-sm p-4 mt-4">
          <Text className="text-lg font-bold mb-4">Tóm tắt đơn hàng</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Tạm tính</Text>
            <Text className="text-gray-800 font-medium">
              {subtotal.toLocaleString("vi-VN")}₫
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Phí giao hàng</Text>
            <Text className="text-gray-800 font-medium">
              {deliveryFee.toLocaleString("vi-VN")}₫
            </Text>
          </View>

          <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-200">
            <Text className="text-lg font-bold">Tổng cộng</Text>
            <Text className="text-green-600 font-bold text-lg">
              {total.toLocaleString("vi-VN")}₫
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className="bg-green-600 rounded-xl py-4 items-center justify-center"
          onPress={() => router.push("/payment")}
        >
          <Text className="text-white font-bold text-lg">
            Tiến hành Đặt hàng
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;
