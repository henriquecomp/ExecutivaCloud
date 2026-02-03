import { api } from "./api";
import {
  LegalOrganization,
  LegalOrganizationCreate,
  LegalOrganizationUpdate,
} from "../types";

export const legalOrganizationService = {
  getAll: async () => {
    const response = await api.get<LegalOrganization[]>(
      "/legal-organizations/",
    );
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get<LegalOrganization>(
      `/legal-organizations/${id}`,
    );
    return response.data;
  },
  create: async (data: LegalOrganizationCreate) => {
    const response = await api.post<LegalOrganization>(
      "/legal-organizations/",
      data,
    );
    return response.data;
  },
  update: async (id: string, data: LegalOrganizationUpdate) => {
    const response = await api.put<LegalOrganization>(
      `/legal-organizations/${id}`,
      data,
    );
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/legal-organizations/${id}`);
    return response.data;
  },
};
