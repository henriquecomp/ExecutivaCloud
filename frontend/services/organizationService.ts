import { api } from "./api";
import { Organization, OrganizationCreate, OrganizationUpdate } from "../types";

export const organizationService = {
  getAll: async () => {
    // Garante retorno de array mesmo que a API use paginação padrão
    const response = await api.get<Organization[]>(
      "/organizations/?skip=0&limit=1000",
    );
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  create: async (data: OrganizationCreate) => {
    const response = await api.post<Organization>("/organizations/", data);
    return response.data;
  },

  update: async (id: string, data: OrganizationUpdate) => {
    const response = await api.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },
};
