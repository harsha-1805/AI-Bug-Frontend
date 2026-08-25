import axiosInstance from "../api/axiosInstance";

const BASE = "/api/v1/notifications";

export const notificationService = {
  async list(unreadOnly = false) {
    const { data } = await axiosInstance.get(BASE, { params: { unread_only: unreadOnly } });
    return data; // { unread_count, items }
  },

  async markRead(notificationId) {
    const { data } = await axiosInstance.post(`${BASE}/${notificationId}/read`);
    return data;
  },

  async markAllRead() {
    const { data } = await axiosInstance.post(`${BASE}/read-all`);
    return data;
  },
};
