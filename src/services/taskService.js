import axiosInstance from "../api/axiosInstance";

const TASKS_BASE = "/api/v1/tasks";

export const taskService = {
  async listTasks({ projectId, assignedTo, sprintId } = {}) {
    const { data } = await axiosInstance.get(TASKS_BASE, {
      params: {
        project_id: projectId ?? undefined,
        assigned_to: assignedTo ?? undefined,
        sprint_id: sprintId ?? undefined,
      },
    });
    return data; // array of tasks
  },

  async getTask(taskId) {
    const { data } = await axiosInstance.get(`${TASKS_BASE}/${taskId}`);
    return data;
  },

  async createTask({
    projectId,
    title,
    description,
    acceptanceCriteria,
    status = "To Do",
    dueDate,
    assignedTo,
    sprintId,
  }) {
    const { data } = await axiosInstance.post(TASKS_BASE, {
      project_id: projectId,
      title,
      description: description || undefined,
      acceptance_criteria: acceptanceCriteria || undefined,
      status,
      due_date: dueDate || undefined,
      assigned_to: assignedTo ?? undefined,
      sprint_id: sprintId ?? undefined,
    });
    return data;
  },

  async updateTask(taskId, { title, description, acceptanceCriteria, status, dueDate, assignedTo, sprintId }) {
    const { data } = await axiosInstance.patch(`${TASKS_BASE}/${taskId}`, {
      title: title || undefined,
      description: description || undefined,
      acceptance_criteria: acceptanceCriteria || undefined,
      status: status || undefined,
      due_date: dueDate || undefined,
      assigned_to: assignedTo ?? undefined,
      sprint_id: sprintId ?? undefined,
    });
    return data;
  },

  async deleteTask(taskId) {
    const { data } = await axiosInstance.delete(`${TASKS_BASE}/${taskId}`);
    return data;
  },

  // --- Reference screenshot attachments (AI test-case grounding) ---------
  // Multiple per task, separate from a Bug's single image_url. Upload
  // returns the created attachment ({ id, task_id, image_url,
  // created_at }); TaskOut already embeds the current list under
  // `attachments`, same pattern as bugService.uploadImage.
  async uploadAttachment(taskId, file) {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await axiosInstance.post(`${TASKS_BASE}/${taskId}/attachments`, formData);
    return data;
  },

  async deleteAttachment(attachmentId) {
    const { data } = await axiosInstance.delete(`${TASKS_BASE}/attachments/${attachmentId}`);
    return data;
  },
};
