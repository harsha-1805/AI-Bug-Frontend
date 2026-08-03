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

  // `memberIds`: users to grant team access to this project at creation
  // time (see ProjectCreate.member_ids / project_service.create_project
  // on the backend — the owner is always added automatically even if
  // omitted here).
  async createProject({ name, description, ownerId, memberIds = [] }) {
    const { data } = await axiosInstance.post(PROJECTS_BASE, {
      name,
      description: description || undefined,
      owner_id: ownerId ?? undefined,
      member_ids: memberIds,
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

  // --- Team membership (Phase 8) -----------------------------------------
  // Only members of a project's team (plus Admin/Lead, who bypass the
  // check org-wide) can see the project or be assigned its tasks/bugs/
  // subtasks — see app/services/project_access.py on the backend.

  async listProjectMembers(projectId) {
    const { data } = await axiosInstance.get(`${PROJECTS_BASE}/${projectId}/members`);
    return data; // [{ user_id, full_name, email, added_at }]
  },

  async addProjectMembers(projectId, userIds) {
    const { data } = await axiosInstance.post(`${PROJECTS_BASE}/${projectId}/members`, {
      user_ids: userIds,
    });
    return data; // full updated member list
  },

  async removeProjectMember(projectId, userId) {
    const { data } = await axiosInstance.delete(`${PROJECTS_BASE}/${projectId}/members/${userId}`);
    return data;
  },
};
