import { api } from "./api";
import { Executive } from "../types";

const mapExecutive = (item: any): Executive => ({
  ...item,
  id: String(item.id),
  street: item.street ?? item.address,
  organizationId: item.organizationId != null ? String(item.organizationId) : undefined,
  departmentId: item.departmentId != null ? String(item.departmentId) : undefined,
  reportsToExecutiveId:
    item.reportsToExecutiveId != null ? String(item.reportsToExecutiveId) : undefined,
});

export const executiveService = {
  // Ajustado default para 1000 para permitir paginação no frontend fluida
  getAll: async (skip: number = 0, limit: number = 1000) => {
    const response = await api.get<any[]>(
      `/executives/?skip=${skip}&limit=${limit}`,
    );
    return response.data.map(mapExecutive);
  },

  create: async (data: Partial<Executive>) => {
    const response = await api.post<any>("/executives/", data);
    return mapExecutive(response.data);
  },

  update: async (id: string, data: Partial<Executive>) => {
    const response = await api.put<any>(`/executives/${Number(id)}`, data);
    return mapExecutive(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/executives/${Number(id)}`);
  },
};
