import api from "@/services/api";

export const paymentRepository = {
  /**
   * Create a payment intent / token for a given order and payment method.
   * Backend should return provider-specific token or an object the client can use.
   */
  async createPayment(
    orderId: string,
    method: string,
    payload?: any
  ): Promise<any> {
    const data = await api.request(`/payments`, {
      method: "POST",
      body: { orderId, method, ...payload },
    });
    return data;
  },
};

export default paymentRepository;
