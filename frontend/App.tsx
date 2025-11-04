import React, { useState, useMemo, useEffect } from 'react';
import { Executive, Organization, Event, EventType, Contact, ContactType, Expense, View, ExpenseStatus, Task, Priority, Status, Department, Secretary, User, UserRole, Document, DocumentCategory, ExpenseCategory, LegalOrganization } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
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

  // --- DUMMY DATA INITIALIZATION ---
  const initialLegalOrganizations: LegalOrganization[] = useMemo(() => [
    { id: 'legal_org1', name: 'Grupo Tech Global Holding', cnpj: '11.222.333/0001-44', street: 'Avenida Principal', number: '100', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', zipCode: '01000-000' },
    { id: 'legal_org2', name: 'Inova Corp Participações', cnpj: '55.666.777/0001-88', street: 'Rua da Inovação', number: '200', neighborhood: 'Botafogo', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22270-000' },
  ], []);

  const initialOrganizations: Organization[] = useMemo(() => [
    { id: 'org1', name: 'Tech Solutions Inc.', legalOrganizationId: 'legal_org1' },
    { id: 'org2', name: 'Inova Corp Global', legalOrganizationId: 'legal_org2' },
  ], []);

  const initialDepartments: Department[] = useMemo(() => [
    { id: 'dept1', name: 'Engenharia', organizationId: 'org1' },
    { id: 'dept2', name: 'Vendas', organizationId: 'org1' },
    { id: 'dept3', name: 'Marketing', organizationId: 'org2' },
  ], []);

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
    { 
      id: 'exec2', 
      fullName: 'Beatriz Costa', 
      workEmail: 'bia.costa@inovacorp.com', 
      organizationId: 'org2', 
      workPhone: '(21) 97777-2222', 
      departmentId: 'dept3', 
      jobTitle: 'CEO', 
      linkedinProfileUrl: 'https://linkedin.com/in/beatrizcosta', 
      bio: 'Beatriz é uma líder visionária com mais de 20 anos de experiência no setor de tecnologia.' 
    },
    { 
      id: 'exec3', 
      fullName: 'Roberto Almeida', 
      workEmail: 'roberto.a@techsolutions.com', 
      organizationId: 'org1', 
      workPhone: '(11) 96666-3333', 
      departmentId: 'dept2', 
      jobTitle: 'Diretor de Vendas', 
      reportsToExecutiveId: 'exec1' 
    },
  ], []);
  
  const initialSecretaries: Secretary[] = useMemo(() => [
    { id: 'sec1', fullName: 'Sofia Ribeiro', workEmail: 'sofia.r@techsolutions.com', executiveIds: ['exec1', 'exec3'] },
    { id: 'sec2', fullName: 'Laura Mendes', workEmail: 'laura.m@inovacorp.com', executiveIds: ['exec2'] },
  ], []);
  
  const initialUsers: User[] = useMemo(() => [
    // Static master user
    { id: 'user_master', fullName: 'Usuário Master', role: 'master' },
    // Admins for Legal Organizations
    ...initialLegalOrganizations.map(lo => ({
      id: `user_admin_legal_${lo.id}`,
      fullName: `Admin ${lo.name}`,
      role: 'admin' as UserRole,
      legalOrganizationId: lo.id,
    })),
    // Admins for specific Organizations (Empresas)
    ...initialOrganizations.map(org => ({
      id: `user_admin_${org.id}`,
      fullName: `Admin ${org.name}`,
      role: 'admin' as UserRole,
      organizationId: org.id,
    })),
    // Users for Executives
    ...initialExecutives.map(e => ({
      id: `user_exec_${e.id}`,
      fullName: e.fullName,
      role: 'executive' as UserRole,
      executiveId: e.id,
    })),
    // Users for Secretaries
    ...initialSecretaries.map(s => ({
      id: `user_sec_${s.id}`,
      fullName: s.fullName,
      role: 'secretary' as UserRole,
      secretaryId: s.id,
    })),
  ], [initialLegalOrganizations, initialOrganizations, initialExecutives, initialSecretaries]);

  const initialEventTypes: EventType[] = useMemo(() => [
      { id: 'et1', name: 'Reunião Diretoria', color: '#ef4444' }, // red-500
      { id: 'et2', name: 'Pessoal', color: '#22c55e' }, // green-500
      { id: 'et3', name: 'Viagem', color: '#3b82f6' }, // blue-500
  ], []);

  const initialEvents: Event[] = useMemo(() => {
    const today = new Date();
    return [
      { id: 'ev1', executiveId: 'exec1', title: 'Reunião de Vendas Q3', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(), endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(), location: 'Sala de Conferência 1', eventTypeId: 'et1' },
      { id: 'ev2', executiveId: 'exec2', title: 'Almoço com Fornecedor', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(), endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30).toISOString(), location: 'Restaurante Central', eventTypeId: 'et1', reminderMinutes: 15 },
      { id: 'ev3', executiveId: 'exec1', title: 'Consulta Médica', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0).toISOString(), endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0).toISOString(), location: 'Clínica Bem-Estar', eventTypeId: 'et2' },
    ]
  }, []);

  const initialContactTypes: ContactType[] = useMemo(() => [
      { id: 'ct1', name: 'Cliente' },
      { id: 'ct2', name: 'Fornecedor' },
      { id: 'ct3', name: 'Networking' },
  ], []);

  const initialContacts: Contact[] = useMemo(() => [
    { id: 'c1', executiveId: 'exec1', fullName: 'Ana Pereira', company: 'Global Tech', email: 'ana.p@globaltech.com', phone: '(11) 95555-1234', contactTypeId: 'ct1', role: 'Gerente de Contas' },
    { id: 'c2', executiveId: 'exec2', fullName: 'Julio Marques', company: 'Fast Logistics', email: 'julio@fastlog.com', phone: '(21) 94444-5678', contactTypeId: 'ct2', role: 'Diretor de Operações' },
  ], []);

  const initialExpenseCategories: ExpenseCategory[] = useMemo(() => [
    { id: 'ec1', name: 'Alimentação' },
    { id: 'ec2', name: 'Transporte' },
    { id: 'ec3', name: 'Software' },
    { id: 'ec4', name: 'Consultoria' },
    { id: 'ec5', name: 'Reembolso' },
  ], []);

  const initialExpenses: Expense[] = useMemo(() => {
    const today = new Date();
    const createDateString = (daysAgo: number): string => {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

     return [
      { id: 'ex1', executiveId: 'exec1', description: 'Almoço com cliente', amount: 150.75, expenseDate: createDateString(1), type: 'A pagar', entityType: 'Pessoa Jurídica', categoryId: 'ec1', status: 'Pago' as ExpenseStatus, receiptUrl: 'http://example.com/recibo1.jpg' },
      { id: 'ex2', executiveId: 'exec1', description: 'Transporte para reunião', amount: 45.50, expenseDate: createDateString(0), type: 'A pagar', entityType: 'Pessoa Jurídica', categoryId: 'ec2', status: 'Pendente' as ExpenseStatus },
      { id: 'ex3', executiveId: 'exec2', description: 'Assinatura Software', amount: 89.90, expenseDate: createDateString(5), type: 'A pagar', entityType: 'Pessoa Jurídica', categoryId: 'ec3', status: 'Pago' as ExpenseStatus },
      { id: 'ex4', executiveId: 'exec1', description: 'Pagamento de Consultoria', amount: 2500, expenseDate: createDateString(10), type: 'A receber', entityType: 'Pessoa Física', categoryId: 'ec4', status: 'Recebida' as ExpenseStatus },
     ]
  }, []);

  const initialTasks: Task[] = useMemo(() => {
    const today = new Date();
    return [
        { id: 't1', executiveId: 'exec1', title: 'Preparar apresentação Q4', dueDate: new Date(new Date(today).setDate(today.getDate() + 3)).toISOString().split('T')[0], priority: Priority.High, status: Status.InProgress },
        { id: 't2', executiveId: 'exec1', title: 'Revisar contrato com Fast Logistics', dueDate: new Date(new Date(today).setDate(today.getDate() + 5)).toISOString().split('T')[0], priority: Priority.Medium, status: Status.Todo },
        { id: 't3', executiveId: 'exec2', title: 'Agendar reunião com time de marketing', dueDate: new Date(new Date(today).setDate(today.getDate() + 1)).toISOString().split('T')[0], priority: Priority.High, status: Status.Todo },
        { id: 't4', executiveId: 'exec1', title: 'Enviar relatório semanal', dueDate: new Date(new Date(today).setDate(today.getDate() - 1)).toISOString().split('T')[0], priority: Priority.Medium, status: Status.Done },
    ]
  }, []);
  
  const initialDocumentCategories: DocumentCategory[] = useMemo(() => [
      { id: 'dc1', name: 'Viagem' },
      { id: 'dc2', name: 'Identificação' },
  ], []);

  const initialDocuments: Document[] = useMemo(() => [], []);


  // --- LOCAL STORAGE STATE MANAGEMENT ---
  const [legalOrganizations, setLegalOrganizations] = useLocalStorage<LegalOrganization[]>('legalOrganizations', initialLegalOrganizations);
  const [organizations, setOrganizations] = useLocalStorage<Organization[]>('organizations', initialOrganizations);
  const [departments, setDepartments] = useLocalStorage<Department[]>('departments', initialDepartments);
  const [executives, setExecutives] = useLocalStorage<Executive[]>('executives', initialExecutives);
  const [secretaries, setSecretaries] = useLocalStorage<Secretary[]>('secretaries', initialSecretaries);
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [eventTypes, setEventTypes] = useLocalStorage<EventType[]>('eventTypes', initialEventTypes);
  const [events, setEvents] = useLocalStorage<Event[]>('events', initialEvents);
  const [contactTypes, setContactTypes] = useLocalStorage<ContactType[]>('contactTypes', initialContactTypes);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', initialContacts);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialExpenses);
  const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialExpenseCategories);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', initialTasks);
  const [documentCategories, setDocumentCategories] = useLocalStorage<DocumentCategory[]>('documentCategories', initialDocumentCategories);
  const [documents, setDocuments] = useLocalStorage<Document[]>('documents', initialDocuments);
  const [notifiedEventIds, setNotifiedEventIds] = useState<Set<string>>(new Set());

  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [selectedExecutiveId, setSelectedExecutiveId] = useLocalStorage<string | null>('selectedExecutiveId', null);

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
  
  // Effect to manage selected executive based on current user
  useEffect(() => {
    if (currentUser?.role === 'executive') {
      setSelectedExecutiveId(currentUser.executiveId || null);
    } else if (currentUser) {
      // If the current selection is no longer valid, reset it
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

      const intervalId = setInterval(checkReminders, 60000); // Check every minute
      checkReminders(); // Initial check

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
    // Check if an executive is selected for views that require it
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
            legalOrganizations={legalOrganizations} setLegalOrganizations={setLegalOrganizations}
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
                  legalOrganizations={legalOrganizations}
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