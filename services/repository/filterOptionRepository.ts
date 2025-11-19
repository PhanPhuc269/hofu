import { FilterOption } from "@/models/FilterOption";
import api from "@/services/api";

// AsyncStorage fallback for persistence when WatermelonDB/native adapters aren't available.
const ASYNC_KEY = "@hofu:filterOptions_v1";

async function readFilterOptionsFromAsyncStorage(): Promise<FilterOption[] | null> {
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

async function writeFilterOptionsToAsyncStorage(items: FilterOption[]): Promise<void> {
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

export const filterOptionsRepository = {
  /**
   * Fetch filter options with DB caching.
   * - Try reading from local DB (WatermelonDB or in-memory fallback).
   * - If DB is empty or stale, fetch from remote API and upsert into DB.
   */
  async fetchFilterOptions(): Promise<FilterOption[]> {
    // Try AsyncStorage cache first (no WatermelonDB)
    try {
      const asyncCached = await readFilterOptionsFromAsyncStorage();
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
      const data = await api.request<FilterOption[]>("/filterOptions");
      const items = data ?? [];

      // Persist to AsyncStorage (durable) — no WatermelonDB
      try {
        await writeFilterOptionsToAsyncStorage(items);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn("Failed to persist filter options to AsyncStorage", e);
      }

      return items;
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },
};
