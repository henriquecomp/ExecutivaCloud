import { api } from "./api";
import { Document } from "../types";

const mapDocument = (item: any): Document => ({
  ...item,
  id: String(item.id),
  executiveId: String(item.executiveId),
  categoryId: item.categoryId != null ? String(item.categoryId) : undefined,
});

interface GetDocumentsParams {
  executiveId?: string;
}

export const documentService = {
  getAll: async (params?: GetDocumentsParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<any[]>(`/documents/?${search.toString()}`);
    return response.data.map(mapDocument);
  },

  create: async (data: Partial<Document>) => {
    const response = await api.post<any>("/documents/", data);
    return mapDocument(response.data);
  },

  update: async (id: string, data: Partial<Document>) => {
    const response = await api.put<any>(`/documents/${Number(id)}`, data);
    return mapDocument(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/documents/${Number(id)}`);
  },
};
