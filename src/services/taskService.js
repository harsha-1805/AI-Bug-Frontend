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

  async createTask({ projectId, title, description, status = "To Do", dueDate, assignedTo, sprintId }) {
    const { data } = await axiosInstance.post(TASKS_BASE, {
      project_id: projectId,
      title,
      description: description || undefined,
      status,
      due_date: dueDate || undefined,
      assigned_to: assignedTo ?? undefined,
      sprint_id: sprintId ?? undefined,
    });
    return data;
  },

  async updateTask(taskId, { title, description, status, dueDate, assignedTo, sprintId }) {
    const { data } = await axiosInstance.patch(`${TASKS_BASE}/${taskId}`, {
      title: title || undefined,
      description: description || undefined,
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
};
