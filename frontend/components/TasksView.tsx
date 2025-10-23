import React, { useState, useMemo, useEffect } from 'react';
import { Task, Priority, Status, RecurrenceRule, LayoutView } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewSwitcher from './ViewSwitcher';
import { EditIcon, DeleteIcon, PlusIcon, RecurrenceIcon } from './Icons';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  executiveId: string;
}

const TaskForm: React.FC<{ task: Partial<Task>, onSave: (task: Partial<Task>, recurrence: RecurrenceRule | null) => void, onCancel: () => void }> = ({ task, onSave, onCancel }) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        let finalRecurrence: RecurrenceRule | null = null;
        if (isRecurrent) {
            finalRecurrence = { ...recurrence };
            if (endType === 'after') {
                delete finalRecurrence.endDate;
                if (!finalRecurrence.count) finalRecurrence.count = 1;
            } else {
                delete finalRecurrence.count;
                if (!finalRecurrence.endDate) finalRecurrence.endDate = new Date().toISOString().split('T')[0];
            }
            if (finalRecurrence.frequency !== 'weekly') {
                delete finalRecurrence.daysOfWeek;
            }
        }
        
        onSave({ ...task, title, description, dueDate, priority, status }, finalRecurrence);
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">Título</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrição</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">Data de Vencimento da 1ª Tarefa</label>
                  <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-700">Prioridade</label>
                  <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </div>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                <select id="status" value={status} onChange={e => setStatus(e.target.value as Status)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Recurrence Section */}
            <div className="space-y-4 rounded-md border border-slate-200 p-4">
                <div className="flex items-center">
                    <input type="checkbox" id="isRecurrent" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                    <label htmlFor="isRecurrent" className="ml-3 block text-sm font-medium text-slate-700">Tarefa Recorrente</label>
                </div>
                {isRecurrent && (
                    <div className="space-y-4 pl-7 animate-fade-in-fast">
                        <div className="flex items-center gap-2">
                             <span className="text-sm text-slate-600">Repetir a cada</span>
                             <input type="number" value={recurrence.interval} onChange={e => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)} min="1" className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"/>
                             <select
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
                                className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm">
                                <option value="daily">dia(s)</option>
                                <option value="weekly">semana(s)</option>
                                <option value="monthly">mês(es)</option>
                                <option value="annually">ano(s)</option>
                             </select>
                        </div>
                        {recurrence.frequency === 'weekly' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nos dias:</label>
                                <div className="flex flex-wrap gap-2">
                                    {weekDays.map((day, index) => (
                                        <button type="button" key={day} onClick={() => handleDaysOfWeekChange(index)} className={`px-3 py-1 text-sm rounded-full transition ${recurrence.daysOfWeek?.includes(index) ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">Termina:</label>
                             <div className="space-y-2">
                                <div className="flex items-center">
                                    <input type="radio" id="end-after" name="endType" value="after" checked={endType === 'after'} onChange={e => setEndType(e.target.value)} className="h-4 w-4 text-indigo-600"/>
                                    <label htmlFor="end-after" className="ml-3 flex items-center gap-2 text-sm text-slate-600">
                                        <span>Após</span>
                                        <input type="number" disabled={endType !== 'after'} value={recurrence.count || ''} onChange={e => handleRecurrenceChange('count', parseInt(e.target.value))} min="1" className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"/>
                                        <span>ocorrências</span>
                                    </label>
                                </div>
                                 <div className="flex items-center">
                                    <input type="radio" id="end-on" name="endType" value="on" checked={endType === 'on'} onChange={e => setEndType(e.target.value)} className="h-4 w-4 text-indigo-600"/>
                                    <label htmlFor="end-on" className="ml-3 flex items-center gap-2 text-sm text-slate-600">
                                        <span>Em</span>
                                        <input type="date" disabled={endType !== 'on'} value={recurrence.endDate || ''} onChange={e => handleRecurrenceChange('endDate', e.target.value)} className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"/>
                                    </label>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Tarefa</button>
            </div>
        </form>
    );
};

// Helper to generate recurring tasks
const generateRecurringTasks = (baseTask: Partial<Task>, rule: RecurrenceRule, recurrenceId: string): Task[] => {
    const newTasks: Task[] = [];
    const { frequency, interval, daysOfWeek, count, endDate } = rule;
    const { title, description, priority, status, executiveId } = baseTask;

    if (!baseTask.dueDate || !executiveId) return [];

    let currentDate = new Date(baseTask.dueDate + 'T00:00:00'); // Use UTC to avoid timezone issues
    const finalDate = endDate ? new Date(endDate + 'T23:59:59') : null;

    let occurrences = 0;
    const maxOccurrences = count || 100; // Safety limit

    while (occurrences < maxOccurrences && (!finalDate || currentDate <= finalDate)) {
        if (frequency === 'weekly') {
            if (!daysOfWeek || daysOfWeek.length === 0) break;
            // Iterate through days to find the next valid one
            while (true) {
                if (daysOfWeek.includes(currentDate.getUTCDay())) {
                     if ((!finalDate || currentDate <= finalDate)) {
                        newTasks.push({
                            id: `task_${recurrenceId}_${newTasks.length}`,
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
                id: `task_${recurrenceId}_${occurrences}`,
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
    
    return newTasks.slice(0, count);
};


const TasksView: React.FC<TasksViewProps> = ({ tasks, setTasks, executiveId }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [showRecurrenceDeleteModal, setShowRecurrenceDeleteModal] = useState(false);
    const [filter, setFilter] = useState<Status | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
    
    const [layout, setLayout] = useLocalStorage<LayoutView>('tasksViewLayout', 'table');
    const [limit, setLimit] = useLocalStorage('tasksViewLimit', 10);
    const [currentPage, setCurrentPage] = useState(1);

    const handleAddTask = () => {
        setEditingTask({ executiveId });
        setModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setModalOpen(true);
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        if (task.recurrenceId) {
            setShowRecurrenceDeleteModal(true);
        }
    };
    
    const confirmDelete = () => {
        if (!taskToDelete) return;
        setTasks(allTasks => allTasks.filter(t => t.id !== taskToDelete.id));
        setTaskToDelete(null);
    };
    
    const executeRecurrenceDelete = (type: 'one' | 'all' | 'future') => {
        if (!taskToDelete) return;

        setTasks(allTasks => {
            if (type === 'one') {
                return allTasks.filter(t => t.id !== taskToDelete.id);
            }
            if (type === 'all') {
                return allTasks.filter(t => t.recurrenceId !== taskToDelete.recurrenceId);
            }
            if (type === 'future') {
                const seriesId = taskToDelete.recurrenceId;
                const taskDate = new Date(taskToDelete.dueDate);
                return allTasks.filter(t => {
                    if (t.recurrenceId !== seriesId) return true;
                    const tDate = new Date(t.dueDate);
                    return tDate < taskDate;
                });
            }
            return allTasks;
        });

        setShowRecurrenceDeleteModal(false);
        setTaskToDelete(null);
    };

    const handleSaveTask = (taskData: Partial<Task>, recurrenceRule: RecurrenceRule | null) => {
        const fullTaskData = { ...taskData, executiveId };

        setTasks(allTasks => {
            // Find the original task being edited to check if it was part of a series.
            const originalTask = editingTask?.id ? allTasks.find(t => t.id === editingTask.id) : null;
            const originalRecurrenceId = originalTask?.recurrenceId;

            // Start with a base set of tasks, removing the old series if it exists.
            let baseTasks = originalRecurrenceId
                ? allTasks.filter(t => t.recurrenceId !== originalRecurrenceId)
                : allTasks;

            if (recurrenceRule) {
                // If it's a recurring task (new or an edited series).
                // Use the old recurrence ID to maintain consistency, or create a new one.
                const recurrenceId = originalRecurrenceId || `recur_${new Date().getTime()}`;
                const newSeries = generateRecurringTasks(fullTaskData, recurrenceRule, recurrenceId);
                return [...baseTasks, ...newSeries];
            } else {
                // If it's a single, non-recurring task.
                if (fullTaskData.id) {
                    // This is an edit. Ensure the old version (if not part of the deleted series) is removed.
                    const tasksWithoutOld = baseTasks.filter(t => t.id !== fullTaskData.id);
                    // Add the updated task, ensuring recurrence properties are cleared.
                    const updatedTask = { ...fullTaskData, recurrenceId: undefined, recurrence: undefined } as Task;
                    return [...tasksWithoutOld, updatedTask];
                } else {
                    // This is a new single task.
                    const newId = `single_${new Date().getTime()}`;
                    return [...baseTasks, { ...fullTaskData, id: newId, recurrenceId: undefined, recurrence: undefined } as Task];
                }
            }
        });

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
                                    <button onClick={() => handleEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition"><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(task)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition"><DeleteIcon /></button>
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
                                    <button onClick={() => handleEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition"><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(task)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'table':
            default:
                 return (
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-slate-200 text-sm text-slate-500">
                                    <tr>
                                        <th className="p-3">Título</th>
                                        <th className="p-3 hidden md:table-cell">Prioridade</th>
                                        <th className="p-3 hidden lg:table-cell">Vencimento</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTasks.map(task => (
                                        <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    {task.recurrenceId && <span className="text-slate-400" title="Tarefa Recorrente"><RecurrenceIcon className="w-4 h-4" /></span>}
                                                    <span>{task.title}</span>
                                                </div>
                                                <p className="font-normal text-sm text-slate-500 md:hidden">{task.priority} - {formatDate(task.dueDate)}</p>
                                            </td>
                                            <td className="p-3 hidden md:table-cell">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                                            </td>
                                            <td className="p-3 hidden lg:table-cell text-slate-600">{formatDate(task.dueDate)}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => handleEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar"><EditIcon /></button>
                                                    <button onClick={() => handleDeleteClick(task)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
        }
    }


    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciador de Tarefas</h2>
                    <p className="text-slate-500 mt-1">Organize suas atividades e mantenha o foco no que importa.</p>
                </div>
                <button onClick={handleAddTask} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                    <PlusIcon />
                    Nova Tarefa
                </button>
            </header>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-white rounded-xl shadow-md">
                 <ViewSwitcher layout={layout} setLayout={setLayout} />
                 <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="limit" className="text-slate-600">Itens por página:</label>
                    <select id="limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value={10}>10</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        <span className="text-sm font-medium text-slate-600">Filtrar por status:</span>
                        {(['all', ...Object.values(Status)] as const).map(statusValue => (
                            <button key={statusValue} onClick={() => setFilter(statusValue)} className={`px-3 py-1 text-sm rounded-full transition ${filter === statusValue ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {statusValue === 'all' ? 'Todos' : statusValue}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center space-x-2 flex-wrap gap-y-2 border-t border-slate-200 pt-3">
                        <span className="text-sm font-medium text-slate-600">Filtrar por prioridade:</span>
                        {(['all', ...Object.values(Priority)] as const).map(priorityValue => (
                            <button key={priorityValue} onClick={() => setPriorityFilter(priorityValue)} className={`px-3 py-1 text-sm rounded-full transition ${priorityFilter === priorityValue ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {priorityValue === 'all' ? 'Todas' : priorityValue}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

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
                <Modal title={editingTask?.id ? 'Editar Tarefa' : 'Nova Tarefa'} onClose={() => { setModalOpen(false); setEditingTask(null); }}>
                    <TaskForm task={editingTask || {}} onSave={handleSaveTask} onCancel={() => { setModalOpen(false); setEditingTask(null); }} />
                </Modal>
            )}

            {showRecurrenceDeleteModal && (
                <Modal title="Excluir Tarefa Recorrente" onClose={() => { setShowRecurrenceDeleteModal(false); setTaskToDelete(null); }}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Esta é uma tarefa recorrente. O que você gostaria de excluir?</p>
                        <div className="flex flex-col space-y-3">
                             <button onClick={() => executeRecurrenceDelete('one')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Apenas esta ocorrência</button>
                             <button onClick={() => executeRecurrenceDelete('future')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Esta e as futuras ocorrências</button>
                             <button onClick={() => executeRecurrenceDelete('all')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Toda a série</button>
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