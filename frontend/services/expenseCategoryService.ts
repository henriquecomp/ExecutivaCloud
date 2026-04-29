import { api } from "./api";
import type { ExpenseCategory } from "../types";

const mapCategory = (item: Record<string, unknown>): ExpenseCategory => ({
  id: String(item.id),
  name: String(item.name ?? ""),
  color: String(item.color ?? "#64748b"),
  executiveId: String(item.executiveId ?? item.executive_id ?? ""),
});

interface ListParams {
  executiveId?: string;
}

export const expenseCategoryService = {
  getAll: async (params?: ListParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<Record<string, unknown>[]>(
      `/expense-categories/?${search.toString()}`,
    );
    return response.data.map(mapCategory);
  },

  create: async (data: Pick<ExpenseCategory, "name" | "color" | "executiveId">) => {
    const response = await api.post<Record<string, unknown>>("/expense-categories/", {
      name: data.name,
      color: data.color,
      executiveId: Number(data.executiveId),
    });
    return mapCategory(response.data as Record<string, unknown>);
  },

  update: async (id: string, data: Partial<Pick<ExpenseCategory, "name" | "color">>) => {
    const response = await api.put<Record<string, unknown>>(
      `/expense-categories/${Number(id)}`,
      {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.color != null ? { color: data.color } : {}),
      },
    );
    return mapCategory(response.data as Record<string, unknown>);
  },

  delete: async (id: string) => {
    await api.delete(`/expense-categories/${Number(id)}`);
  },
};
