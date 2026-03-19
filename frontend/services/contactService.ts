import { api } from "./api";
import { Contact } from "../types";

const mapContact = (item: any): Contact => ({
  ...item,
  id: String(item.id),
  executiveId: String(item.executiveId),
  contactTypeId: item.contactTypeId != null ? String(item.contactTypeId) : undefined,
});

interface GetContactsParams {
  executiveId?: string;
}

export const contactService = {
  getAll: async (params?: GetContactsParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<any[]>(`/contacts/?${search.toString()}`);
    return response.data.map(mapContact);
  },

  create: async (data: Partial<Contact>) => {
    const response = await api.post<any>("/contacts/", data);
    return mapContact(response.data);
  },

  update: async (id: string, data: Partial<Contact>) => {
    const response = await api.put<any>(`/contacts/${Number(id)}`, data);
    return mapContact(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/contacts/${Number(id)}`);
  },
};
