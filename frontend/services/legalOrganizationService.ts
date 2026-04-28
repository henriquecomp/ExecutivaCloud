import { api } from "./api";
import {
  LegalOrganization,
  LegalOrganizationCreate,
  LegalOrganizationUpdate,
} from "../types";

const mapLegalOrganization = (item: any): LegalOrganization => ({
  ...item,
  id: String(item.id),
});

export const legalOrganizationService = {
  getAll: async () => {
    const response = await api.get<any[]>(
      "/legal-organizations/?skip=0&limit=1000",
    );
    return response.data.map(mapLegalOrganization);
  },
  getOne: async (id: string) => {
    const response = await api.get<any>(
      `/legal-organizations/${id}`,
    );
    return mapLegalOrganization(response.data);
  },
  create: async (data: LegalOrganizationCreate) => {
    const response = await api.post<any>(
      "/legal-organizations/",
      data,
    );
    return mapLegalOrganization(response.data);
  },
  update: async (id: string, data: LegalOrganizationUpdate) => {
    const response = await api.put<any>(
      `/legal-organizations/${id}`,
      data,
    );
    return mapLegalOrganization(response.data);
  },
  delete: async (id: string) => {
    const response = await api.delete(`/legal-organizations/${id}`);
    return response.data;
  },
};
