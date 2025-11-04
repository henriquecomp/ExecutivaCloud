import React, { useMemo } from 'react';
import { View, User } from '../types';
import { DashboardIcon, ExecutivesIcon, CalendarIcon, ContactsIcon, ExpensesIcon, OrganizationsIcon, SettingsIcon, LogoIcon, TasksIcon, SecretariesIcon, ReportsIcon, DocumentsIcon, BriefcaseIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, setCurrentView, isOpen, setOpen }) => {
  const appVersion = '1.3.0';

  const allNavItems: { view: View; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { view: 'dashboard', label: 'Painel', icon: <DashboardIcon className="w-6 h-6" /> },
    { view: 'legalOrganizations', label: 'Organizações', icon: <BriefcaseIcon className="w-6 h-6" /> },
    { view: 'organizations', label: 'Empresas', icon: <OrganizationsIcon className="w-6 h-6" /> },
    { view: 'executives', label: 'Executivos', icon: <ExecutivesIcon className="w-6 h-6" /> },
    { view: 'secretaries', label: 'Secretárias', icon: <SecretariesIcon className="w-6 h-6" /> },
    { view: 'agenda', label: 'Agenda', icon: <CalendarIcon className="w-6 h-6" /> },
    { view: 'documents', label: 'Documentos', icon: <DocumentsIcon className="w-6 h-6" /> },
    { view: 'contacts', label: 'Contatos', icon: <ContactsIcon className="w-6 h-6" /> },
    { view: 'finances', label: 'Finanças', icon: <ExpensesIcon className="w-6 h-6" /> },
    { view: 'tasks', label: 'Tarefas', icon: <TasksIcon className="w-6 h-6" /> },
    { view: 'reports', label: 'Relatórios', icon: <ReportsIcon className="w-6 h-6" /> },
    { view: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-6 h-6" /> },
  ], []);

  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'executive':
        const executiveViews: View[] = ['dashboard', 'agenda', 'documents', 'contacts', 'finances', 'tasks', 'reports', 'settings'];
        return allNavItems.filter(item => executiveViews.includes(item.view));
      case 'secretary':
        const secretaryHiddenViews: View[] = ['organizations', 'legalOrganizations'];
        return allNavItems.filter(item => !secretaryHiddenViews.includes(item.view));
      case 'admin':
        if (currentUser.organizationId) { // Admin for a specific company
          const adminHiddenViews: View[] = ['legalOrganizations'];
          return allNavItems.filter(item => !adminHiddenViews.includes(item.view));
        }
        return allNavItems; // Admin for legal org
      case 'master':
      default:
        return allNavItems;
    }
  }, [currentUser, allNavItems]);

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed lg:relative top-0 left-0 h-full bg-slate-800 text-white w-64 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-center p-6 border-b border-slate-700">
          <LogoIcon className="w-8 h-8" />
          <h1 className="text-xl font-bold ml-3">Executiva Cloud</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleNavItems.map(({ view, label, icon }) => (
            <a
              key={view}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(view);
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentView === view
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {icon}
              <span className="ml-4 capitalize">{label}</span>
            </a>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-700">
            <p className="text-xs text-slate-400">{`© ${new Date().getFullYear()} Executiva Cloud`}</p>
            <p className="text-xs text-slate-500 mt-1">{`Versão ${appVersion}`}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;