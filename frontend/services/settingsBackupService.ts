import { api } from "./api";
import { AllDataBackup } from "../types";

export interface SettingsBackup {
  id: string;
  name: string;
  version: string;
  data: Omit<AllDataBackup, "version">;
  createdAt: string;
}

const mapSettingsBackup = (item: any): SettingsBackup => ({
  id: String(item.id),
  name: item.name,
  version: item.version,
  data: item.data,
  createdAt: item.createdAt,
});

interface CreateSettingsBackupPayload {
  name: string;
  version: string;
  data: Omit<AllDataBackup, "version">;
}

export const settingsBackupService = {
  getAll: async () => {
    const response = await api.get<any[]>("/settings-backups/?skip=0&limit=1000");
    return response.data.map(mapSettingsBackup);
  },

  create: async (payload: CreateSettingsBackupPayload) => {
    const response = await api.post<any>("/settings-backups/", payload);
    return mapSettingsBackup(response.data);
  },

  delete: async (id: string) => {
    await api.delete(`/settings-backups/${Number(id)}`);
  },

  /** Persiste o conteúdo do backup nas tabelas do backend (substitui dados de negócio atuais). */
  restore: async (data: Omit<AllDataBackup, "version">) => {
    await api.post("/settings-backups/restore", data);
  },
};
