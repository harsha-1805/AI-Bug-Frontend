import axiosInstance from "../api/axiosInstance";

const SUBTASKS_BASE = "/api/v1/subtasks";

export const subtaskService = {
  async listSubtasks({ taskId } = {}) {
    const { data } = await axiosInstance.get(SUBTASKS_BASE, {
      params: { task_id: taskId || undefined },
    });
    return data; // array of subtasks
  },

  async createSubtask({ taskId, title, description, status, dueDate, assignedTo }) {
    const { data } = await axiosInstance.post(SUBTASKS_BASE, {
      task_id: taskId,
      title,
      description: description || undefined,
      status: status || "To Do",
      due_date: dueDate || undefined,
      assigned_to: assignedTo || undefined,
    });
    return data;
  },

  async updateSubtask(subtaskId, { title, description, status, dueDate, assignedTo }) {
    const { data } = await axiosInstance.patch(`${SUBTASKS_BASE}/${subtaskId}`, {
      title: title || undefined,
      description: description ?? undefined,
      status: status || undefined,
      due_date: dueDate || undefined,
      assigned_to: assignedTo || undefined,
    });
    return data;
  },

  async deleteSubtask(subtaskId) {
    const { data } = await axiosInstance.delete(`${SUBTASKS_BASE}/${subtaskId}`);
    return data;
  },
};
