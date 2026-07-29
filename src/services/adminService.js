import axiosInstance from "../api/axiosInstance";

const ADMIN_BASE = "/api/v1/admin/users";
const ROLES_BASE = "/api/v1/roles";

export const adminService = {
  async listUsers({ search = "", page = 1, pageSize = 20 } = {}) {
    const { data } = await axiosInstance.get(ADMIN_BASE, {
      params: { search: search || undefined, page, page_size: pageSize },
    });
    return data; // { total, page, page_size, items }
  },

  async inviteUser({ fullName, email, roleId }) {
    const { data } = await axiosInstance.post(`${ADMIN_BASE}/invite`, {
      full_name: fullName,
      email,
      role_id: roleId ?? null,
    });
    return data; // { user, temporary_password }
  },

  async updateUser(userId, { fullName, email }) {
    const { data } = await axiosInstance.patch(`${ADMIN_BASE}/${userId}`, {
      full_name: fullName || undefined,
      email: email || undefined,
    });
    return data;
  },

  async deactivateUser(userId) {
    const { data } = await axiosInstance.patch(`${ADMIN_BASE}/${userId}/deactivate`);
    return data;
  },

  async activateUser(userId) {
    const { data } = await axiosInstance.patch(`${ADMIN_BASE}/${userId}/activate`);
    return data;
  },

  async assignRole(userId, roleId) {
    const { data } = await axiosInstance.patch(`${ADMIN_BASE}/${userId}/role`, {
      role_id: roleId,
    });
    return data;
  },

  // Multi-select version: replaces the user's full set of roles in one
  // call. A user can hold more than one role at once (e.g. Lead + QA).
  async assignRoles(userId, roleIds) {
    const { data } = await axiosInstance.patch(`${ADMIN_BASE}/${userId}/roles`, {
      role_ids: roleIds,
    });
    return data;
  },

  async deleteUser(userId) {
    const { data } = await axiosInstance.delete(`${ADMIN_BASE}/${userId}`);
    return data;
  },
};

export const rolesService = {
  async listRoles() {
    const { data } = await axiosInstance.get(ROLES_BASE);
    return data; // [{ id, name, description, is_system, permissions: [...] }]
  },
};
