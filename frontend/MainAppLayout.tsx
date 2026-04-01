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
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExecutivesView from './components/ExecutivesView';
import OrganizationsView from './components/OrganizationsView';
import AgendaView from './components/AgendaView';
import ContactsView from './components/ContactsView';
import FinancesView from './components/ExpensesView';
import SettingsView from './components/SettingsView';
import TasksView from './components/TasksView';
import SecretariesView from './components/SecretariesView';
import ReportsView from './components/ReportsView';
import UserMenu from './components/UserMenu';
import DocumentsView from './components/DocumentsView';
import LegalOrganizationsView from './components/LegalOrganizationsView';
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

export interface MainAppLayoutProps {
  currentUser: User;
  onLogout: () => void;
}

const MainAppLayout: React.FC<MainAppLayoutProps> = ({ currentUser, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>(() =>
    currentUser.role === 'secretary' ? 'executives' : 'dashboard',
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
      const [eventTypesData, eventsData, contactTypesData, contactsData, tasksData, documentCategoriesData, documentsData] =
        await Promise.all([
          eventTypeService.getAll(),
          eventService.getAll(),
          contactTypeService.getAll(),
          contactService.getAll(),
          taskService.getAll(),
          documentCategoryService.getAll(),
          documentService.getAll(),
        ]);
      if (stale()) return;
      setEventTypes(eventTypesData);
      setEvents(eventsData);
      setContactTypes(contactTypesData);
      setContacts(contactsData);
      setTasks(tasksData);
      setDocumentCategories(documentCategoriesData);
      setDocuments(documentsData);
    } catch (error) {
      if (!stale()) {
        console.error('Erro ao carregar listas secundárias:', error);
      }
    }
  }, []);

  const loadReportsSlice = useCallback(async (isStale?: () => boolean) => {
    const stale = () => isStale?.() ?? false;
    try {
      const [eventsData, contactsData, tasksData] = await Promise.all([
        eventService.getAll(),
        contactService.getAll(),
        taskService.getAll(),
      ]);
      if (stale()) return;
      setEvents(eventsData);
      setContacts(contactsData);
      setTasks(tasksData);
    } catch (error) {
      if (!stale()) {
        console.error('Erro ao carregar dados para relatórios:', error);
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
              const ev = await eventService.getAll({ executiveId });
              if (!stale()) setEvents(ev);
            } else if (!stale()) {
              setEvents([]);
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
          case 'reports':
            await loadReportsSlice(isStale);
            break;
          case 'settings':
            await loadAllSecondaryLists(isStale);
            break;
          default:
            break;
        }
      } catch (error) {
        if (!stale()) {
          console.error('Erro ao carregar dados da tela:', error);
        }
      }
    },
    [loadAllSecondaryLists, loadReportsSlice],
  );

  const refreshAfterMutation = useCallback(async () => {
    const stale = () => false;
    await loadCoreData(stale);
    await loadViewDataset(currentView, selectedExecutiveId, stale);
  }, [currentView, selectedExecutiveId, loadCoreData, loadViewDataset]);

  const refreshAfterRestore = useCallback(async () => {
    const stale = () => false;
    await loadCoreData(stale);
    await loadAllSecondaryLists(stale);
  }, [loadCoreData, loadAllSecondaryLists]);

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

  const noopSetUsers = useCallback<React.Dispatch<React.SetStateAction<User[]>>>(() => {}, []);

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
    agenda: 'Agenda',
    contacts: 'Contatos',
    finances: 'Finanças',
    tasks: 'Tarefas',
    documents: 'Documentos',
    reports: 'Relatórios',
    settings: 'Configurações',
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
        return <ExecutivesView />;
      case 'organizations':
        return (
          <OrganizationsView
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
            secretaries={secretaries}
            setSecretaries={setSecretaries}
            executives={executives}
            currentUser={currentUser}
            organizations={organizations}
            departments={departments}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'agenda':
        return (
          <AgendaView
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
            contacts={filteredContacts}
            contactTypes={contactTypes}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'finances':
        return (
          <FinancesView
            expenses={filteredFinances}
            setExpenses={setExpenses}
            expenseCategories={expenseCategories}
            setExpenseCategories={setExpenseCategories}
            executiveId={selectedExecutiveId!}
          />
        );
      case 'tasks':
        return (
          <TasksView tasks={filteredTasks} executiveId={selectedExecutiveId!} onRefresh={refreshAfterMutation} />
        );
      case 'documents':
        return (
          <DocumentsView
            documents={filteredDocuments}
            setDocuments={setDocuments}
            documentCategories={documentCategories}
            setDocumentCategories={setDocumentCategories}
            executiveId={selectedExecutiveId!}
            onRefresh={refreshAfterMutation}
          />
        );
      case 'reports':
        return <ReportsView executives={executives} events={events} expenses={expenses} tasks={tasks} contacts={contacts} />;
      case 'settings':
        return (
          <SettingsView
            allData={{
              legalOrganizations,
              organizations,
              departments,
              executives,
              secretaries,
              users: [currentUser],
              eventTypes,
              events,
              contactTypes,
              contacts,
              expenses,
              expenseCategories,
              tasks,
              documentCategories,
              documents,
            }}
            setAllData={{
              setLegalOrganizations,
              setOrganizations,
              setDepartments,
              setExecutives,
              setSecretaries,
              setUsers: noopSetUsers,
              setEventTypes,
              setEvents,
              setContactTypes,
              setContacts,
              setExpenses,
              setExpenseCategories,
              setTasks,
              setDocumentCategories,
              setDocuments,
            }}
            onAfterRestore={refreshAfterRestore}
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

          <div className="flex items-center gap-4">
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

            <UserMenu user={currentUser} onLogout={onLogout} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{renderView()}</div>
      </main>
    </div>
  );
};

export default MainAppLayout;
