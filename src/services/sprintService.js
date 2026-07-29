import axiosInstance from "../api/axiosInstance";

const SPRINTS_BASE = "/api/v1/sprints";

export const sprintService = {
  async listSprints({ projectId } = {}) {
    const { data } = await axiosInstance.get(SPRINTS_BASE, {
      params: { project_id: projectId ?? undefined },
    });
    return data; // array of sprints
  },

  async getSprint(sprintId) {
    const { data } = await axiosInstance.get(`${SPRINTS_BASE}/${sprintId}`);
    return data;
  },

  async createSprint({ projectId, name, startDate, endDate, status = "Planned" }) {
    const { data } = await axiosInstance.post(SPRINTS_BASE, {
      project_id: projectId,
      name,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status,
    });
    return data;
  },

  async updateSprint(sprintId, { name, startDate, endDate, status }) {
    const { data } = await axiosInstance.patch(`${SPRINTS_BASE}/${sprintId}`, {
      name: name || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: status || undefined,
    });
    return data;
  },

  async deleteSprint(sprintId) {
    const { data } = await axiosInstance.delete(`${SPRINTS_BASE}/${sprintId}`);
    return data;
  },
};
