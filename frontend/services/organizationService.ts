import { api } from "./api";
import { Organization, OrganizationCreate, OrganizationUpdate } from "../types";

const mapOrganization = (item: any): Organization => ({
  ...item,
  id: String(item.id),
  legalOrganizationId:
    item.legalOrganizationId != null ? String(item.legalOrganizationId) : undefined,
});

export const organizationService = {
  getAll: async () => {
    // Garante retorno de array mesmo que a API use paginação padrão
    const response = await api.get<any[]>(
      "/organizations/?skip=0&limit=1000",
    );
    return response.data.map(mapOrganization);
  },

  getOne: async (id: string) => {
    const response = await api.get<any>(`/organizations/${id}`);
    return mapOrganization(response.data);
  },

  create: async (data: OrganizationCreate) => {
    const response = await api.post<any>("/organizations/", data);
    return mapOrganization(response.data);
  },

  update: async (id: string, data: OrganizationUpdate) => {
    const response = await api.put<any>(`/organizations/${id}`, data);
    return mapOrganization(response.data);
  },
  delete: async (id: string) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },
};
