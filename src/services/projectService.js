import axiosInstance from "../api/axiosInstance";

const PROJECTS_BASE = "/api/v1/projects";

export const projectService = {
  async listProjects({ search = "", page = 1, pageSize = 20 } = {}) {
    const { data } = await axiosInstance.get(PROJECTS_BASE, {
      params: { search: search || undefined, page, page_size: pageSize },
    });
    return data; // { total, page, page_size, items }
  },

  async getProject(projectId) {
    const { data } = await axiosInstance.get(`${PROJECTS_BASE}/${projectId}`);
    return data;
  },

  async createProject({ name, description, ownerId }) {
    const { data } = await axiosInstance.post(PROJECTS_BASE, {
      name,
      description: description || undefined,
      owner_id: ownerId ?? undefined,
    });
    return data;
  },

  async updateProject(projectId, { name, description, ownerId }) {
    const { data } = await axiosInstance.patch(`${PROJECTS_BASE}/${projectId}`, {
      name: name || undefined,
      description: description || undefined,
      owner_id: ownerId ?? undefined,
    });
    return data;
  },

  async deleteProject(projectId) {
    const { data } = await axiosInstance.delete(`${PROJECTS_BASE}/${projectId}`);
    return data;
  },
};
