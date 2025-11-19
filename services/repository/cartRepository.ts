import api from "@/services/api";

const ASYNC_CART_KEY = "@hofu:cart_v1";

async function readCartFromAsyncStorage(): Promise<any | null> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(ASYNC_CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function writeCartToAsyncStorage(cart: any): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(ASYNC_CART_KEY, JSON.stringify(cart));
  } catch (e) {
    // ignore
  }
}

export const cartRepository = {
  async getCart(userId?: string): Promise<any> {
    // Try server first if userId provided
    if (userId) {
      try {
        const data = await api.request(`/users/${userId}/cart`);
        if (data) return data;
      } catch (e) {
        // fallback to AsyncStorage
      }
    }

    const local = await readCartFromAsyncStorage();
    return local ?? { items: [] };
  },

  async addItem(userId: string | undefined, item: any): Promise<void> {
    if (userId) {
      await api.request(`/users/${userId}/cart/items`, {
        method: "POST",
        body: item,
      });
      return;
    }

    // local-only
    const cart = (await readCartFromAsyncStorage()) || { items: [] };
    cart.items.push(item);
    await writeCartToAsyncStorage(cart);
  },

  async updateItem(
    userId: string | undefined,
    itemId: string,
    payload: any
  ): Promise<void> {
    if (userId) {
      await api.request(`/users/${userId}/cart/items/${itemId}`, {
        method: "PUT",
        body: payload,
      });
      return;
    }

    const cart = (await readCartFromAsyncStorage()) || { items: [] };
    cart.items = cart.items.map((it: any) =>
      it.id === itemId ? { ...it, ...payload } : it
    );
    await writeCartToAsyncStorage(cart);
  },

  async removeItem(userId: string | undefined, itemId: string): Promise<void> {
    if (userId) {
      await api.request(`/users/${userId}/cart/items/${itemId}`, {
        method: "DELETE",
      });
      return;
    }

    const cart = (await readCartFromAsyncStorage()) || { items: [] };
    cart.items = cart.items.filter((it: any) => it.id !== itemId);
    await writeCartToAsyncStorage(cart);
  },

  async clearCart(userId?: string): Promise<void> {
    if (userId) {
      await api.request(`/users/${userId}/cart`, { method: "DELETE" });
      return;
    }

    await writeCartToAsyncStorage({ items: [] });
  },
};

export default cartRepository;
