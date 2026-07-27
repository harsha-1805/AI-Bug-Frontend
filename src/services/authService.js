import axiosInstance from "../api/axiosInstance";

const AUTH_BASE = "/api/v1/auth";

export const authService = {
  async signup({ fullName, email, password }) {
    const { data } = await axiosInstance.post(`${AUTH_BASE}/signup`, {
      full_name: fullName,
      email,
      password,
    });
    return data;
  },

  async login({ email, password }) {
    const { data } = await axiosInstance.post(`${AUTH_BASE}/login`, {
      email,
      password,
    });
    return data; // { access_token, token_type, user }
  },

  async getCurrentUser() {
    const { data } = await axiosInstance.get(`${AUTH_BASE}/me`);
    return data;
  },
};
