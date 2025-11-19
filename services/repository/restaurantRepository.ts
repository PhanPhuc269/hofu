import { Category } from "@/models/Category";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import api from "@/services/api";

// AsyncStorage fallback for persistence when WatermelonDB/native adapters aren't available.
const ASYNC_KEYS = {
  restaurants: "@hofu:restaurants_v1",
  categories: "@hofu:categories_v1",
  menuItems: "@hofu:menu_items_v1",
};

async function readFromAsyncStorage<T>(key: string): Promise<T[] | null> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

async function writeToAsyncStorage<T>(key: string, items: T[]): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(key, JSON.stringify(items));
    // eslint-disable-next-line no-console
    console.log(`${key} persisted to AsyncStorage`);
  } catch (e) {
    // ignore failures
  }
}

// (AsyncStorage helpers declared above)

export const restaurantRepository = {
  /**
   * Fetch restaurants with DB caching.
   * - Try reading from local DB (WatermelonDB or in-memory fallback).
   * - If DB is empty or stale, fetch from remote API and upsert into DB.
   */
  async fetchRestaurants(): Promise<Restaurant[]> {
    // Try AsyncStorage cache first (no WatermelonDB)
    try {
      const asyncCached = await readFromAsyncStorage<Restaurant>(
        ASYNC_KEYS.restaurants
      );
      if (Array.isArray(asyncCached) && asyncCached.length > 0) {
        // eslint-disable-next-line no-console
        console.log("Loaded restaurants from AsyncStorage");
        return asyncCached;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("AsyncStorage read failed", e);
    }

    // fetch from network
    try {
      const data = await api.request<Restaurant[]>("/restaurants");
      const items = data ?? [];

      // Persist to AsyncStorage (durable) — no WatermelonDB
      try {
        await writeToAsyncStorage<Restaurant>(ASYNC_KEYS.restaurants, items);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn("Failed to persist restaurants to AsyncStorage", e);
      }

      return items;
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },
  async fetchMenuCategories(id: string): Promise<Category[]> {
    // Try AsyncStorage cache first (no WatermelonDB)
    try {
      const asyncCached = await readFromAsyncStorage<Category>(
        ASYNC_KEYS.categories
      );
      if (Array.isArray(asyncCached) && asyncCached.length > 0) {
        // eslint-disable-next-line no-console
        console.log("Loaded categories from AsyncStorage");
        return asyncCached;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("AsyncStorage read failed", e);
    }

    // fetch from network
    try {
      const data = await api.request<Category[]>(
        `/restaurants/${id}/categories`
      );
      const items = data ?? [];

      // Persist to AsyncStorage (durable) — no WatermelonDB
      try {
        await writeToAsyncStorage<Category>(ASYNC_KEYS.categories, items);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn("Failed to persist categories to AsyncStorage", e);
      }

      return items;
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },

  async fetchMenuItems(id: string): Promise<MenuItem[]> {
    // Try AsyncStorage cache first (no WatermelonDB)
    try {
      const asyncCached = await readFromAsyncStorage<MenuItem>(
        ASYNC_KEYS.menuItems
      );
      if (Array.isArray(asyncCached) && asyncCached.length > 0) {
        // eslint-disable-next-line no-console
        console.log("Loaded menu items from AsyncStorage");
        return asyncCached;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("AsyncStorage read failed", e);
    }

    // fetch from network
    try {
      const data = await api.request<MenuItem[]>(`/restaurants/${id}/menu`);
      const items = data ?? [];

      // Persist to AsyncStorage (durable) — no WatermelonDB
      try {
        await writeToAsyncStorage<MenuItem>(ASYNC_KEYS.menuItems, items);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn("Failed to persist menu items to AsyncStorage", e);
      }

      return items;
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },

  async searchRestaurants(
    query: string,
    options?: {
      filters?: string[]; // filter ids from UI (e.g. ["1","2","4"])
      sort?: "recommended" | "rating" | "deliveryFee" | "deliveryTime" | null;
    }
  ): Promise<Restaurant[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);

      // Translate UI filter ids into API query params
      const filters = options?.filters ?? [];
      if (filters.includes("1")) {
        // "Ưu đãi" tag
        params.append("tags[]", "Ưu đãi");
      }
      if (filters.includes("2")) {
        // min rating 4.5
        params.append("min_rating", "4.5");
      }
      if (filters.includes("3")) {
        // free delivery
        params.append("free_delivery", "true");
      }
      if (filters.includes("4")) {
        // max delivery time in minutes
        params.append("max_delivery_time", "30");
      }
      if (filters.includes("5")) {
        // max distance in km (example default)
        params.append("max_distance_km", "3");
      }

      if (options?.sort) params.append("sort", options.sort);

      const qs = params.toString();
      const url = `/restaurants/search${qs ? `?${qs}` : ""}`;

      const data = await api.request<Restaurant[]>(url);
      return data ?? [];
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },
};
