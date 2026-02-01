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
    DepartmentUpdate,
    Executive // Importe a interface Executive
} from '../types';

// --- Serviço de LegalOrganization ---
const legalOrgService = {
  getAll: () => api.get<LegalOrganization[]>('/legal-organizations/').then(res => res.data),
  getOne: (id: string) => api.get<LegalOrganization>(`/legal-organizations/${id}`).then(res => res.data),
  create: (data: LegalOrganizationCreate) => api.post<LegalOrganization>('/legal-organizations/', data).then(res => res.data),
  update: (id: string, data: LegalOrganizationUpdate) => api.put<LegalOrganization>(`/legal-organizations/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/legal-organizations/${id}`).then(res => res.data),
};

// --- Serviço de Organization (Empresas) ---
const orgService = {
  getAll: () => api.get<Organization[]>('/organizations/').then(res => res.data),
  getOne: (id: string) => api.get<Organization>(`/organizations/${id}`).then(res => res.data),
  create: (data: OrganizationCreate) => api.post<Organization>('/organizations/', data).then(res => res.data),
  update: (id: string, data: OrganizationUpdate) => api.put<Organization>(`/organizations/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/organizations/${id}`).then(res => res.data),
};

// --- Serviço de Department ---
const deptService = {
  getByOrg: (orgId: string) => api.get<Department[]>(`/departments/by-organization/${orgId}`).then(res => res.data),
  getOne: (id: string) => api.get<Department>(`/departments/${id}`).then(res => res.data),
  create: (data: DepartmentCreate) => api.post<Department>('/departments/', data).then(res => res.data),
  update: (id: string, data: DepartmentUpdate) => api.put<Department>(`/departments/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/departments/${id}`).then(res => res.data),
};

// --- Serviço de Usuários ---
const userService = {
    getAll: () => api.get('/users/').then(res => res.data),
    create: (data: any) => api.post('/users/', data).then(res => res.data),
};

// --- Serviço de Executivos (NOVO) ---
// Adicionando endpoints CRUD para executivos
const executiveService = {
    getAll: () => api.get<Executive[]>('/users/?role=executive').then(res => res.data), // Ajuste a rota se for /executives/
    getOne: (id: string) => api.get<Executive>(`/users/${id}`).then(res => res.data),
    create: (data: any) => api.post<Executive>('/users/', { ...data, role: 'executive' }).then(res => res.data),
    update: (id: string, data: any) => api.put<Executive>(`/users/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
};

export const apiService = {
  legalOrganizations: legalOrgService,
  organizations: orgService,
  departments: deptService,
  users: userService,
  executives: executiveService, // Adicionado aqui
};