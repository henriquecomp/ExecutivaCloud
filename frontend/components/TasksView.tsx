import React, { useState, useMemo, useEffect } from 'react';
import { Task, Priority, Status, RecurrenceRule, LayoutView } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import { EditIcon, DeleteIcon, PlusIcon, RecurrenceIcon, PrinterIcon } from './Icons';
import { downloadCsv, todayStamp } from '../utils/csvDownload';
import { FormDangerAlert } from './ui/FormDangerAlert';
import { taskService } from '../services/taskService';
import { getApiErrorMessage } from '../utils/apiError';
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from './ui/DataTable';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import AppTextarea from './ui/AppTextarea';
import FormActions from './ui/FormActions';
import { typeMgmtDeleteIconBtn, typeMgmtEditIconBtn } from './ui/typeManagementStyles';
import ToolbarPanel from './ui/ToolbarPanel';
import { checkboxClass, radioClass } from './ui/controlTokens';

interface TasksViewProps {
  tasks: Task[];
  executiveId: string;
  onRefresh: () => Promise<void>;
  layout: LayoutView;
}

const TaskForm: React.FC<{ task: Partial<Task>, onSave: (task: Partial<Task>, recurrence: RecurrenceRule | null) => void | Promise<void>, onCancel: () => void }> = ({ task, onSave, onCancel }) => {
    const [title, setTitle] = useState(task.title || '');
    const [description, setDescription] = useState(task.description || '');
    const [dueDate, setDueDate] = useState(task.dueDate || new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState<Priority>(task.priority || Priority.Medium);
    const [status, setStatus] = useState<Status>(task.status || Status.Todo);

    // Recurrence State
    const [isRecurrent, setIsRecurrent] = useState(!!task.recurrence);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>(task.recurrence || {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date(dueDate).getUTCDay()],
        count: 10
    });
    const [endType, setEndType] = useState(task.recurrence?.endDate ? 'on' : 'after');
    const [formError, setFormError] = useState<string | null>(null);

    const handleRecurrenceChange = (field: keyof RecurrenceRule, value: any) => {
        setRecurrence(prev => ({ ...prev, [field]: value }));
    };
    
    const handleDaysOfWeekChange = (dayIndex: number) => {
        const currentDays = recurrence.daysOfWeek || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex];
        handleRecurrenceChange('daysOfWeek', newDays.sort());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!title) return;

        let finalRecurrence: RecurrenceRule | null = null;
        if (isRecurrent) {
            finalRecurrence = { ...recurrence };
            if (endType === 'after') {
                delete finalRecurrence.endDate;
                const raw = recurrence.count;
                const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : parseInt(String(raw ?? ''), 10);
                finalRecurrence.count = Number.isFinite(n) && n >= 1 ? n : 1;
            } else {
                delete finalRecurrence.count;
                if (!finalRecurrence.endDate) finalRecurrence.endDate = new Date().toISOString().split('T')[0];
            }
            if (finalRecurrence.frequency !== 'weekly') {
                delete finalRecurrence.daysOfWeek;
            }
            if (finalRecurrence.frequency === 'weekly' && (!finalRecurrence.daysOfWeek || finalRecurrence.daysOfWeek.length === 0)) {
                setFormError('Para recorrência semanal, selecione pelo menos um dia da semana.');
                return;
            }
        }

        try {
            await Promise.resolve(onSave({ ...task, title, description, dueDate, priority, status }, finalRecurrence));
        } catch (err: unknown) {
            console.error('Erro ao salvar tarefa:', err);
            setFormError(getApiErrorMessage(err, 'Não foi possível salvar a tarefa.'));
        }
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <FormDangerAlert message={formError} />
             <div>
                <AppLabel htmlFor="title">Título</AppLabel>
                <AppInput type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" />
            </div>
            <div>
                <AppLabel htmlFor="description" optional>Descrição</AppLabel>
                <AppTextarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                  <AppLabel htmlFor="dueDate">Data de Vencimento da 1ª Tarefa</AppLabel>
                  <AppInput type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1" />
              </div>
              <div>
                  <AppLabel htmlFor="priority">Prioridade</AppLabel>
                  <AppSelect id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1">
                      {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </AppSelect>
              </div>
            </div>
            <div>
                <AppLabel htmlFor="status">Status</AppLabel>
                <AppSelect id="status" value={status} onChange={e => setStatus(e.target.value as Status)} className="mt-1">
                    {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                </AppSelect>
            </div>

            {/* Recurrence Section */}
            <div className="space-y-4 rounded-md border border-slate-200 p-4">
                <div className="flex items-center">
                    <input type="checkbox" id="isRecurrent" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className={checkboxClass}/>
                    <AppLabel htmlFor="isRecurrent" className="mb-0 ml-3 inline font-medium">
                        Tarefa Recorrente
                    </AppLabel>
                </div>
                {isRecurrent && (
                    <div className="animate-fade-in-fast space-y-4 pl-7">
                        <div className="flex flex-wrap items-center gap-2">
                             <span className="text-sm text-slate-600">Repetir a cada</span>
                             <AppInput type="number" value={recurrence.interval} onChange={e => handleRecurrenceChange('interval', parseInt(e.target.value, 10) || 1)} min={1} className="w-16 px-2 py-1"/>
                             <AppSelect
                                value={recurrence.frequency}
                                onChange={e => {
                                    const newFrequency = e.target.value as RecurrenceRule['frequency'];
                                    setRecurrence(prev => {
                                        const updated = { ...prev, frequency: newFrequency };
                                        if (newFrequency === 'weekly' && (!updated.daysOfWeek || updated.daysOfWeek.length === 0)) {
                                            const dayOfWeek = new Date(dueDate).getUTCDay();
                                            updated.daysOfWeek = [dayOfWeek];
                                        }
                                        return updated;
                                    });
                                }}
                                className="w-auto min-w-[7rem] px-2 py-1">
                                <option value="daily">dia(s)</option>
                                <option value="weekly">semana(s)</option>
                                <option value="monthly">mês(es)</option>
                                <option value="annually">ano(s)</option>
                             </AppSelect>
                        </div>
                        {recurrence.frequency === 'weekly' && (
                            <div>
                                <AppLabel className="mb-2">Nos dias:</AppLabel>
                                <div className="flex flex-wrap gap-2">
                                    {weekDays.map((day, index) => (
                                        <button type="button" key={day} onClick={() => handleDaysOfWeekChange(index)} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${recurrence.daysOfWeek?.includes(index) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                             <AppLabel className="mb-2">Termina:</AppLabel>
                             <div className="space-y-2">
                                <div className="flex items-center">
                                    <input type="radio" id="task-end-after" name="taskEndType" value="after" checked={endType === 'after'} onChange={e => setEndType(e.target.value)} className={radioClass}/>
                                    <label htmlFor="task-end-after" className="ml-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                        <span>Após</span>
                                        <AppInput type="number" disabled={endType !== 'after'} value={recurrence.count ?? ''} onChange={e => {
                                            const v = e.target.value;
                                            handleRecurrenceChange('count', v === '' ? undefined : parseInt(v, 10));
                                        }} min={1} className="w-16 px-2 py-1"/>
                                        <span>ocorrências</span>
                                    </label>
                                </div>
                                 <div className="flex items-center">
                                    <input type="radio" id="task-end-on" name="taskEndType" value="on" checked={endType === 'on'} onChange={e => setEndType(e.target.value)} className={radioClass}/>
                                    <label htmlFor="task-end-on" className="ml-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                        <span>Em</span>
                                        <AppInput type="date" disabled={endType !== 'on'} value={recurrence.endDate || ''} onChange={e => handleRecurrenceChange('endDate', e.target.value)} className="px-2 py-1"/>
                                    </label>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary">
                    Salvar Tarefa
                </AppButton>
            </FormActions>
        </form>
    );
};

// Helper to generate recurring tasks
const generateRecurringTasks = (baseTask: Partial<Task>, rule: RecurrenceRule, recurrenceId: string): Partial<Task>[] => {
    const newTasks: Partial<Task>[] = [];
    const { frequency, interval, daysOfWeek, count, endDate } = rule;
    const { title, description, priority, status, executiveId } = baseTask;

    if (!baseTask.dueDate || !executiveId) return [];

    if (frequency === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
        return [];
    }

    let currentDate = new Date(baseTask.dueDate + 'T00:00:00'); // Use UTC to avoid timezone issues
    const finalDate = endDate ? new Date(endDate + 'T23:59:59') : null;

    let occurrences = 0;
    const maxOccurrences = count != null && Number.isFinite(count) && count >= 1 ? count : 100; // Safety limit

    while (occurrences < maxOccurrences && (!finalDate || currentDate <= finalDate)) {
        if (frequency === 'weekly') {
            // Iterate through days to find the next valid one
            while (true) {
                if (daysOfWeek.includes(currentDate.getUTCDay())) {
                     if ((!finalDate || currentDate <= finalDate)) {
                        newTasks.push({
                            title: title!,
                            dueDate: currentDate.toISOString().split('T')[0],
                            priority: priority!,
                            status: status!,
                            executiveId: executiveId,
                            recurrenceId: recurrenceId,
                            recurrence: rule,
                            description
                        });
                        occurrences++;
                     }
                }
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                // If we've passed a full week, jump by the interval
                if (currentDate.getUTCDay() === new Date(baseTask.dueDate + 'T00:00:00').getUTCDay()) {
                     currentDate.setUTCDate(currentDate.getUTCDate() + 7 * (interval -1));
                     break;
                }
            }
        } else {
             newTasks.push({
                title: title!,
                dueDate: currentDate.toISOString().split('T')[0],
                priority: priority!,
                status: status!,
                executiveId: executiveId,
                recurrenceId: recurrenceId,
                recurrence: rule,
                description
            });
            occurrences++;

            switch (frequency) {
                case 'daily': currentDate.setUTCDate(currentDate.getUTCDate() + interval); break;
                case 'monthly': currentDate.setUTCMonth(currentDate.getUTCMonth() + interval); break;
                case 'annually': currentDate.setUTCFullYear(currentDate.getUTCFullYear() + interval); break;
            }
        }
        if (newTasks.length >= maxOccurrences) break;
    }

    return count != null && Number.isFinite(count) && count >= 1 ? newTasks.slice(0, count) : newTasks;
};


const TasksView: React.FC<TasksViewProps> = ({ tasks, executiveId, onRefresh, layout }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [showRecurrenceDeleteModal, setShowRecurrenceDeleteModal] = useState(false);
    const [listActionError, setListActionError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Status | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
    
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const handleAddTask = () => {
        setListActionError(null);
        setEditingTask({ executiveId });
        setModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setListActionError(null);
        setEditingTask(task);
        setModalOpen(true);
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        if (task.recurrenceId) {
            setShowRecurrenceDeleteModal(true);
        }
    };
    
    const confirmDelete = async () => {
        if (!taskToDelete) return;
        setListActionError(null);
        try {
            await taskService.delete(taskToDelete.id);
            await onRefresh();
            setTaskToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            setListActionError(getApiErrorMessage(error, 'Não foi possível excluir a tarefa.'));
        }
    };
    
    const executeRecurrenceDelete = async (type: 'one' | 'all' | 'future') => {
        if (!taskToDelete) return;
        setListActionError(null);
        try {
            if (type === 'one') {
                await taskService.delete(taskToDelete.id);
            } else if (taskToDelete.recurrenceId) {
                await taskService.deleteByRecurrence(
                    taskToDelete.recurrenceId,
                    type === 'future' ? taskToDelete.dueDate : undefined,
                );
            }
            await onRefresh();
            setShowRecurrenceDeleteModal(false);
            setTaskToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir recorrencia:', error);
            setListActionError(getApiErrorMessage(error, 'Não foi possível excluir a recorrência da tarefa.'));
        }
    };

    const handleSaveTask = async (taskData: Partial<Task>, recurrenceRule: RecurrenceRule | null) => {
        const fullTaskData = { ...taskData, executiveId };
        const editingRow = fullTaskData.id ? tasks.find((t) => t.id === fullTaskData.id) : undefined;
        const oldRecurrenceId = editingRow?.recurrenceId;

        const normalizeRecurrenceForApi = (rule: RecurrenceRule): RecurrenceRule => {
            const out: RecurrenceRule = {
                frequency: rule.frequency,
                interval: Number.isFinite(rule.interval) && rule.interval >= 1 ? rule.interval : 1,
            };
            if (rule.daysOfWeek?.length) {
                out.daysOfWeek = [...rule.daysOfWeek].sort((a, b) => a - b);
            }
            if (rule.endDate) {
                out.endDate = rule.endDate;
            }
            if (rule.count != null && Number.isFinite(rule.count) && rule.count >= 1) {
                out.count = rule.count;
            }
            return out;
        };

        const toPayload = (task: Partial<Task>) => {
            const { id: _id, ...rest } = task;
            const payload = { ...rest } as Partial<Task>;
            if (payload.recurrence) {
                payload.recurrence = normalizeRecurrenceForApi(payload.recurrence);
            }
            return payload;
        };

        if (recurrenceRule) {
            const normalizedRule = normalizeRecurrenceForApi(recurrenceRule);
            const newRecurrenceId = `recur_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const newSeries = generateRecurringTasks(fullTaskData, normalizedRule, newRecurrenceId);

            if (newSeries.length === 0) {
                throw new Error(
                    'Não foi possível gerar ocorrências com a recorrência e datas informadas. Ajuste o período ou a data final.',
                );
            }

            await taskService.createBulk(newSeries.map(toPayload));

            if (oldRecurrenceId) {
                await taskService.deleteByRecurrence(oldRecurrenceId);
            } else if (fullTaskData.id) {
                await taskService.delete(fullTaskData.id);
            }
        } else {
            const singlePayload = {
                ...fullTaskData,
                recurrenceId: undefined,
                recurrence: undefined,
            };

            if (oldRecurrenceId) {
                await taskService.create(toPayload(singlePayload));
                await taskService.deleteByRecurrence(oldRecurrenceId);
            } else if (fullTaskData.id) {
                await taskService.update(fullTaskData.id, singlePayload);
            } else {
                await taskService.create(toPayload(singlePayload));
            }
        }

        await onRefresh();
        setModalOpen(false);
        setEditingTask(null);
    };

    const filteredTasks = useMemo(() => {
      const sorted = tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return sorted
        .filter(task => filter === 'all' || task.status === filter)
        .filter(task => priorityFilter === 'all' || task.priority === priorityFilter);
    }, [tasks, filter, priorityFilter]);

    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        return filteredTasks.slice(start, end);
    }, [filteredTasks, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit, tasks, filter, layout, priorityFilter]);

    const getPriorityBadgeClass = (priority: Priority) => {
      switch(priority) {
        case Priority.High: return 'bg-red-100 text-red-800 border-red-500';
        case Priority.Medium: return 'bg-yellow-100 text-yellow-800 border-yellow-500';
        case Priority.Low: return 'bg-blue-100 text-blue-800 border-blue-500';
        default: return 'bg-slate-100 text-slate-800 border-slate-500';
      }
    };

    const getStatusBadgeClass = (status: Status) => {
        switch(status) {
          case Status.Done: return 'bg-green-100 text-green-800 border-green-500';
          case Status.InProgress: return 'bg-purple-100 text-purple-800 border-purple-500';
          case Status.Todo: return 'bg-slate-100 text-slate-800 border-slate-500';
          default: return 'bg-slate-100 text-slate-800 border-slate-500';
        }
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + timeZoneOffset);
        return adjustedDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    const renderItems = () => {
        if (paginatedTasks.length === 0) {
             return (
                <div className="col-span-full text-center p-6 bg-white rounded-xl shadow-md">
                    <p className="text-slate-500">Nenhuma tarefa encontrada para este filtro.</p>
                </div>
            );
        }

        switch (layout) {
            case 'card':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTasks.map(task => (
                             <div key={task.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            {task.recurrenceId && <span className="text-slate-400" title="Tarefa Recorrente"><RecurrenceIcon className="w-4 h-4" /></span>}
                                            {task.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">Vencimento: {formatDate(task.dueDate)}</p>
                                </div>
                                <div className="flex justify-end items-center gap-1 mt-4">
                                    <button onClick={() => handleEditTask(task)} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(task)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
             case 'list':
                 return (
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4">
                        {paginatedTasks.map(task => (
                            <div key={task.id} className={`flex items-start space-x-4 p-4 rounded-lg bg-slate-50 border-l-4 ${getPriorityBadgeClass(task.priority)}`}>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                         <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            {task.recurrenceId && <span className="text-slate-400" title="Tarefa Recorrente"><RecurrenceIcon className="w-4 h-4" /></span>}
                                            {task.title}
                                        </h3>
                                         <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-500">Vencimento: {formatDate(task.dueDate)}</p>
                                    <span className={`mt-2 inline-block text-xs font-semibold px-2 py-1 rounded-full ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-1">
                                    <button onClick={() => handleEditTask(task)} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(task)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'table':
            default:
                 return (
                    <DataTable>
                        <DataTableHead>
                            <tr>
                                <DataTableTh>Título</DataTableTh>
                                <DataTableTh className="hidden md:table-cell">Prioridade</DataTableTh>
                                <DataTableTh className="hidden lg:table-cell">Vencimento</DataTableTh>
                                <DataTableTh>Status</DataTableTh>
                                <DataTableTh className="text-right">Ações</DataTableTh>
                            </tr>
                        </DataTableHead>
                        <DataTableBody>
                            {paginatedTasks.map((task) => (
                                <DataTableRow key={task.id}>
                                    <DataTableTd className="font-medium text-slate-800">
                                        <div className="flex items-center gap-2">
                                            {task.recurrenceId && <span className="text-slate-400" title="Tarefa Recorrente"><RecurrenceIcon className="h-4 w-4" /></span>}
                                            <span>{task.title}</span>
                                        </div>
                                        <p className="font-normal text-sm text-slate-500 md:hidden">{task.priority} - {formatDate(task.dueDate)}</p>
                                    </DataTableTd>
                                    <DataTableTd className="hidden md:table-cell">
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                                    </DataTableTd>
                                    <DataTableTd className="hidden lg:table-cell text-slate-600">{formatDate(task.dueDate)}</DataTableTd>
                                    <DataTableTd>
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                                    </DataTableTd>
                                    <DataTableTd className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button type="button" onClick={() => handleEditTask(task)} className={typeMgmtEditIconBtn} aria-label="Editar"><EditIcon /></button>
                                            <button type="button" onClick={() => handleDeleteClick(task)} className={typeMgmtDeleteIconBtn} aria-label="Excluir"><DeleteIcon /></button>
                                        </div>
                                    </DataTableTd>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                );
        }
    }


    return (
        <div className="space-y-6 animate-fade-in">
            <FormDangerAlert message={listActionError} />
            <div className="flex flex-wrap items-center justify-end gap-2">
                <AppSelect id="limit-tasks" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-auto min-w-[5rem]" aria-label="Itens por página">
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                </AppSelect>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Exportar resultados para CSV"
                    aria-label="Exportar resultados para CSV"
                    onClick={() => {
                        const rows = filteredTasks.map(t => ({
                            Título: t.title,
                            Descrição: t.description ?? '',
                            Prioridade: t.priority,
                            Status: t.status,
                            Vencimento: t.dueDate,
                        }));
                        downloadCsv(['Título', 'Descrição', 'Prioridade', 'Status', 'Vencimento'], rows, `tarefas_${todayStamp()}.csv`);
                    }}
                >
                    <PrinterIcon />
                </AppButton>
                <AppButton
                    type="button"
                    variant="primary"
                    onClick={handleAddTask}
                    className="!p-2"
                    title="Nova tarefa"
                    aria-label="Nova tarefa"
                >
                    <PlusIcon />
                </AppButton>
            </div>

            <ToolbarPanel className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Filtrar por status:</span>
                        {(['all', ...Object.values(Status)] as const).map(statusValue => (
                            <button type="button" key={statusValue} onClick={() => setFilter(statusValue)} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${filter === statusValue ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {statusValue === 'all' ? 'Todos' : statusValue}
                            </button>
                        ))}
                    </div>
                     <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                        <span className="text-sm font-medium text-slate-600">Filtrar por prioridade:</span>
                        {(['all', ...Object.values(Priority)] as const).map(priorityValue => (
                            <button type="button" key={priorityValue} onClick={() => setPriorityFilter(priorityValue)} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${priorityFilter === priorityValue ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {priorityValue === 'all' ? 'Todas' : priorityValue}
                            </button>
                        ))}
                    </div>
            </ToolbarPanel>

            <div>{renderItems()}</div>

             {filteredTasks.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredTasks.length}
                        itemsPerPage={limit}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}


            {isModalOpen && (
                <Modal title={editingTask?.id ? 'Editar tarefa' : 'Nova tarefa'} onClose={() => { setModalOpen(false); setEditingTask(null); }}>
                    <TaskForm task={editingTask || {}} onSave={handleSaveTask} onCancel={() => { setModalOpen(false); setEditingTask(null); }} />
                </Modal>
            )}

            {showRecurrenceDeleteModal && (
                <Modal title="Excluir Tarefa Recorrente" onClose={() => { setShowRecurrenceDeleteModal(false); setTaskToDelete(null); }}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Esta é uma tarefa recorrente. O que você gostaria de excluir?</p>
                        <div className="flex flex-col gap-3">
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('one')}>Apenas esta ocorrência</AppButton>
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('future')}>Esta e as futuras ocorrências</AppButton>
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('all')}>Toda a série</AppButton>
                        </div>
                    </div>
                </Modal>
            )}

            {taskToDelete && !taskToDelete.recurrenceId && (
                 <ConfirmationModal
                    isOpen={!!taskToDelete}
                    onClose={() => setTaskToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message="Tem certeza que deseja excluir esta tarefa?"
                />
            )}
        </div>
    );
};

export default TasksView;