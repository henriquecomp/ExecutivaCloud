import React, { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseStatus, LayoutView, ExpenseCategory, ExpenseType, ExpenseEntityType } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewSwitcher from './ViewSwitcher';
import { EditIcon, DeleteIcon, PlusIcon, CogIcon } from './Icons';
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from './ui/DataTable';
import { FormDangerAlert } from './ui/FormDangerAlert';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import FormActions from './ui/FormActions';
import ToolbarPanel from './ui/ToolbarPanel';
import { radioClass } from './ui/controlTokens';
import { expenseService } from '../services/expenseService';
import { expenseCategoryService } from '../services/expenseCategoryService';
import { getApiErrorMessage } from '../utils/apiError';

interface FinancesViewProps {
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  executiveId: string;
  onRefresh: () => Promise<void>;
}

// --- Category Management Components ---
const CategoryForm: React.FC<{ category: Partial<ExpenseCategory>, onSave: (cat: ExpenseCategory) => void | Promise<void>, onCancel: () => void }> = ({ category, onSave, onCancel }) => {
    const [name, setName] = useState(category.name || '');
    const [color, setColor] = useState(category.color || '#64748b');
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        await Promise.resolve(
            onSave({
                id: category.id || '',
                name,
                color,
                executiveId: category.executiveId || '',
            }),
        );
    };
    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
                <AppLabel htmlFor="cat-name">Nome da Categoria</AppLabel>
                <AppInput id="cat-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1" />
            </div>
            <div>
                <AppLabel htmlFor="cat-color">Cor da Etiqueta</AppLabel>
                <div className="mt-1 flex items-center gap-3">
                    <input
                        type="color"
                        id="cat-color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="h-10 w-14 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-1"
                    />
                    <AppInput
                        type="text"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        placeholder="#64748b"
                    />
                </div>
            </div>
            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary">
                    Salvar
                </AppButton>
            </FormActions>
        </form>
    );
};

const CategorySettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: ExpenseCategory[];
    executiveId: string;
    onRefresh: () => Promise<void>;
}> = ({ isOpen, onClose, categories, executiveId, onRefresh }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<ExpenseCategory> | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
    const [categoryActionError, setCategoryActionError] = useState<string | null>(null);

    const handleSave = async (category: ExpenseCategory) => {
        setCategoryActionError(null);
        try {
            if (editingCategory?.id) {
                await expenseCategoryService.update(editingCategory.id, {
                    name: category.name,
                    color: category.color,
                });
            } else {
                await expenseCategoryService.create({
                    name: category.name,
                    color: category.color,
                    executiveId,
                });
            }
            await onRefresh();
            setFormOpen(false);
            setEditingCategory(null);
        } catch (e) {
            console.error(e);
            setCategoryActionError(getApiErrorMessage(e, 'Não foi possível salvar a categoria.'));
        }
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        setCategoryActionError(null);
        try {
            await expenseCategoryService.delete(categoryToDelete.id);
            await onRefresh();
            setCategoryToDelete(null);
        } catch (e) {
            console.error(e);
            setCategoryActionError(getApiErrorMessage(e, 'Não foi possível excluir a categoria.'));
        }
    };

    if (!isOpen) return null;
    return (
        <Modal title="Categorias" onClose={onClose}>
            <div className="space-y-4">
                <FormDangerAlert message={categoryActionError} />
                <div className="flex justify-end">
                    <AppButton
                        variant="ghost"
                        type="button"
                        className="!p-2"
                        title="Adicionar categoria de finanças"
                        aria-label="Adicionar categoria de finanças"
                        onClick={() => { setEditingCategory({ executiveId }); setFormOpen(true); }}
                    >
                        <PlusIcon />
                    </AppButton>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {categories.map(cat => (
                       <li key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: cat.color || '#64748b' }} />
                                <span className="font-medium text-slate-800">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingCategory(cat); setFormOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                <button onClick={() => setCategoryToDelete(cat)} className="p-2 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isFormOpen && (
                <Modal title={editingCategory?.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setFormOpen(false)}>
                    <CategoryForm category={editingCategory || {}} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditingCategory(null); }} />
                </Modal>
            )}
            {categoryToDelete && <ConfirmationModal isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?`} />}
        </Modal>
    );
};

const ExpenseForm: React.FC<{ expense: Partial<Expense>, onSave: (expense: Expense) => void | Promise<void>, onCancel: () => void, categories: ExpenseCategory[] }> = ({ expense, onSave, onCancel, categories }) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || amount <= 0 || !expense.executiveId) return;
        await Promise.resolve(
            onSave({
                id: expense.id || '',
                executiveId: expense.executiveId,
                description,
                amount,
                expenseDate,
                type,
                entityType,
                categoryId: categoryId || undefined,
                status,
                receiptUrl,
            }),
        );
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
                <AppLabel className="mb-2">Tipo de Lançamento</AppLabel>
                <div className="flex flex-wrap gap-4">
                    {(['A pagar', 'A receber'] as ExpenseType[]).map(t => (
                        <label key={t} className="flex cursor-pointer items-center">
                            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className={radioClass} />
                            <span className="ml-2 text-sm text-slate-600">{t}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <AppLabel className="mb-2">Origem</AppLabel>
                <div className="flex flex-wrap gap-4">
                    {(['Pessoa Jurídica', 'Pessoa Física'] as ExpenseEntityType[]).map(ent => (
                        <label key={ent} className="flex cursor-pointer items-center">
                            <input type="radio" name="entityType" value={ent} checked={entityType === ent} onChange={() => setEntityType(ent)} className={radioClass} />
                            <span className="ml-2 text-sm text-slate-600">{ent}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <AppLabel htmlFor="description">Descrição</AppLabel>
                <AppInput id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <AppLabel htmlFor="amount">Valor (R$)</AppLabel>
                    <AppInput
                        id="amount"
                        type="number"
                        value={amount || ''}
                        onChange={e => setAmount(parseFloat(e.target.value))}
                        required
                        min={0.01}
                        step={0.01}
                        className="mt-1"
                    />
                </div>
                <div>
                    <AppLabel htmlFor="expenseDate">Data</AppLabel>
                    <AppInput id="expenseDate" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required className="mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <AppLabel htmlFor="category">Categoria</AppLabel>
                    <AppSelect id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1">
                        <option value="">Sem categoria</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </AppSelect>
                </div>
                <div>
                    <AppLabel htmlFor="status">Status</AppLabel>
                    <AppSelect id="status" value={status} onChange={e => setStatus(e.target.value as ExpenseStatus)} className="mt-1">
                        {statusOptions.map(s => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </AppSelect>
                </div>
            </div>
            <div>
                <AppLabel htmlFor="receiptUrl" optional>
                    URL do Recibo
                </AppLabel>
                <AppInput id="receiptUrl" type="url" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary">
                    Salvar Lançamento
                </AppButton>
            </FormActions>
        </form>
    );
};

const FinancesView: React.FC<FinancesViewProps> = ({ expenses, expenseCategories, executiveId, onRefresh }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    const categoriesForExecutive = useMemo(
        () => expenseCategories.filter((c) => c.executiveId === executiveId),
        [expenseCategories, executiveId],
    );

    // Filters for the table
    const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
    const [filterEntityType, setFilterEntityType] = useState<ExpenseEntityType | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    
    const [layout, setLayout] = useState<LayoutView>('table');
    const [limit, setLimit] = useState(10);
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
        setPageError(null);
        setEditingExpense({ executiveId });
        setModalOpen(true);
    };

    const handleEditExpense = (expense: Expense) => {
        setPageError(null);
        setEditingExpense(expense);
        setModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        setPageError(null);
        try {
            await expenseService.delete(expenseToDelete.id);
            await onRefresh();
            setExpenseToDelete(null);
        } catch (e) {
            console.error(e);
            setPageError(getApiErrorMessage(e, 'Não foi possível excluir o lançamento.'));
        }
    };
    
    const handleSaveExpense = async (expense: Expense) => {
        setPageError(null);
        try {
            if (editingExpense?.id) {
                await expenseService.update(editingExpense.id, expense);
            } else {
                await expenseService.create(expense);
            }
            await onRefresh();
            setModalOpen(false);
            setEditingExpense(null);
        } catch (e) {
            console.error(e);
            setPageError(getApiErrorMessage(e, 'Não foi possível salvar o lançamento.'));
        }
    };

    const getStatusBadgeClass = (status: ExpenseStatus) => ({
      'Pago': 'bg-green-100 text-green-800 border-green-500',
      'Recebida': 'bg-emerald-100 text-emerald-800 border-emerald-500',
      'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-500',
    }[status] || 'bg-slate-100 text-slate-800 border-slate-500');

    const getCategoryById = (categoryId?: string) => {
      if (!categoryId) return undefined;
      return expenseCategories.find(c => c.id === categoryId);
    };

    const getTagStyle = (color?: string) => {
      const safeColor = color || '#64748b';
      const hex = safeColor.replace('#', '');
      if (hex.length !== 6) return { backgroundColor: '#e2e8f0', color: '#334155' };
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return { backgroundColor: safeColor, color: luminance > 0.6 ? '#0f172a' : '#ffffff' };
    };
    
    const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatCurrency = (amount: number) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const renderItems = () => {
        if (paginatedExpenses.length === 0) return <div className="col-span-full text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Nenhum lançamento encontrado para os filtros aplicados.</p></div>;
        switch (layout) {
            case 'card': return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedExpenses.map(expense => {
                        const category = getCategoryById(expense.categoryId);
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
                                    <p>
                                      <strong>Categoria:</strong>{' '}
                                      {category ? (
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap inline-block" style={getTagStyle(category.color)}>
                                          {category.name}
                                        </span>
                                      ) : 'N/A'}
                                    </p>
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
                        const category = getCategoryById(expense.categoryId);
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
                                    {category ? (
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={getTagStyle(category.color)}>
                                          {category.name}
                                        </span>
                                    ) : (
                                        <span>N/A</span>
                                    )}
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
                <DataTable>
                    <DataTableHead>
                        <tr>
                            <DataTableTh>Descrição</DataTableTh>
                            <DataTableTh className="hidden md:table-cell">Data</DataTableTh>
                            <DataTableTh className="hidden lg:table-cell">Categoria</DataTableTh>
                            <DataTableTh>Valor</DataTableTh>
                            <DataTableTh>Status</DataTableTh>
                            <DataTableTh className="text-right">Ações</DataTableTh>
                        </tr>
                    </DataTableHead>
                    <DataTableBody>
                        {paginatedExpenses.map((expense) => {
                            const category = getCategoryById(expense.categoryId);
                            return (
                                <DataTableRow key={expense.id}>
                                    <DataTableTd className="font-medium text-slate-800">
                                        {expense.description}
                                        <p className="font-normal text-xs text-slate-500">{expense.entityType} - {expense.type}</p>
                                    </DataTableTd>
                                    <DataTableTd className="hidden md:table-cell text-slate-600">{formatDate(expense.expenseDate)}</DataTableTd>
                                    <DataTableTd className="hidden lg:table-cell text-slate-600">
                                      {category ? (
                                        <span className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold" style={getTagStyle(category.color)}>
                                          {category.name}
                                        </span>
                                      ) : null}
                                    </DataTableTd>
                                    <DataTableTd className={`font-medium ${expense.type === 'A receber' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(expense.amount)}</DataTableTd>
                                    <DataTableTd><span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span></DataTableTd>
                                    <DataTableTd className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button type="button" onClick={() => handleEditExpense(expense)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-indigo-600" aria-label="Editar"><EditIcon /></button>
                                            <button type="button" onClick={() => setExpenseToDelete(expense)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-red-600" aria-label="Excluir"><DeleteIcon /></button>
                                        </div>
                                    </DataTableTd>
                                </DataTableRow>
                            );
                        })}
                    </DataTableBody>
                </DataTable>
            );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <FormDangerAlert message={pageError} />
            <div className="flex flex-wrap justify-end items-center gap-2">
                <AppButton
                    type="button"
                    variant="primary"
                    onClick={handleAddExpense}
                    className="!p-2"
                    title="Novo lançamento"
                    aria-label="Novo lançamento"
                >
                    <PlusIcon />
                </AppButton>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Gerenciar categorias de finanças"
                    aria-label="Gerenciar categorias de finanças"
                    onClick={() => setCategoryModalOpen(true)}
                >
                    <CogIcon />
                </AppButton>
            </div>

            <ToolbarPanel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ViewSwitcher layout={layout} setLayout={setLayout} />
                <div className="flex items-center gap-2">
                    <AppLabel htmlFor="limit" className="mb-0 inline text-slate-600">
                        Itens por página
                    </AppLabel>
                    <AppSelect id="limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-auto min-w-[5rem]">
                        <option value={10}>10</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                    </AppSelect>
                </div>
            </ToolbarPanel>

            <ToolbarPanel className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <AppLabel htmlFor="filter-type">Tipo</AppLabel>
                        <AppSelect id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as ExpenseType | 'all')} className="mt-1">
                            <option value="all">Todos</option>
                            <option value="A pagar">A pagar</option>
                            <option value="A receber">A receber</option>
                        </AppSelect>
                    </div>
                    <div>
                        <AppLabel htmlFor="filter-entity">Origem</AppLabel>
                        <AppSelect id="filter-entity" value={filterEntityType} onChange={e => setFilterEntityType(e.target.value as ExpenseEntityType | 'all')} className="mt-1">
                            <option value="all">Todas</option>
                            <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                            <option value="Pessoa Física">Pessoa Física</option>
                        </AppSelect>
                    </div>
                    <div>
                        <AppLabel htmlFor="filter-category">Categoria</AppLabel>
                        <AppSelect id="filter-category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1">
                            <option value="all">Todas</option>
                            {categoriesForExecutive.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </AppSelect>
                    </div>
                </div>
            </ToolbarPanel>

             <div>
                {renderItems()}
                {filteredExpensesForTable.length > 0 && (
                     <div className="mt-6">
                        <Pagination currentPage={currentPage} totalItems={filteredExpensesForTable.length} itemsPerPage={limit} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title={editingExpense?.id ? 'Editar lançamento' : 'Novo lançamento'} onClose={() => setModalOpen(false)}>
                    <ExpenseForm expense={editingExpense || {}} onSave={handleSaveExpense} onCancel={() => { setModalOpen(false); setEditingExpense(null); }} categories={categoriesForExecutive} />
                </Modal>
            )}
            
            <CategorySettingsModal
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                categories={categoriesForExecutive}
                executiveId={executiveId}
                onRefresh={onRefresh}
            />

            {expenseToDelete && <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o lançamento "${expenseToDelete.description}"?`} />}
        </div>
    );
};

export default FinancesView;