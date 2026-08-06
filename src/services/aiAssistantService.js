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

  // Generate test cases from scratch for a Task or Bug.
  async generateTestCases({ entityType, entityId }) {
    const { data } = await axiosInstance.post(TEST_CASES_BASE, {
      entity_type: entityType,
      entity_id: entityId,
    });
    return data; // { entity_type, entity_id, entity_title, count, test_cases, csv }
  },

  // Re-generate test cases incorporating the user's feedback about what
  // was wrong or missing in the previous result.
  async regenerateTestCases({ entityType, entityId, feedback }) {
    const { data } = await axiosInstance.post(`${TEST_CASES_BASE}/regenerate`, {
      entity_type: entityType,
      entity_id: entityId,
      feedback,
    });
    return data;
  },

  // Save a generated (or regenerated) test case set to the DB so it
  // appears in the Test Cases Library.
  async saveTestCases({ entityType, entityId, entityTitle, projectId, testCases, csv }) {
    const { data } = await axiosInstance.post(`${TEST_CASES_BASE}/save`, {
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      project_id: projectId,
      test_cases: testCases,
      csv,
    });
    return data;
  },

  // List saved test case sets — filterable by project and/or task.
  async listSavedTestCases({ projectId, taskId, bugId } = {}) {
    const { data } = await axiosInstance.get(`${TEST_CASES_BASE}/saved`, {
      params: {
        project_id: projectId || undefined,
        task_id: taskId || undefined,
        bug_id: bugId || undefined,
      },
    });
    return data; // array of SavedTestCaseOut
  },

  // Delete a saved test case set.
  async deleteSavedTestCase(recordId) {
    await axiosInstance.delete(`${TEST_CASES_BASE}/saved/${recordId}`);
  },
};
