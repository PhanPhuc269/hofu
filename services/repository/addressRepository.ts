import api from "@/services/api";

export const addressRepository = {
  async fetchAddresses(userId: string): Promise<any[]> {
    try {
      const data = await api.request<any[]>(`/users/${userId}/addresses`);
      return data ?? [];
    } catch (err: any) {
      if (err && err.status === 404) return [];
      throw err;
    }
  },

  async saveAddress(userId: string, address: any): Promise<any> {
    if (address.id) {
      const res = await api.request(
        `/users/${userId}/addresses/${address.id}`,
        {
          method: "PUT",
          body: address,
        }
      );
      return res;
    }

    const res = await api.request(`/users/${userId}/addresses`, {
      method: "POST",
      body: address,
    });
    return res;
  },

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await api.request(`/users/${userId}/addresses/${addressId}`, {
      method: "DELETE",
    });
  },
};

export default addressRepository;
