import axiosInstance from "../api/axiosInstance";

const AI_ASSISTANT_BASE = "/api/v1/ai-assistant";

export const aiAssistantService = {
  async query({ message, projectId, module }) {
    const { data } = await axiosInstance.post(`${AI_ASSISTANT_BASE}/query`, {
      message,
      project_id: projectId || undefined,
      module: module || undefined,
    });
    return data; // { answer, intent }
  },
};
