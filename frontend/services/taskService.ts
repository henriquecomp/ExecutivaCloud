import { api } from "./api";
import { Task } from "../types";

const mapTask = (item: any): Task => ({
  ...item,
  id: String(item.id),
  executiveId: String(item.executiveId),
});

interface GetTasksParams {
  executiveId?: string;
}

export const taskService = {
  getAll: async (params?: GetTasksParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<any[]>(`/tasks/?${search.toString()}`);
    return response.data.map(mapTask);
  },

  create: async (data: Partial<Task>) => {
    const response = await api.post<any>("/tasks/", data);
    return mapTask(response.data);
  },

  createBulk: async (data: Partial<Task>[]) => {
    const response = await api.post<any[]>("/tasks/bulk", data);
    return response.data.map(mapTask);
  },

  update: async (id: string, data: Partial<Task>) => {
    const response = await api.put<any>(`/tasks/${Number(id)}`, data);
    return mapTask(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/tasks/${Number(id)}`);
  },

  deleteByRecurrence: async (recurrenceId: string, fromDueDate?: string) => {
    const search = new URLSearchParams();
    if (fromDueDate) {
      search.append("from_due_date", fromDueDate);
    }
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await api.delete(`/tasks/recurrence/${encodeURIComponent(recurrenceId)}${suffix}`);
    return response.data;
  },
};
