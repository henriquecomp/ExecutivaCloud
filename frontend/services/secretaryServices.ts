import { api } from "./api";
import { Secretary } from "../types";

export const secretaryService = {
  getAll: async (skip: number = 0, limit: number = 1000) => {
    const response = await api.get<Secretary[]>(
      `/secretaries/?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: string | number) => {
    const response = await api.get<Secretary>(`/secretaries/${id}`);
    return response.data;
  },

  create: async (data: Partial<Secretary>) => {
    const response = await api.post<Secretary>("/secretaries/", data);
    return response.data;
  },

  update: async (id: string | number, data: Partial<Secretary>) => {
    const response = await api.put<Secretary>(`/secretaries/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/secretaries/${id}`);
    return response.data;
  },
};