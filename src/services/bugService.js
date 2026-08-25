import axiosInstance from "../api/axiosInstance";

const BUGS_BASE = "/api/v1/bugs";

export const bugService = {
  async listBugs({
    projectId,
    sprintId,
    status,
    assignedTo,
    search = "",
    subtaskId,
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
        subtask_id: subtaskId ?? undefined,
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

  // Screenshot upload for a manually-created bug (separate from the AI
  // Bug Generator flow, which persists its own image server-side). Upload
  // the file first to get `image_url`, then include that in the
  // createBug/updateBug payload. No explicit Content-Type here on
  // purpose — axios/the browser set the multipart boundary automatically
  // for FormData bodies (see api/axiosInstance.js interceptor).
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await axiosInstance.post(`${BUGS_BASE}/upload-image`, formData);
    return data; // { image_url }
  },

  // `payload` can be a plain manually-typed bug, OR the exact
  // `bug_report` object returned by aiBugService.generateBug() with
  // isAiGenerated: true — the shape matches on purpose. `imageUrl` is
  // the persisted screenshot path returned alongside that bug_report
  // (see aiBugService.generateBug -> result.image_url) so it's saved
  // onto the Bug and can be previewed later wherever the bug is shown.
  async createBug({
    projectId,
    sprintId,
    taskId,
    subtaskId,
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
    imageUrl,
  }) {
    const { data } = await axiosInstance.post(BUGS_BASE, {
      project_id: projectId,
      sprint_id: sprintId ?? undefined,
      task_id: taskId ?? undefined,
      subtask_id: subtaskId ?? undefined,
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
      image_url: imageUrl || undefined,
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
      subtaskId: "subtask_id",
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
      imageUrl: "image_url",
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

  // Moves a Resolved (or legacy Closed) bug back to "In Progress" and
  // reassigns it to whoever was working on it before it was resolved —
  // see bug_service.reopen_bug on the backend.
  async reopenBug(bugId) {
    const { data } = await axiosInstance.patch(`${BUGS_BASE}/${bugId}/reopen`);
    return data;
  },

  async deleteBug(bugId) {
    const { data } = await axiosInstance.delete(`${BUGS_BASE}/${bugId}`);
    return data;
  },
};
