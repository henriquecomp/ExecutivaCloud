import { api } from "./api";
import { Department, DepartmentCreate, DepartmentUpdate } from "../types";

export const departmentService = {
  // Método crucial para carregar a lista completa e permitir filtro no frontend
  getAll: async () => {
    const response = await api.get<Department[]>("/departments/");
    return response.data;
  },
  getByOrg: async (orgId: string) => {
    const response = await api.get<Department[]>(
      `/departments/by-organization/${orgId}`,
    );
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get<Department>(`/departments/${id}`);
    return response.data;
  },
  create: async (data: DepartmentCreate) => {
    const response = await api.post<Department>("/departments/", data);
    return response.data;
  },
  update: async (id: string, data: DepartmentUpdate) => {
    const response = await api.put<Department>(`/departments/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/departments/${id}`);
  },
};
