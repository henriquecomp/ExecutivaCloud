import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Executive, Organization, Event, EventType, Contact, ContactType, Expense, View, Task, Department, Secretary, User, Document, DocumentCategory, ExpenseCategory } from './types';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // --- API DATA STATE MANAGEMENT ---
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
        const [
            orgsRes, deptsRes, execsRes, secsRes, usersRes, eventTypesRes, eventsRes,
            contactTypesRes, contactsRes, expensesRes, expenseCatsRes, tasksRes,
            docCatsRes, docsRes
        ] = await Promise.all([
            api.get('/organizations'), api.get('/departments'), api.get('/executives'),
            api.get('/secretaries'), api.get('/users'), api.get('/event-types'),
            api.get('/events'), api.get('/contact-types'), api.get('/contacts'),
            api.get('/expenses'), api.get('/expense-categories'), api.get('/tasks'),
            api.get('/document-categories'), api.get('/documents')
        ]);

        setOrganizations(orgsRes.data);
        setDepartments(deptsRes.data);
        setExecutives(execsRes.data);
        setSecretaries(secsRes.data);
        setUsers(usersRes.data);
        setEventTypes(eventTypesRes.data);
        setEvents(eventsRes.data);
        setContactTypes(contactTypesRes.data);
        setContacts(contactsRes.data);
        setExpenses(expensesRes.data);
        setExpenseCategories(expenseCatsRes.data);
        setTasks(tasksRes.data);
        setDocumentCategories(docCatsRes.data);
        setDocuments(docsRes.data);

    } catch (error) {
        console.error("Failed to fetch data", error);
        // Handle error, maybe show a toast notification
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- USER PERMISSIONS & DATA FILTERING ---
  const visibleExecutives = useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'master':
        return executives;
      case 'admin':
        return executives.filter(e => e.organizationId === user.organizationId);
      case 'secretary':
        const secretary = secretaries.find(s => s.id === user.secretaryId);
        if (!secretary) return [];
        return executives.filter(e => secretary.executiveIds.includes(e.id));
      case 'executive':
        return executives.filter(e => e.id === user.executiveId);
      default:
        return [];
    }
  }, [user, executives, secretaries]);
  
  // Effect to manage selected executive based on current user
  useEffect(() => {
    if (user?.role === 'executive') {
      setSelectedExecutiveId(user.executiveId || null);
    } else if (user) {
      const isSelectionValid = visibleExecutives.some(e => e.id === selectedExecutiveId);
      if (!isSelectionValid) {
        setSelectedExecutiveId(visibleExecutives.length > 0 ? visibleExecutives[0].id : null);
      }
    } else {
        setSelectedExecutiveId(null);
    }
  }, [user, visibleExecutives, selectedExecutiveId]);


  // --- DERIVED/FILTERED DATA ---
  const selectedExecutive = useMemo(() => executives.find(e => e.id === selectedExecutiveId), [executives, selectedExecutiveId]);

  const filteredEvents = useMemo(() => events.filter(e => e.executiveId === selectedExecutiveId), [events, selectedExecutiveId]);
  const filteredContacts = useMemo(() => contacts.filter(c => c.executiveId === selectedExecutiveId), [contacts, selectedExecutiveId]);
  const filteredFinances = useMemo(() => expenses.filter(ex => ex.executiveId === selectedExecutiveId), [expenses, selectedExecutiveId]);
  const filteredTasks = useMemo(() => tasks.filter(t => t.executiveId === selectedExecutiveId), [tasks, selectedExecutiveId]);
  const filteredDocuments = useMemo(() => documents.filter(d => d.executiveId === selectedExecutiveId), [documents, selectedExecutiveId]);
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Painel', organizations: 'Organizações', executives: 'Executivos',
    secretaries: 'Secretárias', agenda: 'Agenda', contacts: 'Contatos',
    finances: 'Finanças', tasks: 'Tarefas', documents: 'Documentos',
    reports: 'Relatórios', settings: 'Configurações',
  };

  const renderView = () => {
    if (!user) return null;
    if (['agenda', 'contacts', 'finances', 'tasks', 'documents'].includes(currentView) && !selectedExecutiveId && user.role !== 'executive') {
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
                  executives={visibleExecutives} events={events} expenses={expenses} 
                  selectedExecutive={selectedExecutive} organizations={organizations}
                  departments={departments} expenseCategories={expenseCategories}
                />;
      case 'executives':
        return <ExecutivesView 
                  executives={visibleExecutives} organizations={organizations} 
                  departments={departments} secretaries={secretaries}
                  setExecutives={setExecutives} setSecretaries={setSecretaries}
                  setEvents={setEvents} setContacts={setContacts} setExpenses={setExpenses}
                  setTasks={setTasks} setDocuments={setDocuments} setUsers={setUsers}
                />;
      case 'organizations':
        return <OrganizationsView 
                  organizations={organizations} setOrganizations={setOrganizations}
                  departments={departments} setDepartments={setDepartments}
                  executives={executives} setExecutives={setExecutives}
                  secretaries={secretaries} setSecretaries={setSecretaries}
                  setEvents={setEvents} setContacts={setContacts} setExpenses={setExpenses}
                  setTasks={setTasks} setDocuments={setDocuments} setUsers={setUsers}
                />;
      case 'secretaries':
        return <SecretariesView secretaries={secretaries} setSecretaries={setSecretaries} executives={executives} setUsers={setUsers} />;
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
        return <SettingsView />;
      default:
        return <Dashboard 
                  executives={visibleExecutives} events={events} expenses={expenses} 
                  selectedExecutive={selectedExecutive} organizations={organizations}
                  departments={departments} expenseCategories={expenseCategories}
                />;
    }
  };

  const BurgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );

  if (loading) {
      return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <LoginView users={users} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar currentUser={user} currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
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
                  disabled={user?.role === 'executive'}
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
             <UserMenu user={user} onLogout={logout} />
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
