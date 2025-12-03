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
  getOne: (id: string) => api.get<LegalOrganization>(`/legal-organizations/${id}`),
  create: (data: LegalOrganizationCreate) => api.post<LegalOrganization>('/legal-organizations/', data),
  update: (id: string, data: LegalOrganizationUpdate) => api.put<LegalOrganization>(`/legal-organizations/${id}`, data),
  delete: (id: string) => api.delete(`/legal-organizations/${id}`),
};

// --- Serviço de Organization (Empresas) ---
const orgService = {
  getAll: () => api.get<Organization[]>('/organizations/'),
  getOne: (id: string) => api.get<Organization>(`/organizations/${id}`),
  create: (data: OrganizationCreate) => api.post<Organization>('/organizations/', data),
  update: (id: string, data: OrganizationUpdate) => api.put<Organization>(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
};

// --- Serviço de Department ---
const deptService = {
  // O backend não tem "get all global", então buscamos por organização ou individualmente
  getByOrg: (orgId: string) => api.get<Department[]>(`/departments/by-organization/${orgId}`),
  getOne: (id: string) => api.get<Department>(`/departments/${id}`),
  create: (data: DepartmentCreate) => api.post<Department>('/departments/', data),
  update: (id: string, data: DepartmentUpdate) => api.put<Department>(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// --- Serviço de Usuários (Básico para Auth/Listagem) ---
const userService = {
    getAll: () => api.get('/users/'),
    create: (data: any) => api.post('/users/', data),
};

export const apiService = {
  legalOrganizations: legalOrgService,
  organizations: orgService,
  departments: deptService,
  users: userService,
};