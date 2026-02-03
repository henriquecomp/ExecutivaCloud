import { api } from './api';
import { Executive } from '../types';

export const executiveService = {
  getAll: async (skip = 0, limit = 10) => {
    const response = await api.get<Executive[]>(`/executives/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  create: async (data: Partial<Executive>) => {
    const response = await api.post<Executive>('/executives/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Executive>) => {
    const response = await api.put<Executive>(`/executives/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/executives/${id}`);
    return response.data;
  }
};