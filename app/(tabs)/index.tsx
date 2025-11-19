import { Link, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// import ParallaxScrollView from "@/components/parallax-scroll-view";
import CustomParallaxLayout from "@/components/custom-parallax-layout";
import { ThemedText } from "@/components/themed-text";
import { Category } from "@/models/Category";
import { Restaurant } from "@/models/Restaurant";
import { useFocusEffect } from "@react-navigation/native";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native-paper";

const renderCategory = ({ item }: { item: Category }) => (
  <TouchableOpacity className="items-center mr-6">
    <View className="bg-white rounded-full p-3 shadow-sm mb-2">
      <Image source={{ uri: item.image }} className="w-12 h-12 rounded-full" />
    </View>
    <Text className="text-gray-700 font-medium">{item.name}</Text>
  </TouchableOpacity>
);

const renderRestaurant = ({ item }: { item: Restaurant }) => (
  <TouchableOpacity className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
    <Image source={{ uri: item.image }} className="w-full h-40" />
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-green-600 font-semibold">★ {item.rating}</Text>
        <Text className="text-gray-500">{item.deliveryTime}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState<string>(
    "123 Đường ABC, Quận 1"
  );

  // repository that uses WatermelonDB cache (or in-memory fallback)

  // const categories = [
  //   {
  //     id: "1",
  //     name: "Cơm",
  //     image:
  //       "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=100&h=100&fit=crop",
  //   },
  //   {
  //     id: "2",
  //     name: "Trà sữa",
  //     image:
  //       "data:image/webp;base64,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",
  //   },
  //   {
  //     id: "3",
  //     name: "Đồ ăn vặt",
  //     image:
  //       "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=100&h=100&fit=crop",
  //   },
  //   {
  //     id: "4",
  //     name: "Pizza",
  //     image:
  //       "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop",
  //   },
  //   {
  //     id: "5",
  //     name: "Cà phê",
  //     image:
  //       "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop",
  //   },
  // ];

  // const restaurants = [
  //   {
  //     id: "1",
  //     name: "Phở Hòa Bình",
  //     rating: 4.8,
  //     deliveryTime: "25 phút",
  //     image:
  //       "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=200&fit=crop",
  //   },
  //   {
  //     id: "2",
  //     name: "Trà Sữa Gong Cha",
  //     rating: 4.6,
  //     deliveryTime: "30 phút",
  //     image:
  //       "data:image/webp;base64,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",
  //   },
  //   {
  //     id: "3",
  //     name: "Pizza Hut",
  //     rating: 4.5,
  //     deliveryTime: "35 phút",
  //     image:
  //       "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop",
  //   },
  //   {
  //     id: "4",
  //     name: "Cơm Tấm Sài Gòn",
  //     rating: 4.7,
  //     deliveryTime: "20 phút",
  //     image:
  //       "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=200&fit=crop",
  //   },
  // ];

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { categoryRepository } = await import(
          "@/services/repository/categoryRepository"
        );
        const { restaurantRepository } = await import(
          "@/services/repository/restaurantRepository"
        );
        //Dùng Promise.all nếu có nhiều hơn 1 request
        const [categoryData, restaurantData] = await Promise.all([
          categoryRepository.fetchCategories(),
          restaurantRepository.fetchRestaurants(),
        ]);
        if (!mounted) return;
        // ensure we always set an array into state
        // const items = Array.isArray(data)
        //   ? data
        //   : data && Array.isArray((data as any).data)
        //     ? (data as any).data
        //     : [];
        setCategories(categoryData);
        setRestaurants(restaurantData);
      } catch (e: any) {
        // best-effort error capture; keep UI functional
        // eslint-disable-next-line no-console
        console.warn("Failed to load categories", e);
        if (mounted) setError(String(e?.message || e || "Unknown error"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Load selected address persisted by Address Selection screen whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const raw = await AsyncStorage.getItem("@hofu:selectedAddress");
          if (raw) {
            const parsed = JSON.parse(raw);
            // Map similar to payment screen mapping
            const addr = parsed || {};
            const orig = addr.originalData?.address || {};

            const mapped = {
              name:
                addr.text ||
                addr.place_name ||
                orig?.residential ||
                orig?.dormitory ||
                "",
              street: orig?.road || orig?.pedestrian || addr.place_name || "",
              ward: orig?.suburb || orig?.neighbourhood || "",
              district:
                orig?.county ||
                orig?.state_district ||
                orig?.city_district ||
                "",
              city: orig?.city || orig?.town || orig?.village || "",
              place_name: addr.place_name,
            };

            const parts = [
              mapped.street,
              mapped.ward,
              mapped.district,
              mapped.city,
            ].filter(Boolean);
            const display =
              parts.length > 0
                ? parts.join(", ")
                : mapped.place_name || mapped.name || "";
            if (mounted && display) setSelectedAddress(display);

            // remove stored value so it won't be reapplied repeatedly
            await AsyncStorage.removeItem("@hofu:selectedAddress");
          }
        } catch (e) {
          // ignore
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );
  const ListHeader = () => (
    <View>
      <ThemedText className="text-xl font-bold mb-4">Danh mục</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-8"
      >
        <View className="flex-row">
          {Array.isArray(categories) && categories.length > 0
            ? categories.map((item) => (
                <View key={item.id}>{renderCategory({ item })}</View>
              ))
            : null}
        </View>
      </ScrollView>

      <ThemedText className="text-xl font-bold mb-4">
        Nhà hàng Nổi bật
      </ThemedText>
    </View>
  );

  return (
    <CustomParallaxLayout
      headerHeight={150}
      headerBackground={{ type: "color", color: "#06b35f" }}
      overlayParallaxFactor={1}
      renderHeaderOverlay={() => (
        <View>
          <Link href="/address-selection" asChild>
            <TouchableOpacity>
              <View className="flex-row items-center mb-2 mt-8">
                <Text className="text-white text-lg font-bold">Giao đến: </Text>
                <Text
                  className="text-white text-lg font-bold flex-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedAddress}
                </Text>
                <Text className="text-white ml-2">▼</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <View className="bg-white rounded-full px-4 py-4 flex-row items-center">
            <TextInput
              className="flex-1 text-gray-500"
              placeholder="Tìm nhà hàng hoặc món ăn..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => {
                // Khi nhấn Enter trên keyboard chuyển sang màn hình Search
                router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
              }}
            />
            <TouchableOpacity
              onPress={() =>
                router.push(`/search?query=${encodeURIComponent(searchQuery)}`)
              }
              accessibilityLabel="Mở màn hình tìm kiếm"
              className="px-4"
            >
              {/* Icon tìm kiếm */}
              <Search size={20} color="#34C759" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
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
        <View className="flex-1">
          <FlatList
            scrollEnabled={false} // Important: disable nested scrolling
            contentContainerStyle={{ flexGrow: 1 }}
            data={restaurants}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<ListHeader />}
          />
        </View>
      )}
    </CustomParallaxLayout>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center", // Căn giữa theo chiều dọc
    alignItems: "center", // Căn giữa theo chiều ngang
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.2)", // Thêm 1 lớp phủ mờ cho dễ đọc chữ
  },
  headerTitle: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "white",
  },
  content: {
    height: 1000, // Đảm bảo có đủ nội dung để cuộn
    padding: 20,
  },
});
