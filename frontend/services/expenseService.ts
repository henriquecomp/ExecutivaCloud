import { api } from "./api";
import type { Expense, ExpenseEntityType, ExpenseStatus, ExpenseType } from "../types";

const mapExpense = (item: Record<string, unknown>): Expense => {
  const amount = item.amount;
  const num =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? parseFloat(amount)
        : Number(amount);
  return {
    id: String(item.id),
    description: String(item.description ?? ""),
    amount: Number.isFinite(num) ? num : 0,
    expenseDate: String(item.expenseDate ?? item.expense_date ?? "").slice(0, 10),
    type: (item.type ?? item.entry_type) as ExpenseType,
    entityType: (item.entityType ?? item.entity_type) as ExpenseEntityType,
    categoryId:
      item.categoryId != null
        ? String(item.categoryId)
        : item.expense_category_id != null
          ? String(item.expense_category_id)
          : undefined,
    status: item.status as ExpenseStatus,
    receiptUrl:
      item.receiptUrl != null
        ? String(item.receiptUrl)
        : item.receipt_url != null
          ? String(item.receipt_url)
          : undefined,
    executiveId: String(item.executiveId ?? item.executive_id ?? ""),
  };
};

interface ListParams {
  executiveId?: string;
}

export function expenseToPayload(expense: Partial<Expense>): Record<string, unknown> {
  const executiveId = expense.executiveId != null ? Number(expense.executiveId) : undefined;
  const rawCat = expense.categoryId;
  const categoryId =
    rawCat != null && String(rawCat).trim() !== "" ? Number(rawCat) : null;
  return {
    description: expense.description,
    amount: expense.amount != null ? Number(expense.amount) : undefined,
    expenseDate: expense.expenseDate,
    type: expense.type,
    entityType: expense.entityType,
    status: expense.status,
    executiveId,
    categoryId: categoryId ?? null,
    receiptUrl: expense.receiptUrl ?? null,
  };
}

export const expenseService = {
  getAll: async (params?: ListParams) => {
    const search = new URLSearchParams({ skip: "0", limit: "1000" });
    if (params?.executiveId) {
      search.append("executive_id", String(Number(params.executiveId)));
    }
    const response = await api.get<Record<string, unknown>[]>(`/expenses/?${search.toString()}`);
    return response.data.map(mapExpense);
  },

  create: async (data: Partial<Expense>) => {
    const response = await api.post<Record<string, unknown>>("/expenses/", expenseToPayload(data));
    return mapExpense(response.data as Record<string, unknown>);
  },

  update: async (id: string, data: Partial<Expense>) => {
    const response = await api.put<Record<string, unknown>>(
      `/expenses/${Number(id)}`,
      expenseToPayload(data),
    );
    return mapExpense(response.data as Record<string, unknown>);
  },

  delete: async (id: string) => {
    await api.delete(`/expenses/${Number(id)}`);
  },
};
