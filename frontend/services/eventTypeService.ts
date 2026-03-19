import { api } from "./api";
import { EventType } from "../types";

const mapEventType = (item: any): EventType => ({
  ...item,
  id: String(item.id),
});

export const eventTypeService = {
  getAll: async () => {
    const response = await api.get<any[]>("/event-types/?skip=0&limit=1000");
    return response.data.map(mapEventType);
  },

  create: async (data: Omit<EventType, "id">) => {
    const response = await api.post<any>("/event-types/", data);
    return mapEventType(response.data);
  },

  update: async (id: string, data: Partial<Omit<EventType, "id">>) => {
    const response = await api.put<any>(`/event-types/${Number(id)}`, data);
    return mapEventType(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/event-types/${Number(id)}`);
  },
};
