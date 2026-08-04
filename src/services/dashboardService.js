import axiosInstance from "../api/axiosInstance";

const DASHBOARD_BASE = "/api/v1/dashboard";

export const dashboardService = {
  async getSummary({ projectId } = {}) {
    const { data } = await axiosInstance.get(`${DASHBOARD_BASE}/summary`, {
      params: { project_id: projectId || undefined },
    });
    return data;
  },
};
