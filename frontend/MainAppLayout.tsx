import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Executive,
  Organization,
  Event,
  EventType,
  Contact,
  ContactType,
  Expense,
  View,
  Task,
  Department,
  Secretary,
  User,
  Document,
  DocumentCategory,
  ExpenseCategory,
  LegalOrganization,
  LayoutView,
} from './types';
import ViewSwitcher from './components/ViewSwitcher';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExecutivesView from './components/ExecutivesView';
import OrganizationsView from './components/OrganizationsView';
import AgendaView from './components/AgendaView';
import ContactsView from './components/ContactsView';
import FinancesView from './components/ExpensesView';
import TasksView from './components/TasksView';
import SecretariesView from './components/SecretariesView';
import UserManagementView from './components/UserManagementView';
import UserMenu from './components/UserMenu';
import ExecutiveProfileModal from './components/ExecutiveProfileModal';
import SecretaryProfileModal from './components/SecretaryProfileModal';
import DocumentsView from './components/DocumentsView';
import LegalOrganizationsView from './components/LegalOrganizationsView';
import ReportProblemModal from './components/ReportProblemModal';
import { ExclamationTriangleIcon } from './components/Icons';
import { legalOrganizationService } from './services/legalOrganizationService';
import { organizationService } from './services/organizationService';
import { departmentService } from './services/departmentService';
import { executiveService } from './services/executiveService';
import { eventTypeService } from './services/eventTypeService';
import { eventService } from './services/eventService';
import { documentCategoryService } from './services/documentCategoryService';
import { documentService } from './services/documentService';
import { contactTypeService } from './services/contactTypeService';
import { contactService } from './services/contactService';
import { taskService } from './services/taskService';
import { secretaryService } from './services/secretaryService';
import { expenseService } from './services/expenseService';
import { expenseCategoryService } from './services/expenseCategoryService';

export interface MainAppLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
}

const MainAppLayout: React.FC<MainAppLayoutProps> = ({ currentUser, onLogout, onUserUpdated }) => {
  const [executiveProfileOpen, setExecutiveProfileOpen] = useState(false);
  const [secretaryProfileOpen, setSecretaryProfileOpen] = useState(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>(() =>
    currentUser.role === 'secretary' ? 'executives' : 'dashboard',
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutView>('table');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [legalOrganizations, setLegalOrganizations] = useState<LegalOrganization[]>([]);

  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string | null>(null);

  const [executives, setExecutives] = useState<Executive[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifiedEventIds, setNotifiedEventIds] = useState<Set<string>>(new Set());

  const loadCoreData = useCallback(async (isStale?: () => boolean) => {
    const stale = () => isStale?.() ?? false;
    try {
      const legalOrgsRes = await legalOrganizationService.getAll();
      if (stale()) return;
      setLegalOrganizations(legalOrgsRes);

      const orgsRes = await organizationService.getAll();
      if (stale()) return;
      setOrganizations(orgsRes);

      let allDepts: Department[] = [];
      if (orgsRes.length > 0) {
        const deptPromises = orgsRes.map((org) => departmentService.getByOrg(org.id));
        const deptResponses = await Promise.all(deptPromises);
        deptResponses.forEach((res) => {
          allDepts = [...allDepts, ...res];
        });
      }
      if (stale()) return;
      setDepartments(allDepts);

      const executivesData = await executiveService.getAll(0, 1000);
      if (stale()) return;
      setExecutives(executivesData);

      const secretariesData = await secretaryService.getAll();
      if (stale()) return;
      setSecretaries(secretariesData);
    } catch (error) {
      if (!stale()) {
        console.error('Erro ao carregar núcleo (organizações/executivos):', error);
      }
    }
  }, []);

  const loadAllSecondaryLists = useCallback(async (isStale?: () => boolean) => {
    const stale = () => isStale?.() ?? false;
    try {
      const [
        eventTypesData,
        eventsData,
        contactTypesData,
        contactsData,
        tasksData,
        documentCategoriesData,
        documentsData,
        expensesData,
        expenseCategoriesData,
      ] = await Promise.all([
        eventTypeService.getAll(),
        eventService.getAll(),
        contactTypeService.getAll(),
        contactService.getAll(),
        taskService.getAll(),
        documentCategoryService.getAll(),
        documentService.getAll(),
        expenseService.getAll(),
        expenseCategoryService.getAll(),
      ]);
      if (stale()) return;
      setEventTypes(eventTypesData);
      setEvents(eventsData);
      setContactTypes(contactTypesData);
      setContacts(contactsData);
      setTasks(tasksData);
      setDocumentCategories(documentCategoriesData);
      setDocuments(documentsData);
      setExpenses(expensesData);
      setExpenseCategories(expenseCategoriesData);
    } catch (error) {
      if (!stale()) {
        console.error('Erro ao carregar listas secundárias:', error);
      }
    }
  }, []);


  const loadViewDataset = useCallback(
    async (view: View, executiveId: string | null, isStale?: () => boolean) => {
      const stale = () => isStale?.() ?? false;
      try {
        switch (view) {
          case 'dashboard': {
            if (executiveId) {
              const [ev, exps, ecats] = await Promise.all([
                eventService.getAll({ executiveId }),
                expenseService.getAll({ executiveId }),
                expenseCategoryService.getAll({ executiveId }),
              ]);
              if (!stale()) {
                setEvents(ev);
                setExpenses(exps);
                setExpenseCategories(ecats);
              }
            } else if (!stale()) {
              setEvents([]);
              setExpenses([]);
              setExpenseCategories([]);
            }
            break;
          }
          case 'agenda': {
            const eventTypesData = await eventTypeService.getAll();
            if (stale()) return;
            setEventTypes(eventTypesData);
            if (executiveId) {
              const ev = await eventService.getAll({ executiveId });
              if (!stale()) setEvents(ev);
            } else if (!stale()) {
              setEvents([]);
            }
            break;
          }
          case 'contacts': {
            const contactTypesData = await contactTypeService.getAll();
            if (stale()) return;
            setContactTypes(contactTypesData);
            if (executiveId) {
              const list = await contactService.getAll({ executiveId });
              if (!stale()) setContacts(list);
            } else if (!stale()) {
              setContacts([]);
            }
            break;
          }
          case 'tasks': {
            if (executiveId) {
              const list = await taskService.getAll({ executiveId });
              if (!stale()) setTasks(list);
            } else if (!stale()) {
              setTasks([]);
            }
            break;
          }
          case 'documents': {
            const cats = await documentCategoryService.getAll();
            if (stale()) return;
            setDocumentCategories(cats);
            if (executiveId) {
              const list = await documentService.getAll({ executiveId });
              if (!stale()) setDocuments(list);
            } else if (!stale()) {
              setDocuments([]);
            }
            break;
          }
          case 'finances': {
            if (executiveId) {
              const [list, ecats] = await Promise.all([
                expenseService.getAll({ executiveId }),
                expenseCategoryService.getAll({ executiveId }),
              ]);
              if (!stale()) {
                setExpenses(list);
                setExpenseCategories(ecats);
              }
            } else if (!stale()) {
              setExpenses([]);
              setExpenseCategories([]);
            }
            break;
          }
          default:
            break;
        }
      } catch (error) {
        if (!stale()) {
          console.error('Erro ao carregar dados da tela:', error);
        }
      }
    },
    [loadAllSecondaryLists],
  );

  const refreshAfterMutation = useCallback(async () => {
    const stale = () => false;
    await loadCoreData(stale);
    await loadViewDataset(currentView, selectedExecutiveId, stale);
  }, [currentView, selectedExecutiveId, loadCoreData, loadViewDataset]);

  useEffect(() => {
    let cancelled = false;
    const stale = () => cancelled;
    void loadCoreData(stale);
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, loadCoreData]);

  useEffect(() => {
    let cancelled = false;
    const stale = () => cancelled;
    void loadViewDataset(currentView, selectedExecutiveId, stale);
    return () => {
      cancelled = true;
    };
  }, [currentView, selectedExecutiveId, loadViewDataset]);

  const visibleExecutives = useMemo(() => {
    switch (currentUser.role) {
      case 'master':
        return executives;
      case 'admin':
        if (currentUser.legalOrganizationId) {
          const orgIdsForLegalOrg = organizations
            .filter((o) => o.legalOrganizationId === currentUser.legalOrganizationId)
            .map((o) => o.id);
          return executives.filter((e) => e.organizationId && orgIdsForLegalOrg.includes(e.organizationId));
        }
        if (currentUser.organizationId) {
          return executives.filter((e) => e.organizationId === currentUser.organizationId);
        }
        return [];
      case 'secretary': {
        const secretary = secretaries.find((s) => s.id === currentUser.secretaryId);
        if (!secretary) return [];
        return executives.filter((e) => secretary.executiveIds.includes(e.id));
      }
      case 'executive':
        return executives.filter((e) => e.id === currentUser.executiveId);
      default:
        return [];
    }
  }, [currentUser, executives, secretaries, organizations]);

  useEffect(() => {
    if (currentUser.role === 'executive') {
      setSelectedExecutiveId(currentUser.executiveId || null);
    } else {
      const isSelectionValid = visibleExecutives.some((e) => e.id === selectedExecutiveId);
      if (!isSelectionValid) {
        setSelectedExecutiveId(visibleExecutives.length > 0 ? visibleExecutives[0].id : null);
      }
    }
  }, [currentUser, visibleExecutives, selectedExecutiveId]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      events.forEach((event) => {
        if (event.reminderMinutes && !notifiedEventIds.has(event.id)) {
          const eventStartTime = new Date(event.startTime);
          const reminderTime = new Date(eventStartTime.getTime() - event.reminderMinutes * 60 * 1000);

          if (now >= reminderTime && now < eventStartTime) {
            const executive = executives.find((e) => e.id === event.executiveId);
            const title = `Lembrete: ${event.title}`;
            const options = {
              body: `O evento de ${executive?.fullName || 'um executivo'} começa às ${eventStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
              icon: '/vite.svg',
            };

            new Notification(title, options);
            setNotifiedEventIds((prev) => new Set(prev).add(event.id));
          }
        }
      });
    };

    const intervalId = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(intervalId);
  }, [events, executives, notifiedEventIds]);

  const selectedExecutive = useMemo(
    () => executives.find((e) => e.id === selectedExecutiveId),
    [executives, selectedExecutiveId],
  );

  const filteredEvents = useMemo(() => events.filter((e) => e.executiveId === selectedExecutiveId), [events, selectedExecutiveId]);
  const filteredContacts = useMemo(() => contacts.filter((c) => c.executiveId === selectedExecutiveId), [contacts, selectedExecutiveId]);
  const filteredFinances = useMemo(() => expenses.filter((ex) => ex.executiveId === selectedExecutiveId), [expenses, selectedExecutiveId]);
  const filteredTasks = useMemo(() => tasks.filter((t) => t.executiveId === selectedExecutiveId), [tasks, selectedExecutiveId]);
  const filteredDocuments = useMemo(() => documents.filter((d) => d.executiveId === selectedExecutiveId), [documents, selectedExecutiveId]);

  const viewTitles: Record<View, string> = {
    dashboard: 'Painel',
    legalOrganizations: 'Organizações',
    organizations: 'Empresas',
    executives: 'Executivos',
    secretaries: 'Secretárias',
    userManagement: 'Usuários',
    agenda: 'Agenda',
    contacts: 'Contatos',
    finances: 'Finanças',
    tasks: 'Tarefas',
    documents: 'Documentos',
  };

  const renderView = () => {
    if (['agenda', 'contacts', 'finances', 'tasks', 'documents'].includes(currentView) && !selectedExecutiveId && currentUser.role !== 'executive') {
      return (
        <div className="text-center p-10 bg-white rounded-lg shadow-md max-w-lg mx-auto">
          <h3 className="text-xl font-semibold text-slate-800">Selecione um Executivo</h3>
          <p className="text-slate-500 mt-2">Por favor, selecione um executivo no menu superior para visualizar os dados correspondentes.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            executives={visibleExecutives}
            events={events}
            expenses={expenses}
            selectedExecutive={selectedExecutive}
            organizations={organizations}
            departments={departments}
            expenseCategories={expenseCategories}
          />
        );
      case 'legalOrganizations':
        return (
          <LegalOrganizationsView
            layout={layout}
            currentUser={currentUser}
            legalOrganizations={legalOrganizations}
            setLegalOrganizations={setLegalOrganizations}
            organizations={organizations}
            setOrganizations={setOrganizations}
            departments={departments}
            setDepartments={setDepartments}
            executives={executives}
            setExecutives={setExecutives}
            secretaries={secretaries}
            setSecretaries={setSecretaries}
            setEvents={setEvents}
            setContacts={setContacts}
            setExpenses={setExpenses}
            setTasks={setTasks}
            setDocuments={setDocuments}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'executives':
        return <ExecutivesView layout={layout} />;
      case 'organizations':
        return (
          <OrganizationsView
            layout={layout}
            currentUser={currentUser}
            organizations={organizations}
            setOrganizations={setOrganizations}
            departments={departments}
            setDepartments={setDepartments}
            executives={executives}
            setExecutives={setExecutives}
            secretaries={secretaries}
            setSecretaries={setSecretaries}
            setEvents={setEvents}
            setContacts={setContacts}
            setExpenses={setExpenses}
            setTasks={setTasks}
            setDocuments={setDocuments}
            legalOrganizations={legalOrganizations}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'secretaries':
        return (
          <SecretariesView
            layout={layout}
            secretaries={secretaries}
            setSecretaries={setSecretaries}
            executives={executives}
            currentUser={currentUser}
            organizations={organizations}
            departments={departments}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'userManagement':
        return (
          <UserManagementView
            layout={layout}
            currentUser={currentUser}
            organizations={organizations}
            legalOrganizations={legalOrganizations}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            layout={layout}
            events={filteredEvents}
            setEvents={setEvents}
            eventTypes={eventTypes}
            setEventTypes={setEventTypes}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'contacts':
        return (
          <ContactsView
            layout={layout}
            contacts={filteredContacts}
            contactTypes={contactTypes}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'finances':
        return (
          <FinancesView
            layout={layout}
            expenses={filteredFinances}
            expenseCategories={expenseCategories}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'tasks':
        return (
          <TasksView layout={layout} tasks={filteredTasks} executiveId={selectedExecutiveId!} onRefresh={refreshAfterMutation} />
        );
      case 'documents':
        return (
          <DocumentsView
            layout={layout}
            documents={filteredDocuments}
            setDocuments={setDocuments}
            documentCategories={documentCategories}
            setDocumentCategories={setDocumentCategories}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      default:
        return (
          <Dashboard
            executives={visibleExecutives}
            events={events}
            expenses={expenses}
            selectedExecutive={selectedExecutive}
            organizations={organizations}
            departments={departments}
            expenseCategories={expenseCategories}
          />
        );
    }
  };

  const BurgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar currentUser={currentUser} currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/60 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-600 hover:text-slate-900" aria-label="Abrir menu">
              <BurgerIcon />
            </button>
            <h1 className="text-xl font-bold text-slate-700 capitalize hidden sm:block">{viewTitles[currentView]}</h1>
          </div>

          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' && (
              <ViewSwitcher layout={layout} setLayout={setLayout} />
            )}
            <div className="w-full sm:max-w-xs md:max-w-sm">
              <select
                aria-label="Selecionar Executivo"
                value={selectedExecutiveId || ''}
                onChange={(e) => setSelectedExecutiveId(e.target.value || null)}
                disabled={currentUser.role === 'executive'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Selecione um Executivo --</option>
                {visibleExecutives.map((exec) => {
                  const org = organizations.find((o) => o.id === exec.organizationId);
                  const dept = departments.find((d) => d.id === exec.departmentId);
                  const orgDeptString = org ? `${org.name}${dept ? ` / ${dept.name}` : ''}` : '';
                  return (
                    <option key={exec.id} value={exec.id}>
                      {exec.fullName} {orgDeptString && `(${orgDeptString})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setReportProblemOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 transition-colors"
              title="Reportar um problema nesta tela"
              aria-label="Reportar um problema"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-700" />
              <span className="hidden sm:inline">Reportar problema</span>
            </button>

            <UserMenu
              user={currentUser}
              onLogout={onLogout}
              onOpenExecutiveProfile={() => setExecutiveProfileOpen(true)}
              onOpenSecretaryProfile={() => setSecretaryProfileOpen(true)}
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{renderView()}</div>
      </main>

      <ExecutiveProfileModal
        isOpen={executiveProfileOpen}
        onClose={() => setExecutiveProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />
      <SecretaryProfileModal
        isOpen={secretaryProfileOpen}
        onClose={() => setSecretaryProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />

      <ReportProblemModal
        isOpen={reportProblemOpen}
        onClose={() => setReportProblemOpen(false)}
        context="app"
        defaultEmail={currentUser.email}
        defaultName={currentUser.fullName}
        screenLabel={viewTitles[currentView]}
      />
    </div>
  );
};

export default MainAppLayout;
