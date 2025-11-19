import { Category } from "@/models/Category";
import api from "@/services/api";

// AsyncStorage fallback for persistence when WatermelonDB/native adapters aren't available.
const ASYNC_KEY = "@hofu:categories_v1";

async function readCategoriesFromAsyncStorage(): Promise<Category[] | null> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(ASYNC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

async function writeCategoriesToAsyncStorage(items: Category[]): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(ASYNC_KEY, JSON.stringify(items));
    // eslint-disable-next-line no-console
    console.log("Categories persisted to AsyncStorage");
  } catch (e) {
    // ignore failures
  }
}

// (AsyncStorage helpers declared above)

export const categoryRepository = {
  /**
   * Fetch categories with DB caching.
   * - Try reading from local DB (WatermelonDB or in-memory fallback).
   * - If DB is empty or stale, fetch from remote API and upsert into DB.
   */
  async fetchCategories(): Promise<Category[]> {
    // Try AsyncStorage cache first (no WatermelonDB)
    try {
      const asyncCached = await readCategoriesFromAsyncStorage();
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
      const data = await api.request<Category[]>("/categories");
      const items = data ?? [];

      // Persist to AsyncStorage (durable) — no WatermelonDB
      try {
        await writeCategoriesToAsyncStorage(items);
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
};
