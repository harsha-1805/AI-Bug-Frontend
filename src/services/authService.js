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

  // Settings -> Profile: self-service name/email edit.
  async updateProfile({ fullName, email }) {
    const { data } = await axiosInstance.patch(`${AUTH_BASE}/me`, {
      full_name: fullName || undefined,
      email: email || undefined,
    });
    return data;
  },

  // Settings -> Profile: self-service password change (requires current password).
  async changePassword({ currentPassword, newPassword }) {
    const { data } = await axiosInstance.patch(`${AUTH_BASE}/me/password`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  },
};
