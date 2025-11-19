import { FilterOption } from "@/models/FilterOption";
import { filterOptionsRepository } from "@/services/repository/filterOptionRepository";
import { restaurantRepository } from "@/services/repository/restaurantRepository";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Clock, Filter, MapPin, Search, Star } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/*
// Mock data for restaurants (kept as a commented fallback)
const mockRestaurants = [
  {
    id: "1",
    name: "Nhà hàng Việt Nam",
    cuisine: "Ẩm thực Việt",
    rating: 4.7,
    deliveryTime: "20-30 phút",
    deliveryTimeMinutes: 25,
    distance: "1.2 km",
    deliveryFee: 15000,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    tags: ["Món mới", "Ưu đãi"],
    promoted: true,
  },
  {
    id: "2",
    name: "Pizza Italiano",
    cuisine: "Ẩm thực Ý",
    rating: 4.5,
    deliveryTime: "25-35 phút",
    deliveryTimeMinutes: 30,
    distance: "2.1 km",
    deliveryFee: 20000,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    tags: ["Ưu đãi"],
    promoted: false,
  },
  {
    id: "3",
    name: "Sushi Land",
    cuisine: "Ẩm thực Nhật",
    rating: 4.8,
    deliveryTime: "30-40 phút",
    deliveryTimeMinutes: 35,
    distance: "3.5 km",
    deliveryFee: 30000,
    image: "https://images.unsplash.com/photo-1579584425590-09bbd109b4d0?w=800",
    tags: ["Món mới"],
    promoted: true,
  },
  {
    id: "4",
    name: "Burger King",
    cuisine: "Fast Food",
    rating: 4.3,
    deliveryTime: "15-25 phút",
    deliveryTimeMinutes: 20,
    distance: "0.8 km",
    deliveryFee: 10000,
    image: "https://images.unsplash.com/photo-1550547660-9be5dfee402f?w=800",
    tags: [],
    promoted: false,
  },
  {
    id: "5",
    name: "Phở 24",
    cuisine: "Ẩm thực Việt",
    rating: 4.6,
    deliveryTime: "20-30 phút",
    deliveryTimeMinutes: 25,
    distance: "1.5 km",
    deliveryFee: 12000,
    image: "https://images.unsplash.com/photo-1596662951482-0c4e0d53a7e8?w=800",
    tags: ["Ưu đãi"],
    promoted: false,
  },
  {
    id: "6",
    name: "Taco Bell",
    cuisine: "Ẩm thực Mexico",
    rating: 4.2,
    deliveryTime: "20-30 phút",
    deliveryTimeMinutes: 25,
    distance: "2.3 km",
    deliveryFee: 18000,
    image: "https://images.unsplash.com/photo-1599029112902-8a0e0e4c0b0d?w=800",
    tags: ["Món mới"],
    promoted: true,
  },
];
*/

// Filter options
// const filterOptions = [
//   { id: "1", name: "Ưu đãi", icon: "Tag" },
//   { id: "2", name: "Đánh giá 4.5+", icon: "Star" },
//   { id: "3", name: "Giao hàng miễn phí", icon: "Truck" },
//   { id: "4", name: "Dưới 30 phút", icon: "Clock" },
//   { id: "5", name: "Khoảng cách gần", icon: "MapPin" },
// ];

export default function SearchScreen() {
  const router = useRouter();
  const route = useRoute();

  const navQuery =
    (route && (route as any).params && (route as any).params.query) || "";

  const [searchQuery, setSearchQuery] = useState(navQuery || "");
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const initialRestaurantsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState<
    "recommended" | "rating" | "deliveryFee" | "deliveryTime" | null
  >(null);

  // Filter & sort restaurants based on search, filters and sort option
  useEffect(() => {
    // Use the current `restaurants` (which may come from API when searching)
    let results = restaurants.slice();

    // Apply search filter on client for name/cuisine as a last-resort
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((restaurant) => {
        const name =
          restaurant && restaurant.name
            ? String(restaurant.name).toLowerCase()
            : "";
        const cuisine =
          restaurant && restaurant.cuisine
            ? String(restaurant.cuisine).toLowerCase()
            : "";
        return name.includes(q) || cuisine.includes(q);
      });
    }

    // Apply selected filters
    if (selectedFilters?.length > 0) {
      results = results.filter((restaurant) => {
        if (
          selectedFilters.includes("1") &&
          !restaurant.tags.includes("Ưu đãi")
        )
          return false;
        if (selectedFilters.includes("2") && restaurant.rating < 4.5)
          return false;
        if (
          selectedFilters.includes("4") &&
          // deliveryTimeMinutes is numeric now
          restaurant.deliveryTimeMinutes &&
          restaurant.deliveryTimeMinutes > 30
        )
          return false;
        return true;
      });
    }

    // Apply sorting
    if (sortOption) {
      switch (sortOption) {
        case "recommended":
          // promoted first, then rating desc
          results.sort((a, b) => {
            if (a.promoted === b.promoted) return b.rating - a.rating;
            return a.promoted ? -1 : 1;
          });
          break;
        case "rating":
          results.sort((a, b) => b.rating - a.rating);
          break;
        case "deliveryFee":
          results.sort((a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0));
          break;
        case "deliveryTime":
          results.sort(
            (a, b) =>
              (a.deliveryTimeMinutes || 0) - (b.deliveryTimeMinutes || 0)
          );
          break;
      }
    }

    setFilteredRestaurants(results);
  }, [restaurants, searchQuery, selectedFilters, sortOption]);

  // Debounced search: call API when `searchQuery` changes
  useEffect(() => {
    let mounted = true;
    const handler = setTimeout(() => {
      (async () => {
        // If empty query, reset to initial fetched list
        if (!searchQuery) {
          if (mounted) {
            setRestaurants(initialRestaurantsRef.current);
            setFilteredRestaurants(initialRestaurantsRef.current);
            setError(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        setError(null);
        try {
          // Import repository lazily to avoid any startup dependency issues
          const { restaurantRepository } = await import(
            "@/services/repository/restaurantRepository"
          );
          const results = await restaurantRepository.searchRestaurants(
            searchQuery,
            {
              filters: selectedFilters,
              sort: sortOption,
            }
          );
          if (!mounted) return;
          setRestaurants(Array.isArray(results) ? results : []);
        } catch (e) {
          if (!mounted) return;
          setError("Lỗi khi tìm kiếm. Vui lòng thử lại.");
          // Keep restaurants as empty list on failure
          setRestaurants([]);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [searchQuery, selectedFilters, sortOption]);

  useEffect(() => {
    const fetchData = async () => {
      const allFilterOptions =
        await filterOptionsRepository.fetchFilterOptions();
      setFilterOptions(allFilterOptions);
      const results = await restaurantRepository.fetchRestaurants();
      const arr = Array.isArray(results) ? results : [];
      initialRestaurantsRef.current = arr;
      setRestaurants(arr);
      setFilteredRestaurants(arr);
      setLoading(false);
    };
    fetchData();
    // Fetch initial restaurants list from API (fallback to local JSON mock)
  }, []);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const renderRestaurantItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-xl mb-4 p-4 shadow-sm"
      onPress={() => router.push(`/restaurant?id=${item.id}`)}
    >
      <View className="flex-row">
        <Image source={{ uri: item.image }} className="w-20 h-20 rounded-xl" />
        <View className="ml-4 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
            {item.promoted && (
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-green-800 text-xs font-bold">
                  Đã xác nhận
                </Text>
              </View>
            )}
          </View>

          <Text className="text-gray-600 mt-1">{item.cuisine}</Text>

          <View className="flex-row items-center mt-2">
            <Star color="#FFD700" fill="#FFD700" size={16} />
            <Text className="text-gray-900 font-bold ml-1">{item.rating}</Text>
            <Text className="text-gray-500 mx-2">•</Text>
            <Clock color="#666" size={14} />
            <Text className="text-gray-600 ml-1">{item.deliveryTime}</Text>
            <Text className="text-gray-500 mx-2">•</Text>
            <MapPin color="#666" size={14} />
            <Text className="text-gray-600 ml-1">{item.distance}</Text>
          </View>

          {item.tags?.length > 0 && (
            <View className="flex-row mt-2">
              {item.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-orange-100 px-2 py-1 rounded mr-2"
                >
                  <Text className="text-orange-800 text-xs">{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 p-5 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-green-600 font-bold mr-4">Hủy</Text>
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-3">
            <Search color="#666" size={20} />
            <TextInput
              className="flex-1 ml-2 text-gray-900"
              placeholder="Tìm kiếm nhà hàng hoặc món ăn"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        </View>
      </View>

      {/* Filters */}
      <View className="bg-white py-3 px-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter color="#34C759" size={20} />
            <Text className="text-green-600 font-bold ml-2">Bộ lọc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setShowSortModal(true)}
          >
            <Text className="text-green-600 font-bold">Lọc theo</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="mt-3">
            <View className="flex-row flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  className={`px-4 py-2 rounded-full border ${
                    selectedFilters.includes(filter.id)
                      ? "bg-green-100 border-green-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onPress={() => toggleFilter(filter.id)}
                >
                  <Text
                    className={`${
                      selectedFilters.includes(filter.id)
                        ? "text-green-800"
                        : "text-gray-700"
                    }`}
                  >
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-between mt-4">
              <Text className="text-gray-600">
                Hiển thị {filteredRestaurants.length} kết quả
              </Text>
              <TouchableOpacity>
                <Text className="text-green-600">Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sort modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white p-4 rounded-t-3xl">
            <Text className="text-lg font-bold mb-3">Lọc theo</Text>

            {/* Radio options */}
            {[
              { id: "recommended", label: "Được đề xuất" },
              { id: "rating", label: "Đánh giá" },
              { id: "deliveryFee", label: "Phí giao hàng" },
              { id: "deliveryTime", label: "Thời gian giao hàng" },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSortOption(opt.id as any)}
                className="flex-row items-center py-3"
              >
                <View
                  className={`w-5 h-5 mr-3 rounded-full border items-center justify-center ${
                    sortOption === opt.id
                      ? "border-green-600"
                      : "border-gray-300"
                  }`}
                >
                  {sortOption === opt.id && (
                    <View className="w-3 h-3 rounded-full bg-green-600" />
                  )}
                </View>
                <Text className="text-gray-800">{opt.label}</Text>
              </Pressable>
            ))}

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                className="px-4 py-2 mr-2"
                onPress={() => {
                  setSortOption(null);
                }}
              >
                <Text className="text-gray-600">Xóa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 bg-green-600 rounded"
                onPress={() => setShowSortModal(false)}
              >
                <Text className="text-white">Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Results */}
      {loading ? (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#34C759" />
          <Text className="text-gray-600 mt-2">Đang tìm...</Text>
        </View>
      ) : error ? (
        <View className="py-6 items-center">
          <Text className="text-red-600">{error}</Text>
          <TouchableOpacity
            onPress={() => {
              // retry: re-trigger the effect by resetting the query
              setSearchQuery((q: string) => q);
            }}
            className="mt-2 px-4 py-2 bg-green-600 rounded"
          >
            <Text className="text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurantItem}
          className="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
