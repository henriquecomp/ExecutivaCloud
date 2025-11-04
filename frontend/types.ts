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
  id: string; // UUID
  fullName: string;
  
  // Bloco 1: Identificação Pessoal
  cpf?: string;
  rg?: string;
  rgIssuer?: string; // Órgão emissor
  rgIssueDate?: string; // Data de expedição
  birthDate?: string; // (already exists)
  nationality?: string;
  placeOfBirth?: string; // Naturalidade
  motherName?: string;
  fatherName?: string;
  civilStatus?: string;

  // Bloco 2: Informações de Contato
  workEmail?: string; // (already exists)
  workPhone?: string; // (already exists)
  extension?: string; // (already exists)
  personalEmail?: string; // (already exists)
  personalPhone?: string; // (already exists)
  address?: string; // Endereço Residencial Completo
  linkedinProfileUrl?: string; // (already exists)

  // Bloco 3: Dados Profissionais e Corporativos
  jobTitle?: string; // (already exists)
  organizationId?: string; // (already exists)
  departmentId?: string; // (already exists)
  costCenter?: string; // Centro de Custo
  employeeId?: string; // (already exists)
  reportsToExecutiveId?: string; // (already exists)
  hireDate?: string; // (already exists)
  workLocation?: string; // (already exists)
  
  // Bloco 4: Perfil Público
  photoUrl?: string; // (already exists)
  bio?: string; // (already exists)
  education?: string; // (already exists)
  languages?: string; // (already exists)

  // Bloco 5: Dados de Emergência e Dependentes
  emergencyContactName?: string; // (already exists)
  emergencyContactPhone?: string; // (already exists)
  emergencyContactRelation?: string; // (already exists)
  dependentsInfo?: string;

  // Bloco 6: Dados Financeiros e de Acesso
  bankInfo?: string;
  compensationInfo?: string;
  systemAccessLevels?: string;
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
  role: UserRole;
  organizationId?: string; // for admin of a specific company
  legalOrganizationId?: string; // for admin of a legal organization
  executiveId?: string;    // for executive
  secretaryId?: string;    // for secretary
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

// FIX: Add missing 'Appointment' type to resolve compilation error in components/AppointmentsView.tsx.
export interface Appointment {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
}

export interface ContactType {
    id: string; // UUID
    name: string;
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
export type View = 'dashboard' | 'executives' | 'agenda' | 'contacts' | 'finances' | 'legalOrganizations' | 'organizations' | 'settings' | 'tasks' | 'secretaries' | 'reports' | 'documents';

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