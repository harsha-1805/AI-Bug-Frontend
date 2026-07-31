import axiosInstance from "../api/axiosInstance";

const AUDIT_BASE = "/api/v1/audit-logs";

export const auditService = {
  async listAuditLogs({ entityType, entityId, projectId, actorId, page = 1, pageSize = 50 } = {}) {
    const { data } = await axiosInstance.get(AUDIT_BASE, {
      params: {
        entity_type: entityType || undefined,
        entity_id: entityId || undefined,
        project_id: projectId || undefined,
        actor_id: actorId || undefined,
        page,
        page_size: pageSize,
      },
    });
    return data; // { total, page, page_size, items }
  },
};
