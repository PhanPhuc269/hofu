import { ThemedText } from "@/components/themed-text";
import { restaurantRepository } from "@/services/repository/restaurantRepository";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, MapPin, Plus, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

const { width } = Dimensions.get("window");

// // Mock data for restaurant
// const restaurantData = {
//   id: '1',
//   name: 'Phở Hòa Bình',
//   rating: 4.8,
//   deliveryTime: '25 phút',
//   distance: '1.2 km',
//   address: '123 Đường ABC, Quận 1, TP. HCM',
//   coverImage: 'https://images.unsplash.com/photo-1712026063351-61d52c2e4abb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Q2FzdWFsJTIwZGluaW5nJTIwcmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D',
//   description: 'Nhà hàng chuyên phục vụ phở truyền thống Việt Nam với công thức gia truyền hơn 50 năm. Nguyên liệu tươi ngon, nước dùng đậm đà, thịt bò mềm ngọt.',
// };

// // Mock data for menu categories
// const menuCategories = [
//   { id: '1', name: 'Món chính' },
//   { id: '2', name: 'Khai vị' },
//   { id: '3', name: 'Đồ uống' },
//   { id: '4', name: 'Tráng miệng' },
// ];

// // Mock data for menu items
// const menuItems = [
//   {
//     id: '1',
//     categoryId: '1',
//     name: 'Phở Bò Tái',
//     description: 'Phở bò với thịt tái, nước dùng trong, thơm ngon đặc trưng',
//     price: 45000,
//     image: 'https://images.unsplash.com/photo-1620147123631-7291b2b5a4f7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8QXNpYW4lMjBzcGljeSUyMG5vb2RsZXMlMjBzb3VwfGVufDB8fDB8fHww',
//   },
//   {
//     id: '2',
//     categoryId: '1',
//     name: 'Phở Gà',
//     description: 'Phở với thịt gà ta, nước dùng thanh ngọt, phù hợp người ăn kiêng',
//     price: 40000,
//     image: 'https://images.unsplash.com/photo-1620147123631-7291b2b5a4f7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8QXNpYW4lMjBzcGljeSUyMG5vb2RsZXMlMjBzb3VwfGVufDB8fDB8fHww',
//   },
//   {
//     id: '3',
//     categoryId: '1',
//     name: 'Bún Bò Huế',
//     description: 'Món đặc sản Huế với nước dùng cay nồng, thịt bò, giò heo',
//     price: 50000,
//     image: 'https://images.unsplash.com/photo-1620147123631-7291b2b5a4f7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8QXNpYW4lMjBzcGljeSUyMG5vb2RsZXMlMjBzb3VwfGVufDB8fDB8fHww',
//   },
//   {
//     id: '4',
//     categoryId: '2',
//     name: 'Gỏi Cuốn Tôm Thịt',
//     description: 'Gỏi cuốn với tôm, thịt heo, rau sống, bánh tráng mỏng',
//     price: 30000,
//     image: 'https://images.unsplash.com/photo-1648580852350-3098af89f110?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RGVsaWNpb3VzJTIwZm9vZCUyMG1lYWx8ZW58MHx8MHx8fDA%3D',
//   },
//   {
//     id: '5',
//     categoryId: '2',
//     name: 'Nem Nướng',
//     description: 'Nem nướng Ninh Hòa với thịt nướng thơm phức, ăn kèm rau',
//     price: 35000,
//     image: 'https://images.unsplash.com/photo-1648580852350-3098af89f110?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RGVsaWNpb3VzJTIwZm9vZCUyMG1lYWx8ZW58MHx8MHx8fDA%3D',
//   },
//   {
//     id: '6',
//     categoryId: '3',
//     name: 'Trà Đá',
//     description: 'Trà đá truyền thống Việt Nam, giải khát ngày hè',
//     price: 5000,
//     image: 'https://images.unsplash.com/photo-1546916925-509d4f177c37?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8QnVzeSUyMHN0cmVldCUyMGZvb2QlMjBtYXJrZXR8ZW58MHx8MHx8fDA%3D',
//   },
//   {
//     id: '7',
//     categoryId: '3',
//     name: 'Cà Phê Đen',
//     description: 'Cà phê đen nguyên chất, đậm đà, thơm nồng',
//     price: 15000,
//     image: 'https://images.unsplash.com/photo-1546916925-509d4f177c37?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8QnVzeSUyMHN0cmVldCUyMGZvb2QlMjBtYXJrZXR8ZW58MHx8MHx8fDA%3D',
//   },
//   {
//     id: '8',
//     categoryId: '4',
//     name: 'Chè Ba Màu',
//     description: 'Chè ba màu truyền thống với đậu xanh, đậu đỏ, thạch',
//     price: 20000,
//     image: 'https://images.unsplash.com/photo-1648580852350-3098af89f110?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RGVsaWNpb3VzJTIwZm9vZCUyMG1lYWx8ZW58MHx8MHx8fDA%3D',
//   },
// ];

const RestaurantDetailScreen = () => {
  const [restaurantData, setRestaurantData] = useState<any>({});
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const router = useRouter();
  const route = useRoute();
  const id = (route as any)?.params?.id;

  // Restaurant detail object
  // Menu categories array (each category may have .items)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCart = async () => {
      try {
        const cartRepo = await import("@/services/repository/cartRepository");
        const cart = await cartRepo.cartRepository.getCart(undefined);
        if (mounted) setCartItems(cart?.items ?? []);
      } catch (e) {
        // ignore
      }
    };
    loadCart();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch restaurant details and menu; fallback to local JSON mocks on error
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Call the three repository methods in parallel and invoke them
        const [restaurants, categories, items] = await Promise.all([
          restaurantRepository.fetchRestaurants(),
          restaurantRepository.fetchMenuCategories(id),
          restaurantRepository.fetchMenuItems(id),
        ]);

        if (!mounted) return;

        // Find restaurant by id if available, otherwise fallback to first
        const found = Array.isArray(restaurants)
          ? restaurants.find((r: any) => String(r.id) === String(id))
          : undefined;

        setRestaurantData(found ?? restaurants[0] ?? {});
        setMenuCategories(Array.isArray(categories) ? categories : []);
        setMenuItems(Array.isArray(items) ? items : []);

        // default selected category to first category id if not set
        const firstCategoryId =
          (Array.isArray(categories) && categories[0] && categories[0].id) ||
          "";
        setSelectedCategory((prev) => prev || firstCategoryId);
      } catch (e) {
        console.warn("Failed to load restaurant", e);
        if (mounted)
          setError(
            "Failed to load restaurant details. Please try again later."
          );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Filter menu items by selected category
  const filteredMenuItems = menuItems.filter(
    (item) => item.categoryId === selectedCategory
  );

  // Add item to cart
  const addToCart = async (item: any) => {
    try {
      const cartRepo = await import("@/services/repository/cartRepository");
      await cartRepo.cartRepository.addItem(undefined, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
      // refresh local view
      const cart = await cartRepo.cartRepository.getCart(undefined);
      setCartItems(cart?.items ?? []);
    } catch (e) {
      console.warn("addToCart failed", e);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevItems.filter((item) => item.id !== itemId);
      }
    });
  };

  // Calculate total items in cart
  const totalItemsInCart = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Render menu item
  const renderMenuItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
      <Image source={{ uri: item.image }} className="w-full h-40" />
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-1">
          {item.name}
        </Text>
        <Text className="text-gray-600 text-sm mb-3">{item.description}</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-green-600 font-bold text-lg">
            {item.price.toLocaleString("vi-VN")}đ
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-green-600 rounded-full p-1"
              onPress={() => addToCart(item)}
            >
              <Plus color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with back button */}
      <View className="absolute top-12 left-4 z-10">
        <TouchableOpacity
          className="bg-white rounded-full p-2 shadow-md"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#34C759" size={24} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#06b35f" />
          <ThemedText className="mt-4">
            Đang tải thông tin nhà hàng...
          </ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <ThemedText className="text-red-500">{error}</ThemedText>
        </View>
      ) : (
        <>
          {/* Cover Image */}
          <View className="h-64">
            <Image
              source={{ uri: restaurantData.coverImage }}
              className="w-full h-full"
            />
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-4 -mt-6 rounded-t-3xl bg-gray-100">
            {/* Restaurant Info Card */}
            <View className="bg-white rounded-2xl shadow-md p-5 -mt-8 mb-6">
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                {restaurantData.name}
              </Text>

              <View className="flex-row items-center mb-3">
                <Star color="#FFD700" fill="#FFD700" size={20} />
                <Text className="text-gray-700 ml-1 font-semibold">
                  {restaurantData.rating}
                </Text>
                <View className="w-1 h-1 bg-gray-400 rounded-full mx-2"></View>
                <Clock color="#666" size={16} />
                <Text className="text-gray-700 ml-1">
                  {restaurantData.deliveryTime}
                </Text>
                <View className="w-1 h-1 bg-gray-400 rounded-full mx-2"></View>
                <MapPin color="#666" size={16} />
                <Text className="text-gray-700 ml-1">
                  {restaurantData.distance}
                </Text>
              </View>

              <Text className="text-gray-600 mb-3">
                {restaurantData.address}
              </Text>
              <Text className="text-gray-700">
                {restaurantData.description}
              </Text>
            </View>

            {/* Menu Categories */}
            <View className="mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2 pb-2"
              >
                {menuCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`px-5 py-2 rounded-full ${
                      selectedCategory === category.id
                        ? "bg-green-600"
                        : "bg-white"
                    }`}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedCategory === category.id
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Items */}
            <FlatList
              data={filteredMenuItems}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </ScrollView>
        </>
      )}

      {/* Cart Summary */}
      {totalItemsInCart > 0 && (
        <View className="bg-green-600 p-4  py-5 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.push("/cart")}>
            <View>
              <Text className="text-white text-lg font-bold">
                {totalItemsInCart} món
              </Text>
              <Text className="text-white">Xem giỏ hàng</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/cart")}
            className="bg-white rounded-full px-6 py-3"
          >
            <Text className="text-green-600 font-bold">Xem giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default RestaurantDetailScreen;
