import { api } from "./api";
import { DocumentCategory } from "../types";

const mapDocumentCategory = (item: any): DocumentCategory => ({
  ...item,
  id: String(item.id),
  color: typeof item.color === "string" && item.color ? item.color : "#64748b",
});

export const documentCategoryService = {
  getAll: async () => {
    const response = await api.get<any[]>("/document-categories/?skip=0&limit=1000");
    return response.data.map(mapDocumentCategory);
  },

  create: async (data: Omit<DocumentCategory, "id">) => {
    const response = await api.post<any>("/document-categories/", data);
    return mapDocumentCategory(response.data);
  },

  update: async (id: string, data: Partial<Omit<DocumentCategory, "id">>) => {
    const response = await api.put<any>(`/document-categories/${Number(id)}`, data);
    return mapDocumentCategory(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/document-categories/${Number(id)}`);
  },
};
