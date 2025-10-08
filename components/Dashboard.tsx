import React, { useMemo } from 'react';
import { Executive, Event, Expense, Organization, Department, ExpenseCategory } from '../types';
import { CalendarIcon, ExpensesIcon, ClockIcon, EmailIcon, PhoneIcon } from './Icons';

interface DashboardProps {
  executives: Executive[]; // This is visibleExecutives, so it's already filtered.
  events: Event[];
  expenses: Expense[];
  selectedExecutive: Executive | undefined;
  organizations: Organization[];
  departments: Department[];
  expenseCategories: ExpenseCategory[];
}

const Dashboard: React.FC<DashboardProps> = ({ events, expenses, selectedExecutive, organizations, departments, expenseCategories }) => {
  const upcomingEvents = useMemo(() => events
    .filter(event => new Date(event.startTime) >= new Date() && event.executiveId === selectedExecutive?.id)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5), [events, selectedExecutive]);

  const recentExpenses = useMemo(() => expenses
    .filter(expense => expense.executiveId === selectedExecutive?.id)
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 5), [expenses, selectedExecutive]);
  
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const timeZoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timeZoneOffset);
    return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const orgDeptString = useMemo(() => {
    if (!selectedExecutive) return '';
    const org = organizations.find(o => o.id === selectedExecutive.organizationId);
    const dept = departments.find(d => d.id === selectedExecutive.departmentId);
    return org ? `${org.name}${dept ? ` / ${dept.name}` : ''}` : 'Organização não definida';
  }, [selectedExecutive, organizations, departments]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">
          {selectedExecutive ? `Painel de ${selectedExecutive.fullName}` : 'Painel de Controle'}
        </h2>
        <p className="text-slate-500 mt-1">
          {selectedExecutive ? 'Resumo das atividades e informações do executivo.' : 'Visão geral da sua operação. Selecione um executivo para começar.'}
        </p>
      </header>

      {/* Executive Info Section */}
      {selectedExecutive && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {selectedExecutive.photoUrl ? (
              <img src={selectedExecutive.photoUrl} alt={selectedExecutive.fullName} className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-200 flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-500 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-slate-200 flex-shrink-0">
                {getInitials(selectedExecutive.fullName)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800">{selectedExecutive.fullName}</h3>
              <p className="text-slate-600 text-lg">{selectedExecutive.jobTitle || 'Cargo não definido'}</p>
              <p className="text-slate-500 text-sm mt-1">{orgDeptString}</p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2 text-sm">
                {selectedExecutive.workEmail && (
                  <a href={`mailto:${selectedExecutive.workEmail}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition">
                    <EmailIcon />
                    <span>{selectedExecutive.workEmail}</span>
                  </a>
                )}
                {selectedExecutive.workPhone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <PhoneIcon />
                    <span>{selectedExecutive.workPhone}</span>
                  </div>
                )}
                {selectedExecutive.linkedinProfileUrl && (
                    <a href={selectedExecutive.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition">
                        <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        <span>Perfil LinkedIn</span>
                    </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Grid for summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-full"><CalendarIcon className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm">Eventos na Agenda</p>
            <p className="text-2xl font-bold">{selectedExecutive ? events.filter(e => e.executiveId === selectedExecutive.id).length : '-'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-green-100 text-green-600 p-3 rounded-full"><ExpensesIcon className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm">Total de Despesas</p>
            <p className="text-2xl font-bold">{selectedExecutive ? expenses.filter(e => e.executiveId === selectedExecutive.id).length : '-'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full"><ClockIcon className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm">Próximos Eventos (7d)</p>
            <p className="text-2xl font-bold">{
              selectedExecutive ? events.filter(e => {
                const eventDate = new Date(e.startTime);
                const today = new Date();
                const in7Days = new Date();
                in7Days.setDate(today.getDate() + 7);
                return e.executiveId === selectedExecutive.id && eventDate >= today && eventDate <= in7Days;
              }).length : '-'
            }</p>
          </div>
        </div>
      </div>

      {!selectedExecutive && (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-slate-700">Bem-vinda à Executiva Cloud!</h3>
            <p className="text-slate-500 mt-2">Para começar, selecione um executivo no menu superior para visualizar seus detalhes.</p>
        </div>
      )}

      {/* Main content grid */}
      {selectedExecutive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
              <CalendarIcon className="w-6 h-6" />
              <span className="ml-2">Próximos Eventos</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div key={event.id} className="p-4 rounded-lg bg-slate-50 border-l-4 border-purple-500">
                    <p className="font-semibold text-slate-800">{event.title}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><ClockIcon className="w-4 h-4" /> {formatDateTime(event.startTime)}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 p-4 text-center">Nenhum evento futuro agendado.</p>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
              <ExpensesIcon className="w-6 h-6" />
              <span className="ml-2">Despesas Recentes</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recentExpenses.length > 0 ? (
                recentExpenses.map(expense => {
                  const category = expenseCategories.find(c => c.id === expense.categoryId);
                  return (
                  <div key={expense.id} className="p-4 rounded-lg bg-slate-50 border-l-4 border-green-500 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-800">{expense.description}</p>
                        {/* FIX: Use categoryId to look up the category name from expenseCategories. */}
                        <p className="text-sm text-slate-500">{formatDate(expense.expenseDate)} - {category?.name || 'Sem categoria'}</p>
                    </div>
                    <p className="font-bold text-green-700">{formatCurrency(expense.amount)}</p>
                  </div>
                )})
              ) : (
                <p className="text-slate-500 p-4 text-center">Nenhuma despesa registrada para este executivo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
