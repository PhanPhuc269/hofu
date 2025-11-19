import api from "@/services/api";

export type Order = {
  id: string;
  userId?: string;
  restaurantId?: string;
  items?: Array<{ id: string; name?: string; quantity: number; price: number }>;
  status?: string;
  deliveryInfo?: any;
  createdAt?: string;
  updatedAt?: string;
};

export const orderRepository = {
  async fetchOrder(orderId: string): Promise<Order | null> {
    try {
      const data = await api.request<Order>(`/orders/${orderId}`);
      return data ?? null;
    } catch (err: any) {
      if (err && err.status === 404) return null;
      throw err;
    }
  },

  async fetchOrdersForUser(userId: string): Promise<Order[]> {
    try {
      const data = await api.request<Order[]>(`/users/${userId}/orders`);
      return data ?? [];
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },

  async createOrder(payload: Partial<Order>): Promise<Order> {
    const data = await api.request<Order>("/orders", {
      method: "POST",
      body: payload,
    });
    return data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await api.request(`/orders/${orderId}/status`, {
      method: "PUT",
      body: { status },
    });
  },
};

export default orderRepository;
