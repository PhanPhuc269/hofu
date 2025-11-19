import { User } from "@/models/User";
import api from "@/services/api";

// Thin repository that uses `services/api` to communicate with a backend.
// Adjust endpoint paths to match your backend API.
export const userRepository = {
  async fetchCurrentUser(): Promise<User | null> {
    try {
      const data = await api.request<User>("/me");
      return data ?? null;
    } catch (err: any) {
      // If not found / unauthorized, return null. Re-throw for other errors.
      if (err && (err.status === 401 || err.status === 404)) return null;
      throw err;
    }
  },

  async saveUser(user: User): Promise<void> {
    // If user has an id, call PUT /users/:id, otherwise POST /users
    if (user.id) {
      await api.request(`/users/${user.id}`, { method: "PUT", body: user });
    } else {
      await api.request("/users", { method: "POST", body: user });
    }
  },
};
