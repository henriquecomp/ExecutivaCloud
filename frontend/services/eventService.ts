import { api } from "./api";
import { Event } from "../types";

const mapEvent = (item: any): Event => ({
  ...item,
  id: String(item.id),
  executiveId: String(item.executiveId),
  eventTypeId: item.eventTypeId != null ? String(item.eventTypeId) : undefined,
});

interface GetEventsParams {
  executiveId?: string;
}

export const eventService = {
  getAll: async (params?: GetEventsParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<any[]>(`/events/?${search.toString()}`);
    return response.data.map(mapEvent);
  },

  create: async (data: Partial<Event>) => {
    const response = await api.post<any>("/events/", data);
    return mapEvent(response.data);
  },

  createBulk: async (data: Partial<Event>[]) => {
    const response = await api.post<any[]>("/events/bulk", data);
    return response.data.map(mapEvent);
  },

  update: async (id: string, data: Partial<Event>) => {
    const response = await api.put<any>(`/events/${Number(id)}`, data);
    return mapEvent(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/events/${Number(id)}`);
  },

  deleteByRecurrence: async (recurrenceId: string, fromStartTime?: string) => {
    const search = new URLSearchParams();
    if (fromStartTime) {
      search.append("from_start_time", fromStartTime);
    }
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await api.delete(`/events/recurrence/${encodeURIComponent(recurrenceId)}${suffix}`);
    return response.data;
  },
};
