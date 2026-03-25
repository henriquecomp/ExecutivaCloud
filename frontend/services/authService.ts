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
  const base = { id, fullName: apiUser.fullName, email: apiUser.email };
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

/** Hidrata axios com token já salvo (importar uma vez no arranque da app). */
export function hydrateAuthHeader() {
  const t = getStoredToken();
  if (t) setAuthToken(t);
}
