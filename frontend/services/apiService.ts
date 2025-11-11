import { api } from './api';
import { 
    LegalOrganization, 
    Organization, 
    Department, 
    LegalOrganizationCreate, 
    LegalOrganizationUpdate, 
    OrganizationCreate, 
    OrganizationUpdate, 
    DepartmentCreate, 
    DepartmentUpdate 
} from '../types';

// --- Serviço de LegalOrganization ---
const legalOrgService = {
  getAll: () => api.get<LegalOrganization[]>('/legal-organizations/'),
  // Nota: O frontend usa IDs como string ('org1'), mas o backend espera 'int'.
  // A API do FastAPI/Pydantic pode conseguir converter isso, mas é um ponto de atenção.
  getOne: (id: string) => api.get<LegalOrganization>(`/legal-organizations/${id}`),
  create: (data: LegalOrganizationCreate) => api.post<LegalOrganization>('/legal-organizations/', data),
  update: (id: string, data: LegalOrganizationUpdate) => api.put<LegalOrganization>(`/legal-organizations/${id}`, data),
  delete: (id: string) => api.delete(`/legal-organizations/${id}`),
};

// --- Serviço de Organization (Empresas) ---
const orgService = {
  getAll: () => api.get<Organization[]>('/organizations/'),
  create: (data: OrganizationCreate) => api.post<Organization>('/organizations/', data),
  update: (id: string, data: OrganizationUpdate) => api.put<Organization>(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
};

// --- Serviço de Department ---
const deptService = {
  getByOrg: (orgId: string) => api.get<Department[]>(`/departments/by-organization/${orgId}`),
  create: (data: DepartmentCreate) => api.post<Department>('/departments/', data),
  update: (id: string, data: DepartmentUpdate) => api.put<Department>(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const apiService = {
  legalOrganizations: legalOrgService,
  organizations: orgService,
  departments: deptService,
  // Adicione outros serviços (executives, users, etc.) aqui conforme necessário
};