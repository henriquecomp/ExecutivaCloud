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
  ExpenseStatus, 
  Task, 
  Priority, 
  Status, 
  Department, 
  Secretary, 
  User, 
  UserRole, 
  Document, 
  DocumentCategory, 
  ExpenseCategory, 
  LegalOrganization 
} from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { apiService } from './services/apiService';
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
import LoginView from './components/LoginView';
import ReportsView from './components/ReportsView';
import UserMenu from './components/UserMenu';
import DocumentsView from './components/DocumentsView';
import LegalOrganizationsView from './components/LegalOrganizationsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // --- STATE MANAGEMENT (Backend Integrated) ---
  // Dados que vêm do backend via API.
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [legalOrganizations, setLegalOrganizations] = useState<LegalOrganization[]>([]);

  // --- STATE MANAGEMENT (LocalStorage / Mock) ---
  // Dados que ainda não possuem backend completo ou são específicos de sessão/mock.
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [selectedExecutiveId, setSelectedExecutiveId] = useLocalStorage<string | null>('selectedExecutiveId', null);

  // Dummies inicias para dados que ainda não tem backend
  const initialExecutives: Executive[] = useMemo(() => [
    {
      id: 'exec1',
      fullName: 'Carlos Silva',
      workEmail: 'carlos.silva@techsolutions.com',
      organizationId: 'org1', 
      workPhone: '(11) 98888-1111',
      departmentId: 'dept1',
      jobTitle: 'Diretor de Engenharia',
      hireDate: '2018-05-10',
      birthDate: '1980-11-23',
      cpf: '111.222.333-44',
      rg: '12.345.678-9',
      address: 'Rua das Inovações, 123, São Paulo, SP, 01234-567',
      bankInfo: 'Banco Digital S.A.\nAgência: 0001\nConta Corrente: 12345-6',
      compensationInfo: 'Salário Base + Bônus Anual + Stock Options',
    },
  ], []);

  const initialSecretaries: Secretary[] = [];
  const initialEventTypes: EventType[] = [
    { id: 'et1', name: 'Reunião Diretoria', color: '#ef4444' },
    { id: 'et2', name: 'Pessoal', color: '#22c55e' },
    { id: 'et3', name: 'Viagem', color: '#3b82f6' },
  ];
  const initialContactTypes: ContactType[] = [
    { id: 'ct1', name: 'Cliente' },
    { id: 'ct2', name: 'Fornecedor' },
  ];
  const initialExpenseCategories: ExpenseCategory[] = [
    { id: 'ec1', name: 'Alimentação' },
    { id: 'ec2', name: 'Transporte' },
  ];
  const initialDocumentCategories: DocumentCategory[] = [
    { id: 'dc1', name: 'Viagem' },
    { id: 'dc2', name: 'Identificação' },
  ];

  // States com LocalStorage
  const [executives, setExecutives] = useLocalStorage<Executive[]>('executives', initialExecutives);
  const [secretaries, setSecretaries] = useLocalStorage<Secretary[]>('secretaries', initialSecretaries);
  const [users, setUsers] = useLocalStorage<User[]>('users', []); 
  const [eventTypes, setEventTypes] = useLocalStorage<EventType[]>('eventTypes', initialEventTypes);
  const [events, setEvents] = useLocalStorage<Event[]>('events', []);
  const [contactTypes, setContactTypes] = useLocalStorage<ContactType[]>('contactTypes', initialContactTypes);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialExpenseCategories);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [documentCategories, setDocumentCategories] = useLocalStorage<DocumentCategory[]>('documentCategories', initialDocumentCategories);
  const [documents, setDocuments] = useLocalStorage<Document[]>('documents', []);
  const [notifiedEventIds, setNotifiedEventIds] = useState<Set<string>>(new Set());

  // --- CARREGAR DADOS DO BACKEND ---
  const loadBackendData = useCallback(async () => {
    try {
      // 1. Carregar Legal Organizations
      // O backend retorna IDs inteiros, convertemos para string para manter compatibilidade com o frontend
      const legalOrgsRes = await apiService.legalOrganizations.getAll();
      const legalOrgsData = legalOrgsRes.data.map((item: any) => ({
        ...item,
        id: String(item.id)
      }));
      setLegalOrganizations(legalOrgsData);

      // 2. Carregar Organizations (Empresas)
      const orgsRes = await apiService.organizations.getAll();
      const orgsData = orgsRes.data.map((item: any) => ({
        ...item,
        id: String(item.id),
        legalOrganizationId: String(item.legalOrganizationId)
      }));
      setOrganizations(orgsData);

      // 3. Carregar Departamentos
      // Como o backend atualmente busca por organização, iteramos sobre as organizações carregadas
      let allDepts: Department[] = [];
      if (orgsData.length > 0) {
        const deptPromises = orgsData.map(org => apiService.departments.getByOrg(org.id));
        const deptResponses = await Promise.all(deptPromises);
        
        deptResponses.forEach(res => {
          const mappedDepts = res.data.map((item: any) => ({
            ...item,
            id: String(item.id),
            organizationId: String(item.organizationId)
          }));
          allDepts = [...allDepts, ...mappedDepts];
        });
      }
      setDepartments(allDepts);

      // Atualizar lista de usuários mockados para incluir admins das novas organizações
      const masterUser: User = { id: 'user_master', fullName: 'Usuário Master', role: 'master' };
      
      const orgAdmins = orgsData.map(org => ({
        id: `user_admin_${org.id}`,
        fullName: `Admin ${org.name}`,
        role: 'admin' as UserRole,
        organizationId: org.id,
      }));

      const legalOrgAdmins = legalOrgsData.map(lo => ({
        id: `user_admin_legal_${lo.id}`,
        fullName: `Admin ${lo.name}`,
        role: 'admin' as UserRole,
        legalOrganizationId: lo.id
      }));

      const execUsers = executives.map(e => ({
        id: `user_exec_${e.id}`,
        fullName: e.fullName,
        role: 'executive' as UserRole,
        executiveId: e.id,
      }));

      const secUsers = secretaries.map(s => ({
        id: `user_sec_${s.id}`,
        fullName: s.fullName,
        role: 'secretary' as UserRole,
        secretaryId: s.id,
      }));

      // Mescla usuários gerados dinamicamente com usuários persistidos
      setUsers([masterUser, ...legalOrgAdmins, ...orgAdmins, ...execUsers, ...secUsers]);

    } catch (error) {
      console.error("Erro ao carregar dados do backend:", error);
    }
  }, [executives, secretaries, setUsers]);

  // Efeito inicial
  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);


  // --- LOGIN & AUTH ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'secretary') {
      setCurrentView('executives');
    } else {
      setCurrentView('dashboard');
    }
  };

  // --- USER PERMISSIONS & DATA FILTERING ---
  const visibleExecutives = useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'master':
        return executives;
      case 'admin':
        if (currentUser.legalOrganizationId) {
          const orgIdsForLegalOrg = organizations
            .filter(o => o.legalOrganizationId === currentUser.legalOrganizationId)
            .map(o => o.id);
          return executives.filter(e => e.organizationId && orgIdsForLegalOrg.includes(e.organizationId));
        }
        if (currentUser.organizationId) {
          return executives.filter(e => e.organizationId === currentUser.organizationId);
        }
        return [];
      case 'secretary':
        const secretary = secretaries.find(s => s.id === currentUser.secretaryId);
        if (!secretary) return [];
        return executives.filter(e => secretary.executiveIds.includes(e.id));
      case 'executive':
        return executives.filter(e => e.id === currentUser.executiveId);
      default:
        return [];
    }
  }, [currentUser, executives, secretaries, organizations]);

  useEffect(() => {
    if (currentUser?.role === 'executive') {
      setSelectedExecutiveId(currentUser.executiveId || null);
    } else if (currentUser) {
      const isSelectionValid = visibleExecutives.some(e => e.id === selectedExecutiveId);
      if (!isSelectionValid) {
        setSelectedExecutiveId(visibleExecutives.length > 0 ? visibleExecutives[0].id : null);
      }
    }
  }, [currentUser, visibleExecutives, selectedExecutiveId, setSelectedExecutiveId]);


  // --- REMINDER NOTIFICATIONS LOGIC ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!("Notification" in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      events.forEach(event => {
        if (event.reminderMinutes && !notifiedEventIds.has(event.id)) {
          const eventStartTime = new Date(event.startTime);
          const reminderTime = new Date(eventStartTime.getTime() - event.reminderMinutes * 60 * 1000);

          if (now >= reminderTime && now < eventStartTime) {
            const executive = executives.find(e => e.id === event.executiveId);
            const title = `Lembrete: ${event.title}`;
            const options = {
              body: `O evento de ${executive?.fullName || 'um executivo'} começa às ${eventStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
              icon: '/vite.svg',
            };

            new Notification(title, options);
            setNotifiedEventIds(prev => new Set(prev).add(event.id));
          }
        }
      });
    };

    const intervalId = setInterval(checkReminders, 60000); 
    checkReminders(); 

    return () => clearInterval(intervalId);
  }, [events, executives, notifiedEventIds]);


  // --- DERIVED/FILTERED DATA ---
  const selectedExecutive = useMemo(() => executives.find(e => e.id === selectedExecutiveId), [executives, selectedExecutiveId]);

  const filteredEvents = useMemo(() => events.filter(e => e.executiveId === selectedExecutiveId), [events, selectedExecutiveId]);
  const filteredContacts = useMemo(() => contacts.filter(c => c.executiveId === selectedExecutiveId), [contacts, selectedExecutiveId]);
  const filteredFinances = useMemo(() => expenses.filter(ex => ex.executiveId === selectedExecutiveId), [expenses, selectedExecutiveId]);
  const filteredTasks = useMemo(() => tasks.filter(t => t.executiveId === selectedExecutiveId), [tasks, selectedExecutiveId]);
  const filteredDocuments = useMemo(() => documents.filter(d => d.executiveId === selectedExecutiveId), [documents, selectedExecutiveId]);

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
    if (!currentUser) return null;
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
        return <Dashboard
          executives={visibleExecutives}
          events={events}
          expenses={expenses}
          selectedExecutive={selectedExecutive}
          organizations={organizations}
          departments={departments}
          expenseCategories={expenseCategories}
        />;
      case 'legalOrganizations':
        return <LegalOrganizationsView
          currentUser={currentUser}
          legalOrganizations={legalOrganizations} // Passando estado do pai
          setLegalOrganizations={setLegalOrganizations} // Passando setter do pai
          organizations={organizations} setOrganizations={setOrganizations}
          departments={departments} setDepartments={setDepartments}
          executives={executives} setExecutives={setExecutives}
          secretaries={secretaries} setSecretaries={setSecretaries}
          setEvents={setEvents}
          setContacts={setContacts}
          setExpenses={setExpenses}
          setTasks={setTasks}
          setDocuments={setDocuments}
          setUsers={setUsers}
        />;
      case 'executives':
        return <ExecutivesView
          currentUser={currentUser}
          executives={visibleExecutives}
          allExecutives={executives}
          setExecutives={setExecutives}
          organizations={organizations}
          departments={departments}
          secretaries={secretaries}
          setSecretaries={setSecretaries}
          setEvents={setEvents}
          setContacts={setContacts}
          setExpenses={setExpenses}
          setTasks={setTasks}
          setDocuments={setDocuments}
          setUsers={setUsers}
        />;
      case 'organizations':
        return <OrganizationsView
          currentUser={currentUser}
          organizations={organizations} setOrganizations={setOrganizations}
          departments={departments} setDepartments={setDepartments}
          executives={executives} setExecutives={setExecutives}
          secretaries={secretaries} setSecretaries={setSecretaries}
          setEvents={setEvents}
          setContacts={setContacts}
          setExpenses={setExpenses}
          setTasks={setTasks}
          setDocuments={setDocuments}
          setUsers={setUsers}
          legalOrganizations={legalOrganizations} // Passando a lista atualizada
          onRefresh={loadBackendData} // Passando função de refresh
        />;
      case 'secretaries':
        return <SecretariesView
          secretaries={secretaries}
          setSecretaries={setSecretaries}
          executives={executives}
          setUsers={setUsers}
          currentUser={currentUser}
          organizations={organizations}
          departments={departments}
        />;
      case 'agenda':
        return <AgendaView events={filteredEvents} setEvents={setEvents} eventTypes={eventTypes} setEventTypes={setEventTypes} executiveId={selectedExecutiveId!} />;
      case 'contacts':
        return <ContactsView contacts={filteredContacts} setContacts={setContacts} contactTypes={contactTypes} setContactTypes={setContactTypes} executiveId={selectedExecutiveId!} />;
      case 'finances':
        return <FinancesView expenses={filteredFinances} setExpenses={setExpenses} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} executiveId={selectedExecutiveId!} />;
      case 'tasks':
        return <TasksView tasks={filteredTasks} setTasks={setTasks} executiveId={selectedExecutiveId!} />;
      case 'documents':
        return <DocumentsView documents={filteredDocuments} setDocuments={setDocuments} documentCategories={documentCategories} setDocumentCategories={setDocumentCategories} executiveId={selectedExecutiveId!} />;
      case 'reports':
        return <ReportsView executives={executives} events={events} expenses={expenses} tasks={tasks} contacts={contacts} />;
      case 'settings':
        return <SettingsView
          allData={{ legalOrganizations, organizations, departments, executives, secretaries, users, eventTypes, events, contactTypes, contacts, expenses, expenseCategories, tasks, documentCategories, documents }}
          setAllData={{ setLegalOrganizations, setOrganizations, setDepartments, setExecutives, setSecretaries, setUsers, setEventTypes, setEvents, setContactTypes, setContacts, setExpenses, setExpenseCategories, setTasks, setDocumentCategories, setDocuments }}
        />;
      default:
        return <Dashboard
          executives={visibleExecutives}
          events={events}
          expenses={expenses}
          selectedExecutive={selectedExecutive}
          organizations={organizations}
          departments={departments}
          expenseCategories={expenseCategories}
        />;
    }
  };

  const BurgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar currentUser={currentUser} currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/60 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-600 hover:text-slate-900" aria-label="Abrir menu">
              <BurgerIcon />
            </button>
            <h1 className="text-xl font-bold text-slate-700 capitalize hidden sm:block">
              {viewTitles[currentView]}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-full sm:max-w-xs md:max-w-sm">
              <select
                aria-label="Selecionar Executivo"
                value={selectedExecutiveId || ''}
                onChange={e => setSelectedExecutiveId(e.target.value || null)}
                disabled={currentUser?.role === 'executive'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Selecione um Executivo --</option>
                {visibleExecutives.map(exec => {
                  const org = organizations.find(o => o.id === exec.organizationId);
                  const dept = departments.find(d => d.id === exec.departmentId);
                  const orgDeptString = org ? `${org.name}${dept ? ` / ${dept.name}` : ''}` : '';
                  return (
                    <option key={exec.id} value={exec.id}>
                      {exec.fullName} {orgDeptString && `(${orgDeptString})`}
                    </option>
                  )
                })}
              </select>
            </div>

            <UserMenu user={currentUser} onLogout={() => setCurrentUser(null)} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;