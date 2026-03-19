import { api } from "./api";
import { ContactType } from "../types";

const mapContactType = (item: any): ContactType => ({
  ...item,
  id: String(item.id),
  color: item.color || "#64748b",
});

export const contactTypeService = {
  getAll: async () => {
    const response = await api.get<any[]>("/contact-types/?skip=0&limit=1000");
    return response.data.map(mapContactType);
  },

  create: async (data: Omit<ContactType, "id">) => {
    const response = await api.post<any>("/contact-types/", data);
    return mapContactType(response.data);
  },

  update: async (id: string, data: Partial<Omit<ContactType, "id">>) => {
    const response = await api.put<any>(`/contact-types/${Number(id)}`, data);
    return mapContactType(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/contact-types/${Number(id)}`);
  },
};
