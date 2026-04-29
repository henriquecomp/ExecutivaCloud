// types.ts

// NEW type for Legal Organizations
export interface LegalOrganization {
  id: string;
  name: string;
  cnpj?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Organization {
  id: string; // UUID
  name: string;
  legalOrganizationId?: string; // Link to the new LegalOrganization
  cnpj?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface Executive {
  id: string;
  fullName: string;
  
  // Bloco 1: Identificação Pessoal
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: string; // Date string YYYY-MM-DD
  birthDate?: string;    // Date string YYYY-MM-DD
  nationality?: string;
  placeOfBirth?: string;
  motherName?: string;
  fatherName?: string;
  civilStatus?: string;

  // Bloco 2: Informações de Contato
  workEmail: string; // Obrigatório
  workPhone?: string;
  extension?: string;
  personalEmail?: string;
  personalPhone?: string;
  street?: string; // Endereço
  linkedinProfileUrl?: string;

  // Bloco 3: Dados Profissionais
  jobTitle?: string;
  costCenter?: string;
  employeeId?: string;
  hireDate?: string; // Date string YYYY-MM-DD
  workLocation?: string;
  organizationId?: string;
  departmentId?: string;
  reportsToExecutiveId?: string;

  // Bloco 4: Perfil Público
  photoUrl?: string;
  bio?: string;
  education?: string;
  languages?: string;

  // Bloco 5: Emergência
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  dependentsInfo?: string;

  // Bloco 6: Financeiro e Acesso
  bankInfo?: string;
  compensationInfo?: string;
  systemAccessLevels?: string;

  // Relacionamentos para exibição na tabela
  organization?: Organization;
  department?: Department;
}

export interface Secretary {
  id: string; // UUID
  fullName: string;
  executiveIds: string[]; // Array of executive IDs

  // Bloco 1: Identificação Pessoal
  cpf?: string;
  rg?: string;
  rgIssuer?: string; // Órgão emissor
  rgIssueDate?: string; // Data de expedição
  birthDate?: string;
  nationality?: string;
  placeOfBirth?: string; // Naturalidade
  motherName?: string;
  fatherName?: string;
  civilStatus?: string;

  // Bloco 2: Informações de Contato
  workEmail?: string;
  workPhone?: string;
  extension?: string;
  personalEmail?: string;
  personalPhone?: string;
  address?: string; // Endereço Residencial Completo
  linkedinProfileUrl?: string;

  // Bloco 3: Dados Profissionais e Corporativos
  jobTitle?: string;
  organizationId?: string;
  departmentId?: string;
  costCenter?: string; // Centro de Custo
  employeeId?: string;
  reportsToExecutiveId?: string;
  hireDate?: string;
  workLocation?: string;
  systemAccessLevels?: string;
  
  // Bloco 4: Perfil Público
  photoUrl?: string;
  bio?: string;
  education?: string;
  languages?: string;

  // Bloco 5: Dados de Emergência e Dependentes
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  dependentsInfo?: string;

  // Bloco 6: Dados Financeiros e de Acesso
  bankInfo?: string;
  compensationInfo?: string;
}

export type UserRole = 'master' | 'admin' | 'secretary' | 'executive';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  organizationId?: string; // for admin of a specific company
  legalOrganizationId?: string; // for admin of a legal organization
  executiveId?: string;    // for executive
  secretaryId?: string;    // for secretary
  /** Primeiro acesso: completar cadastro de executivo/secretária */
  needsProfileCompletion?: boolean;
}

export interface EventType {
  id:string; // UUID
  name: string;
  color: string; // color_hex
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'annually';
  interval: number;
  daysOfWeek?: number[]; // 0 for Sunday, 1 for Monday, etc.
  endDate?: string; // YYYY-MM-DD
  count?: number;
}

export interface Event {
  id: string; // UUID
  title: string;
  description?: string;
  startTime: string; // ISO String for TIMESTAMPTZ
  endTime: string;   // ISO String for TIMESTAMPTZ
  location?: string;
  eventTypeId?: string; // UUID
  executiveId: string; // UUID
  reminderMinutes?: number;
  recurrenceId?: string;
  recurrence?: RecurrenceRule;
}

export interface ContactType {
    id: string; // UUID
    name: string;
    color: string;
}

export interface Contact {
  id: string; // UUID
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  contactTypeId?: string; // UUID
  executiveId: string; // UUID
}

export type ExpenseStatus = 'Pendente' | 'Pago' | 'Recebida';
export type ExpenseType = 'A pagar' | 'A receber';
export type ExpenseEntityType = 'Pessoa Física' | 'Pessoa Jurídica';

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  /** Escopo do executivo dono da categoria (API). */
  executiveId: string;
}

export interface Expense {
    id: string; // UUID
    description: string;
    amount: number;
    expenseDate: string; // YYYY-MM-DD
    type: ExpenseType;
    entityType: ExpenseEntityType;
    categoryId?: string;
    status: ExpenseStatus;
    receiptUrl?: string;
    executiveId: string; // UUID
}

// Views correspond to navigation items in the sidebar
export type View = 'dashboard' | 'executives' | 'agenda' | 'contacts' | 'finances' | 'legalOrganizations' | 'organizations' | 'settings' | 'tasks' | 'secretaries' | 'reports' | 'documents' | 'userManagement';

export enum Priority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

export enum Status {
  Todo = 'A Fazer',
  InProgress = 'Em Andamento',
  Done = 'Concluído',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: Status;
  executiveId: string; // UUID
  recurrenceId?: string;
  recurrence?: RecurrenceRule;
}

export interface DocumentCategory {
  id: string;
  name: string;
  /** Hex, ex.: #64748b */
  color: string;
}

export interface Document {
  id: string;
  name: string;
  imageUrl: string; // Base64 Data URL
  categoryId?: string;
  executiveId: string;
  uploadDate: string; // ISO String
}

export interface AllDataBackup {
  version: string;
  legalOrganizations: LegalOrganization[];
  organizations: Organization[];
  departments: Department[];
  executives: Executive[];
  secretaries: Secretary[];
  users: User[];
  eventTypes: EventType[];
  events: Event[];
  contactTypes: ContactType[];
  contacts: Contact[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  tasks: Task[];
  documentCategories: DocumentCategory[];
  documents: Document[];
}

export type LayoutView = 'card' | 'list' | 'table';

export type LegalOrganizationCreate = Omit<LegalOrganization, 'id'>;
export type LegalOrganizationUpdate = Partial<LegalOrganizationCreate>;

// Para Organization
// Nota: O backend schema 'OrganizationBase' exige 'legalOrganizationId'
// O frontend 'types.ts' o tem como opcional.
// Para consistência com o backend, tornamos obrigatório na criação.
export type OrganizationCreate = Omit<Organization, 'id'> & {
  legalOrganizationId: string;
};
export type OrganizationUpdate = Partial<OrganizationCreate>;

// Para Department
export type DepartmentCreate = Omit<Department, 'id'>;
export type DepartmentUpdate = Partial<DepartmentCreate>;