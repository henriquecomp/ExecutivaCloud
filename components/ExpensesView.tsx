import React, { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseStatus, LayoutView, ExpenseCategory, ExpenseType, ExpenseEntityType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewSwitcher from './ViewSwitcher';
import { EditIcon, DeleteIcon, PlusIcon, SettingsIcon } from './Icons';

interface FinancesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  executiveId: string;
}

// --- Category Management Components ---
const CategoryForm: React.FC<{ category: Partial<ExpenseCategory>, onSave: (cat: ExpenseCategory) => void, onCancel: () => void }> = ({ category, onSave, onCancel }) => {
    const [name, setName] = useState(category.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ id: category.id || `ec_${new Date().getTime()}`, name });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700">Nome da Categoria</label>
                <input type="text" id="cat-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar</button>
            </div>
        </form>
    );
};

const CategorySettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: ExpenseCategory[];
    setCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
}> = ({ isOpen, onClose, categories, setCategories }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<ExpenseCategory> | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);

    const handleSave = (category: ExpenseCategory) => {
        setCategories(prev => editingCategory?.id ? prev.map(c => c.id === category.id ? category : c) : [...prev, category]);
        setFormOpen(false);
        setEditingCategory(null);
    };

    const confirmDelete = () => {
        if (!categoryToDelete) return;
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
    };

    if (!isOpen) return null;
    return (
        <Modal title="Gerenciar Categorias de Finanças" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => { setEditingCategory({}); setFormOpen(true); }} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition text-sm">
                        <PlusIcon /> Adicionar Categoria
                    </button>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {categories.map(cat => (
                       <li key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-800">{cat.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingCategory(cat); setFormOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                <button onClick={() => setCategoryToDelete(cat)} className="p-2 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isFormOpen && (
                <Modal title={editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'} onClose={() => setFormOpen(false)}>
                    <CategoryForm category={editingCategory || {}} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditingCategory(null); }} />
                </Modal>
            )}
            {categoryToDelete && <ConfirmationModal isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?`} />}
        </Modal>
    );
};

const ExpenseForm: React.FC<{ expense: Partial<Expense>, onSave: (expense: Expense) => void, onCancel: () => void, categories: ExpenseCategory[] }> = ({ expense, onSave, onCancel, categories }) => {
    const [description, setDescription] = useState(expense.description || '');
    const [amount, setAmount] = useState(expense.amount || 0);
    const [expenseDate, setExpenseDate] = useState(expense.expenseDate || new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<ExpenseType>(expense.type || 'A pagar');
    const [entityType, setEntityType] = useState<ExpenseEntityType>(expense.entityType || 'Pessoa Jurídica');
    const [categoryId, setCategoryId] = useState(expense.categoryId || '');
    const [status, setStatus] = useState<ExpenseStatus>(expense.status || 'Pendente');
    const [receiptUrl, setReceiptUrl] = useState(expense.receiptUrl || '');

    const statusOptions = useMemo(() => {
        if (type === 'A pagar') {
            return ['Pendente', 'Pago'];
        }
        return ['Pendente', 'Recebida'];
    }, [type]);

    useEffect(() => {
        // Reset status if it becomes invalid for the current type
        if (!statusOptions.includes(status)) {
            setStatus(statusOptions[0] as ExpenseStatus);
        }
    }, [status, type, statusOptions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || amount <= 0 || !expense.executiveId) return;
        onSave({
            id: expense.id || `exp_${new Date().toISOString()}`,
            executiveId: expense.executiveId,
            description, amount, expenseDate, type, entityType, categoryId, status, receiptUrl,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Lançamento</label>
                <div className="flex gap-4">
                    {(['A pagar', 'A receber'] as ExpenseType[]).map(t => (
                        <label key={t} className="flex items-center">
                            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="h-4 w-4 text-indigo-600" />
                            <span className="ml-2 text-sm text-slate-600">{t}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Origem</label>
                <div className="flex gap-4">
                    {(['Pessoa Jurídica', 'Pessoa Física'] as ExpenseEntityType[]).map(e => (
                        <label key={e} className="flex items-center">
                            <input type="radio" name="entityType" value={e} checked={entityType === e} onChange={() => setEntityType(e)} className="h-4 w-4 text-indigo-600" />
                            <span className="ml-2 text-sm text-slate-600">{e}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrição</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Valor (R$)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="expenseDate" className="block text-sm font-medium text-slate-700">Data</label>
                    <input type="date" id="expenseDate" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoria</label>
                    <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Sem categoria</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as ExpenseStatus)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="receiptUrl" className="block text-sm font-medium text-slate-700">URL do Recibo</label>
                <input type="url" id="receiptUrl" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Lançamento</button>
            </div>
        </form>
    );
};

const FinancesView: React.FC<FinancesViewProps> = ({ expenses, setExpenses, expenseCategories, setExpenseCategories, executiveId }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

    // Filters for the table
    const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<ExpenseEntityType | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    
    const [layout, setLayout] = useLocalStorage<LayoutView>('financesViewLayout', 'table');
    const [limit, setLimit] = useLocalStorage('financesViewLimit', 10);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredExpensesForTable = useMemo(() => {
      return [...expenses]
        .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
        .filter(e => filterType === 'all' || e.type === filterType)
        .filter(e => filterEntityType === 'all' || e.entityType === filterEntityType)
        .filter(e => filterCategory === 'all' || e.categoryId === filterCategory);
    }, [expenses, filterType, filterEntityType, filterCategory]);

    const paginatedExpenses = useMemo(() => {
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        return filteredExpensesForTable.slice(start, end);
    }, [filteredExpensesForTable, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit, expenses, layout, filterType, filterEntityType, filterCategory]);

    const handleAddExpense = () => {
        setEditingExpense({ executiveId });
        setModalOpen(true);
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setModalOpen(true);
    };

    const confirmDelete = () => {
        if (expenseToDelete) {
            setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
            setExpenseToDelete(null);
        }
    };
    
    const handleSaveExpense = (expense: Expense) => {
        setExpenses(prev => editingExpense?.id ? prev.map(e => e.id === expense.id ? expense : e) : [...prev, expense]);
        setModalOpen(false);
        setEditingExpense(null);
    };

    const getStatusBadgeClass = (status: ExpenseStatus) => ({
      'Pago': 'bg-green-100 text-green-800 border-green-500',
      'Recebida': 'bg-emerald-100 text-emerald-800 border-emerald-500',
      'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-500',
    }[status] || 'bg-slate-100 text-slate-800 border-slate-500');
    
    const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatCurrency = (amount: number) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const renderItems = () => {
        if (paginatedExpenses.length === 0) return <div className="col-span-full text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Nenhum lançamento encontrado para os filtros aplicados.</p></div>;
        switch (layout) {
            case 'card': return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedExpenses.map(expense => {
                        const categoryName = expenseCategories.find(c => c.id === expense.categoryId)?.name;
                        return (
                        <div key={expense.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <p className="font-bold text-slate-800 text-lg break-words pr-2">{expense.description}</p>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span>
                                </div>
                                <p className={`font-bold text-2xl mt-2 ${expense.type === 'A receber' ? 'text-green-600' : 'text-red-600'}`}>
                                    {expense.type === 'A receber' ? '+' : '-'} {formatCurrency(expense.amount)}
                                </p>
                                <div className="text-sm text-slate-500 mt-3 space-y-1 border-t pt-3">
                                    <p><strong>Data:</strong> {formatDate(expense.expenseDate)}</p>
                                    <p><strong>Categoria:</strong> {categoryName || 'N/A'}</p>
                                    <p><strong>Origem:</strong> {expense.entityType}</p>
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-1 mt-4">
                                <button onClick={() => handleEditExpense(expense)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar"><EditIcon /></button>
                                <button onClick={() => setExpenseToDelete(expense)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir"><DeleteIcon /></button>
                            </div>
                        </div>
                    )})}
                </div>
            );
             case 'list': return (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4">
                    {paginatedExpenses.map(expense => {
                        const categoryName = expenseCategories.find(c => c.id === expense.categoryId)?.name;
                        return (
                        <div key={expense.id} className={`flex items-center space-x-4 p-4 rounded-lg bg-slate-50 border-l-4 ${expense.type === 'A receber' ? 'border-green-500' : 'border-red-500'}`}>
                            <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h3 className="text-lg font-semibold text-slate-800">{expense.description}</h3>
                                    <p className={`font-bold text-lg ${expense.type === 'A receber' ? 'text-green-600' : 'text-red-600'}`}>
                                       {expense.type === 'A receber' ? '+' : '-'} {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-slate-500 mt-1">
                                    <span>{formatDate(expense.expenseDate)}</span>
                                    <span className="text-slate-300 hidden sm:inline">|</span>
                                    <span>{categoryName || 'N/A'}</span>
                                    <span className="text-slate-300 hidden sm:inline">|</span>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-1">
                                <button onClick={() => handleEditExpense(expense)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar"><EditIcon /></button>
                                <button onClick={() => setExpenseToDelete(expense)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir"><DeleteIcon /></button>
                            </div>
                        </div>
                    )})}
                </div>
            );
            case 'table': return (
                <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-slate-200 text-sm text-slate-500">
                            <tr>
                                <th className="p-3">Descrição</th>
                                <th className="p-3 hidden md:table-cell">Data</th>
                                <th className="p-3 hidden lg:table-cell">Categoria</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExpenses.map(expense => {
                                const categoryName = expenseCategories.find(c => c.id === expense.categoryId)?.name;
                                return (
                                <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">
                                        {expense.description}
                                        <p className="font-normal text-xs text-slate-500">{expense.entityType} - {expense.type}</p>
                                    </td>
                                    <td className="p-3 hidden md:table-cell text-slate-600">{formatDate(expense.expenseDate)}</td>
                                    <td className="p-3 hidden lg:table-cell text-slate-600">{categoryName}</td>
                                    <td className={`p-3 font-medium ${expense.type === 'A receber' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(expense.amount)}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span></td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleEditExpense(expense)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar"><EditIcon /></button>
                                            <button onClick={() => setExpenseToDelete(expense)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Controle Financeiro</h2>
                    <p className="text-slate-500 mt-1">Registre e acompanhe suas finanças.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleAddExpense} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                        <PlusIcon />
                        Novo Lançamento
                    </button>
                    <button onClick={() => setCategoryModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-700 rounded-md shadow-sm hover:bg-indigo-200 transition" aria-label="Gerenciar Categorias">
                        <SettingsIcon />
                    </button>
                </div>
            </header>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-white rounded-xl shadow-md">
                <ViewSwitcher layout={layout} setLayout={setLayout} />
                <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="limit" className="text-slate-600">Itens por página:</label>
                    <select id="limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value={10}>10</option><option value={30}>30</option><option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="filter-type" className="block text-sm font-medium text-slate-700">Tipo</label>
                        <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm">
                            <option value="all">Todos</option><option value="A pagar">A pagar</option><option value="A receber">A receber</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-entity" className="block text-sm font-medium text-slate-700">Origem</label>
                        <select id="filter-entity" value={filterEntityType} onChange={e => setFilterEntityType(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm">
                            <option value="all">Todas</option><option value="Pessoa Jurídica">Pessoa Jurídica</option><option value="Pessoa Física">Pessoa Física</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-category" className="block text-sm font-medium text-slate-700">Categoria</label>
                        <select id="filter-category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm">
                            <option value="all">Todas</option>
                            {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

             <div>
                {renderItems()}
                {filteredExpensesForTable.length > 0 && (
                     <div className="mt-6">
                        <Pagination currentPage={currentPage} totalItems={filteredExpensesForTable.length} itemsPerPage={limit} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title={editingExpense?.id ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={() => setModalOpen(false)}>
                    <ExpenseForm expense={editingExpense || {}} onSave={handleSaveExpense} onCancel={() => { setModalOpen(false); setEditingExpense(null); }} categories={expenseCategories} />
                </Modal>
            )}
            
            <CategorySettingsModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} categories={expenseCategories} setCategories={setExpenseCategories} />

            {expenseToDelete && <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o lançamento "${expenseToDelete.description}"?`} />}
        </div>
    );
};

export default FinancesView;