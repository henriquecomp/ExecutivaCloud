import React from 'react';
import { SidebarNavItem } from './SidebarNavItem';
import {
  DashboardIcon,
  ExecutivesIcon,
  CalendarIcon,
  ContactsIcon,
  ExpensesIcon,
  OrganizationsIcon,
  TasksIcon,
  SecretariesIcon,
  DocumentsIcon,
  BriefcaseIcon,
  UserIcon,
} from '../Icons';

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { view: 'dashboard', label: 'Painel', icon: <DashboardIcon className="w-6 h-6" /> },
  { view: 'legalOrganizations', label: 'Organizações', icon: <BriefcaseIcon className="w-6 h-6" /> },
  { view: 'organizations', label: 'Empresas', icon: <OrganizationsIcon className="w-6 h-6" /> },
  { view: 'executives', label: 'Executivos', icon: <ExecutivesIcon className="w-6 h-6" /> },
  { view: 'secretaries', label: 'Secretárias', icon: <SecretariesIcon className="w-6 h-6" /> },
  { view: 'userManagement', label: 'Usuários', icon: <UserIcon className="w-6 h-6" /> },
  { view: 'agenda', label: 'Agenda', icon: <CalendarIcon className="w-6 h-6" /> },
  { view: 'documents', label: 'Documentos', icon: <DocumentsIcon className="w-6 h-6" /> },
  { view: 'contacts', label: 'Contatos', icon: <ContactsIcon className="w-6 h-6" /> },
  { view: 'finances', label: 'Finanças', icon: <ExpensesIcon className="w-6 h-6" /> },
  { view: 'tasks', label: 'Tarefas', icon: <TasksIcon className="w-6 h-6" /> },
];
