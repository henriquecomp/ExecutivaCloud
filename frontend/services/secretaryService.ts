import { Secretary } from '../types';
import { api } from './api';

function mapRow(row: Record<string, unknown>): Secretary {
  const executiveIds = Array.isArray(row.executiveIds)
    ? (row.executiveIds as unknown[]).map((x) => String(x))
    : [];
  const organizationId =
    row.organizationId != null && String(row.organizationId).trim() !== ''
      ? String(row.organizationId)
      : undefined;
  return {
    ...(row as unknown as Secretary),
    id: String(row.id),
    organizationId,
    executiveIds,
  };
}

export const secretaryService = {
  getAll: async (): Promise<Secretary[]> => {
    const { data } = await api.get<Record<string, unknown>[]>('/secretaries/');
    return data.map(mapRow);
  },

  getOne: async (id: string): Promise<Secretary> => {
    const { data } = await api.get<Record<string, unknown>>(`/secretaries/${id}`);
    return mapRow(data);
  },

  create: async (payload: Partial<Secretary>): Promise<Secretary> => {
    const { data } = await api.post<Record<string, unknown>>('/secretaries/', payload);
    return mapRow(data);
  },

  update: async (id: string, payload: Partial<Secretary>): Promise<Secretary> => {
    const { data } = await api.put<Record<string, unknown>>(`/secretaries/${id}`, payload);
    return mapRow(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/secretaries/${id}`);
  },
};
