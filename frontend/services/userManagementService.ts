import { api } from './api';

export interface ManagedUserRow {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  role: string;
  legalOrganizationId: number | null;
  organizationId: number | null;
  executiveId: number | null;
  secretaryId: string | null;
  needsProfileCompletion: boolean;
}

function mapRow(raw: Record<string, unknown>): ManagedUserRow {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    fullName: String(r.fullName ?? r.name ?? ''),
    email: String(r.email ?? ''),
    phone: r.phone != null ? String(r.phone) : null,
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
    role: String(r.role ?? ''),
    legalOrganizationId:
      r.legalOrganizationId != null && r.legalOrganizationId !== ''
        ? Number(r.legalOrganizationId)
        : null,
    organizationId:
      r.organizationId != null && r.organizationId !== '' ? Number(r.organizationId) : null,
    executiveId: r.executiveId != null && r.executiveId !== '' ? Number(r.executiveId) : null,
    secretaryId: r.secretaryId != null ? String(r.secretaryId) : null,
    needsProfileCompletion: Boolean(r.needsProfileCompletion ?? r.needs_profile_completion ?? false),
  };
}

export async function listManagedUsers(params?: {
  q?: string;
  skip?: number;
  limit?: number;
}): Promise<{ items: ManagedUserRow[]; total: number }> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set('q', params.q.trim());
  if (params?.skip != null) search.set('skip', String(params.skip));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  const url = qs ? `/users/management/?${qs}` : '/users/management/';
  const { data } = await api.get<{ items: Record<string, unknown>[]; total: number }>(url);
  return {
    items: (data.items || []).map(mapRow),
    total: data.total ?? 0,
  };
}

export async function patchManagedUser(
  userId: number,
  body: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    isActive?: boolean;
    organizationId?: number;
  },
): Promise<ManagedUserRow> {
  const { data } = await api.patch<Record<string, unknown>>(`/users/management/${userId}`, body);
  return mapRow(data);
}

export async function deactivateManagedUser(userId: number): Promise<ManagedUserRow> {
  const { data } = await api.post<Record<string, unknown>>(`/users/management/${userId}/deactivate`);
  return mapRow(data);
}

export async function resendFirstAccessEmail(userId: number): Promise<string> {
  const { data } = await api.post<{ message: string }>(
    `/users/management/${userId}/resend-first-access`,
  );
  return data.message ?? 'E-mail enviado.';
}

export async function sendManagedUserPasswordReset(userId: number): Promise<string> {
  const { data } = await api.post<{ message: string }>(
    `/users/management/${userId}/send-password-reset`,
  );
  return data.message ?? 'E-mail enviado.';
}
