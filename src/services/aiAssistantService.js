import axiosInstance from "../api/axiosInstance";

const AI_ASSISTANT_BASE = "/api/v1/ai-assistant";
const TEST_CASES_BASE = "/api/v1/ai/test-cases";

export const aiAssistantService = {
  async query({ message, projectId, module }) {
    const { data } = await axiosInstance.post(`${AI_ASSISTANT_BASE}/query`, {
      message,
      project_id: projectId || undefined,
      module: module || undefined,
    });
    return data; // { answer, intent }
  },

  // Analyzes a Task (title, description, acceptance criteria, subtasks,
  // reference screenshots) or a Bug (all its recorded fields + its
  // screenshot) and returns a grounded set of QA test cases, plus
  // ready-to-download CSV text in the same response.
  async generateTestCases({ entityType, entityId }) {
    const { data } = await axiosInstance.post(TEST_CASES_BASE, {
      entity_type: entityType,
      entity_id: entityId,
    });
    return data; // { entity_type, entity_id, entity_title, count, test_cases, csv }
  },
};

