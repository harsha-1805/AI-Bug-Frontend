import axiosInstance from "../api/axiosInstance";

const BUGS_BASE = "/api/v1/bugs";

export const bugService = {
  async listBugs({
    projectId,
    sprintId,
    status,
    assignedTo,
    search = "",
    page = 1,
    pageSize = 20,
  } = {}) {
    const { data } = await axiosInstance.get(BUGS_BASE, {
      params: {
        project_id: projectId ?? undefined,
        sprint_id: sprintId ?? undefined,
        status: status || undefined,
        assigned_to: assignedTo ?? undefined,
        search: search || undefined,
        page,
        page_size: pageSize,
      },
    });
    return data; // { total, page, page_size, items }
  },

  async getBug(bugId) {
    const { data } = await axiosInstance.get(`${BUGS_BASE}/${bugId}`);
    return data;
  },

  // `payload` can be a plain manually-typed bug, OR the exact
  // `bug_report` object returned by aiBugService.generateBug() with
  // isAiGenerated: true — the shape matches on purpose.
  async createBug({
    projectId,
    sprintId,
    taskId,
    assignedTo,
    title,
    severity = "Medium",
    priority = "P2",
    status = "Open",
    summary,
    description,
    environment,
    module,
    bugType,
    expectedResult,
    actualResult,
    possibleRootCause,
    confidenceScore,
    stepsToReproduce = [],
    isAiGenerated = false,
  }) {
    const { data } = await axiosInstance.post(BUGS_BASE, {
      project_id: projectId,
      sprint_id: sprintId ?? undefined,
      task_id: taskId ?? undefined,
      assigned_to: assignedTo ?? undefined,
      title,
      severity,
      priority,
      status,
      summary: summary || undefined,
      description: description || undefined,
      environment: environment || undefined,
      module: module || undefined,
      bug_type: bugType || undefined,
      expected_result: expectedResult || undefined,
      actual_result: actualResult || undefined,
      possible_root_cause: possibleRootCause || undefined,
      confidence_score: confidenceScore ?? undefined,
      steps_to_reproduce: stepsToReproduce,
      is_ai_generated: isAiGenerated,
    });
    return data;
  },

  async updateBug(bugId, fields) {
    // fields uses the same camelCase keys as createBug (all optional)
    const payload = {};
    const map = {
      title: "title",
      severity: "severity",
      priority: "priority",
      status: "status",
      sprintId: "sprint_id",
      taskId: "task_id",
      assignedTo: "assigned_to",
      summary: "summary",
      description: "description",
      environment: "environment",
      module: "module",
      bugType: "bug_type",
      expectedResult: "expected_result",
      actualResult: "actual_result",
      possibleRootCause: "possible_root_cause",
      confidenceScore: "confidence_score",
      stepsToReproduce: "steps_to_reproduce",
    };
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (map[key] && value !== undefined) payload[map[key]] = value;
    });
    const { data } = await axiosInstance.patch(`${BUGS_BASE}/${bugId}`, payload);
    return data;
  },

  async assignBug(bugId, assignedTo) {
    const { data } = await axiosInstance.patch(`${BUGS_BASE}/${bugId}/assign`, null, {
      params: { assigned_to: assignedTo },
    });
    return data;
  },

  async deleteBug(bugId) {
    const { data } = await axiosInstance.delete(`${BUGS_BASE}/${bugId}`);
    return data;
  },
};
