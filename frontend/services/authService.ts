import { User } from '../types';
import { api, setAuthToken } from './api';

const TOKEN_KEY = 'accessToken';

export interface ApiCurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  legalOrganizationId?: number | null;
  organizationId?: number | null;
  executiveId?: number | null;
  secretaryId?: string | null;
  needsProfileCompletion?: boolean;
}

export interface TokenPayload {
  accessToken: string;
  tokenType: string;
  user: ApiCurrentUser;
}

export interface RegisterOrganizationPayload {
  legalName: string;
  legalCnpj?: string;
  legalStreet?: string;
  legalNumber?: string;
  legalNeighborhood?: string;
  legalCity?: string;
  legalState?: string;
  legalZipCode?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export function mapApiUserToAppUser(apiUser: ApiCurrentUser): User {
  const id = String(apiUser.id);
  const base = {
    id,
    fullName: apiUser.fullName,
    email: apiUser.email,
    needsProfileCompletion: Boolean(apiUser.needsProfileCompletion),
  };
  switch (apiUser.role) {
    case 'master':
      return { ...base, role: 'master' };
    case 'admin_legal_organization':
      return {
        ...base,
        role: 'admin',
        legalOrganizationId:
          apiUser.legalOrganizationId != null ? String(apiUser.legalOrganizationId) : undefined,
      };
    case 'admin_company':
      return {
        ...base,
        role: 'admin',
        organizationId: apiUser.organizationId != null ? String(apiUser.organizationId) : undefined,
      };
    case 'executive':
      return {
        ...base,
        role: 'executive',
        executiveId: apiUser.executiveId != null ? String(apiUser.executiveId) : undefined,
      };
    case 'secretary':
      return {
        ...base,
        role: 'secretary',
        secretaryId: apiUser.secretaryId ?? undefined,
      };
    default:
      return { ...base, role: 'executive' };
  }
}

export function persistToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function loginRequest(email: string, password: string): Promise<TokenPayload> {
  const { data } = await api.post<TokenPayload>('/auth/login', { email, password });
  persistToken(data.accessToken);
  return data;
}

export async function fetchMe(): Promise<ApiCurrentUser> {
  const { data } = await api.get<ApiCurrentUser>('/auth/me');
  return data;
}

export async function registerOrganization(
  payload: RegisterOrganizationPayload,
): Promise<TokenPayload> {
  const { data } = await api.post<TokenPayload>('/auth/register-organization', payload);
  persistToken(data.accessToken);
  return data;
}

export function logoutAuth() {
  persistToken(null);
}

export async function fetchInviteStatus(token: string): Promise<{ valid: boolean }> {
  const { data } = await api.get<{ valid: boolean }>('/auth/invite-status', { params: { token } });
  return data;
}

export async function completeInvite(
  token: string,
  password: string,
  passwordConfirm: string,
): Promise<TokenPayload> {
  const { data } = await api.post<TokenPayload>('/auth/complete-invite', {
    token,
    password,
    passwordConfirm,
  });
  persistToken(data.accessToken);
  return data;
}

export async function inviteUser(payload: {
  fullName: string;
  email: string;
  emailConfirm: string;
  invitedRole: 'admin_company' | 'executive' | 'secretary';
  organizationId?: string | number | null;
}): Promise<{ userId: number; message: string }> {
  const { data } = await api.post<{ userId: number; message: string }>('/auth/invite-user', {
    fullName: payload.fullName,
    email: payload.email,
    emailConfirm: payload.emailConfirm,
    invitedRole: payload.invitedRole,
    organizationId:
      payload.organizationId != null && String(payload.organizationId).trim() !== ''
        ? Number(payload.organizationId)
        : undefined,
  });
  return data;
}

export async function completeExecutiveProfile(body: Record<string, unknown>): Promise<ApiCurrentUser> {
  const { data } = await api.post<ApiCurrentUser>('/auth/complete-profile/executive', body);
  return data;
}

export async function completeSecretaryProfile(body: Record<string, unknown>): Promise<ApiCurrentUser> {
  const { data } = await api.post<ApiCurrentUser>('/auth/complete-profile/secretary', body);
  return data;
}

/** Hidrata axios com token já salvo (importar uma vez no arranque da app). */
export function hydrateAuthHeader() {
  const t = getStoredToken();
  if (t) setAuthToken(t);
}
