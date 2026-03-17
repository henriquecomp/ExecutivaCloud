import { api } from "./api";
import { Department, DepartmentCreate, DepartmentUpdate } from "../types";

const mapDepartment = (item: any): Department => ({
  ...item,
  id: String(item.id),
  organizationId: String(item.organizationId),
});

export const departmentService = {
  // Método crucial para carregar a lista completa e permitir filtro no frontend
  getAll: async () => {
    const response = await api.get<any[]>("/departments/");
    return response.data.map(mapDepartment);
  },
  getByOrg: async (orgId: string) => {
    const response = await api.get<any[]>(
      `/departments/by-organization/${orgId}`,
    );
    return response.data.map(mapDepartment);
  },
  getOne: async (id: string) => {
    const response = await api.get<any>(`/departments/${id}`);
    return mapDepartment(response.data);
  },
  create: async (data: DepartmentCreate) => {
    const response = await api.post<any>("/departments/", data);
    return mapDepartment(response.data);
  },
  update: async (id: string, data: DepartmentUpdate) => {
    const response = await api.put<any>(`/departments/${id}`, data);
    return mapDepartment(response.data);
  },
  delete: async (id: string) => {
    await api.delete(`/departments/${id}`);
  },
};
