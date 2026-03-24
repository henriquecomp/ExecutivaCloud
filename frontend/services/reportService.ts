import { api } from "./api";

export interface SavedReport {
  id: string;
  name: string;
  selectedExecutiveIds: string[];
  startDate?: string;
  endDate?: string;
  includeEvents: boolean;
  includeExpenses: boolean;
  includeTasks: boolean;
  includeContacts: boolean;
  totalRecords: number;
  generatedData: Array<Record<string, string | number | undefined>>;
  generatedAt: string;
}

const mapSavedReport = (item: any): SavedReport => ({
  ...item,
  id: String(item.id),
  selectedExecutiveIds: Array.isArray(item.selectedExecutiveIds)
    ? item.selectedExecutiveIds.map((id: number | string) => String(id))
    : [],
  generatedData: Array.isArray(item.generatedData) ? item.generatedData : [],
});

interface CreateReportPayload {
  name: string;
  selectedExecutiveIds: string[];
  startDate?: string;
  endDate?: string;
  includeEvents: boolean;
  includeExpenses: boolean;
  includeTasks: boolean;
  includeContacts: boolean;
  totalRecords: number;
  generatedData: Array<Record<string, string | number | undefined>>;
}

export const reportService = {
  getAll: async () => {
    const response = await api.get<any[]>("/reports/?skip=0&limit=1000");
    return response.data.map(mapSavedReport);
  },

  create: async (payload: CreateReportPayload) => {
    const normalizedPayload = {
      ...payload,
      selectedExecutiveIds: payload.selectedExecutiveIds.map((id) => Number(id)),
    };
    const response = await api.post<any>("/reports/", normalizedPayload);
    return mapSavedReport(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/reports/${Number(id)}`);
  },
};
