import axiosInstance from "../api/axiosInstance";

const BASE = "/api/v1/comments";

export const commentService = {
  async list(entityType, entityId) {
    const { data } = await axiosInstance.get(BASE, {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return data;
  },

  async create(entityType, entityId, body) {
    const { data } = await axiosInstance.post(BASE, {
      entity_type: entityType,
      entity_id: entityId,
      body,
    });
    return data;
  },

  async remove(commentId) {
    await axiosInstance.delete(`${BASE}/${commentId}`);
  },
};
