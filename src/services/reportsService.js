import axiosInstance, { API_BASE_URL } from "../api/axiosInstance";

const REPORTS_BASE = "/api/v1/reports";

export const reportsService = {
  async getBugAnalytics({ projectId, dateFrom, dateTo } = {}) {
    const { data } = await axiosInstance.get(`${REPORTS_BASE}/bug-analytics`, {
      params: { project_id: projectId || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
    });
    return data;
  },

  async getSprintReport({ projectId } = {}) {
    const { data } = await axiosInstance.get(`${REPORTS_BASE}/sprint-report`, {
      params: { project_id: projectId || undefined },
    });
    return data;
  },

  async getTeamPerformance({ projectId } = {}) {
    const { data } = await axiosInstance.get(`${REPORTS_BASE}/team-performance`, {
      params: { project_id: projectId || undefined },
    });
    return data;
  },

  async getAiBugStats({ projectId } = {}) {
    const { data } = await axiosInstance.get(`${REPORTS_BASE}/ai-bug-stats`, {
      params: { project_id: projectId || undefined },
    });
    return data;
  },

  // Downloads the CSV directly via axios (so the auth header is sent),
  // then triggers a browser save using a Blob + temporary <a> — a plain
  // <a href="/api/...download"> wouldn't carry the Authorization header.
  async downloadExport({ type, projectId, dateFrom, dateTo, status, severity, entityType }) {
    const response = await axiosInstance.get(`${REPORTS_BASE}/export`, {
      params: {
        type,
        project_id: projectId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: status || undefined,
        severity: severity || undefined,
        entity_type: entityType || undefined,
      },
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}_report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { API_BASE_URL };
