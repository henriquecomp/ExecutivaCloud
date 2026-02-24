import { api } from "./api";
import { Executive } from "../types";

export const executiveService = {
  // Ajustado default para 1000 para permitir paginação no frontend fluida
  getAll: async (skip: number = 0, limit: number = 1000) => {
    const response = await api.get<Executive[]>(
      `/executives/?skip=${skip}&limit=${limit}`,
    );
    return response.data;
  },

  create: async (data: Partial<Executive>) => {
    const response = await api.post<Executive>("/executives/", data);
    return response.data;
  },

  update: async (id: number, data: Partial<Executive>) => {
    const response = await api.put<Executive>(`/executives/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/executives/${id}`);
  },
};
