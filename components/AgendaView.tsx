import React, { useState, useEffect, useMemo } from 'react';
import { Event, EventType, RecurrenceRule } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import { EditIcon, DeleteIcon, PlusIcon, BellIcon, RecurrenceIcon, SettingsIcon } from './Icons';

interface AgendaViewProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  eventTypes: EventType[];
  setEventTypes: React.Dispatch<React.SetStateAction<EventType[]>>;
  executiveId: string;
}

// --- Event Type Management Components (Moved from SettingsView) ---
const EventTypeForm: React.FC<{ eventType: Partial<EventType>, onSave: (et: EventType) => void, onCancel: () => void }> = ({ eventType, onSave, onCancel }) => {
    const [name, setName] = useState(eventType.name || '');
    const [color, setColor] = useState(eventType.color || '#3b82f6');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ id: eventType.id || `et_${new Date().getTime()}`, name, color });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="et-name" className="block text-sm font-medium text-slate-700">Nome do Tipo</label>
                <input type="text" id="et-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="et-color" className="block text-sm font-medium text-slate-700">Cor</label>
                <div className="flex items-center gap-2">
                    <input type="color" id="et-color" value={color} onChange={e => setColor(e.target.value)} className="p-1 h-10 w-10 block bg-white border border-slate-300 rounded-md cursor-pointer" />
                    <input type="text" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar</button>
            </div>
        </form>
    );
};

const EventTypeSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    eventTypes: EventType[];
    setEventTypes: React.Dispatch<React.SetStateAction<EventType[]>>;
}> = ({ isOpen, onClose, eventTypes, setEventTypes }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingEventType, setEditingEventType] = useState<Partial<EventType> | null>(null);
    const [eventTypeToDelete, setEventTypeToDelete] = useState<EventType | null>(null);

    const handleSave = (eventType: EventType) => {
        setEventTypes(prev => editingEventType?.id ? prev.map(et => et.id === eventType.id ? eventType : et) : [...prev, eventType]);
        setFormModalOpen(false);
        setEditingEventType(null);
    };

    const confirmDelete = () => {
        if (!eventTypeToDelete) return;
        setEventTypes(prev => prev.filter(et => et.id !== eventTypeToDelete.id));
        setEventTypeToDelete(null);
    };
    
    if (!isOpen) return null;

    return (
        <Modal title="Gerenciar Tipos de Evento" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex justify-end">
                     <button onClick={() => { setEditingEventType({}); setFormModalOpen(true); }} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition text-sm">
                        <PlusIcon /> Adicionar Tipo
                    </button>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {eventTypes.map(et => (
                        <li key={et.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: et.color }}></span>
                                <span className="font-medium text-slate-800">{et.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingEventType(et); setFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                <button onClick={() => setEventTypeToDelete(et)} className="p-2 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                     {eventTypes.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum tipo de evento cadastrado.</p>}
                </ul>
            </div>

            {isFormModalOpen && (
                <Modal title={editingEventType?.id ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'} onClose={() => setFormModalOpen(false)}>
                    <EventTypeForm eventType={editingEventType || {}} onSave={handleSave} onCancel={() => { setFormModalOpen(false); setEditingEventType(null); }} />
                </Modal>
            )}

            {eventTypeToDelete && (
                <ConfirmationModal
                    isOpen={!!eventTypeToDelete}
                    onClose={() => setEventTypeToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o tipo de evento "${eventTypeToDelete.name}"?`}
                />
            )}
        </Modal>
    );
};


// --- Event Form Component ---
const EventForm: React.FC<{ event: Partial<Event>, onSave: (event: Partial<Event>, recurrence: RecurrenceRule | null) => void, onCancel: () => void, eventTypes: EventType[] }> = ({ event, onSave, onCancel, eventTypes }) => {
    const [title, setTitle] = useState(event.title || '');
    const [location, setLocation] = useState(event.location || '');
    const [description, setDescription] = useState(event.description || '');
    const [eventTypeId, setEventTypeId] = useState(event.eventTypeId || '');
    
    const [reminderValue, setReminderValue] = useState('');
    const [reminderUnit, setReminderUnit] = useState('minutes'); // 'minutes', 'hours', 'days'

    // Recurrence State
    const [isRecurrent, setIsRecurrent] = useState(!!event.recurrence);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>(event.recurrence || {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: event.startTime ? [new Date(event.startTime).getUTCDay()] : [],
        count: 10
    });
    const [endType, setEndType] = useState(event.recurrence?.endDate ? 'on' : 'after');


    // Handle datetime-local input which requires YYYY-MM-DDTHH:mm format
    const formatDateTimeForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const [startTime, setStartTime] = useState(formatDateTimeForInput(event.startTime));
    const [endTime, setEndTime] = useState(formatDateTimeForInput(event.endTime));

    // Populate reminder fields when editing an event
    useEffect(() => {
        if (event.reminderMinutes && event.reminderMinutes > 0) {
            const minutes = event.reminderMinutes;
            if (minutes >= 1440 && minutes % 1440 === 0) {
                setReminderValue((minutes / 1440).toString());
                setReminderUnit('days');
            } else if (minutes >= 60 && minutes % 60 === 0) {
                setReminderValue((minutes / 60).toString());
                setReminderUnit('hours');
            } else {
                setReminderValue(minutes.toString());
                setReminderUnit('minutes');
            }
        } else {
            setReminderValue('');
            setReminderUnit('minutes');
        }
    }, [event.reminderMinutes]);

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
        if (!title || !startTime || !endTime || !event.executiveId) return;
        
        const reminderInput = parseInt(reminderValue, 10);
        let totalMinutes: number | undefined = undefined;
        if (!isNaN(reminderInput) && reminderInput > 0) {
            switch (reminderUnit) {
                case 'days': totalMinutes = reminderInput * 24 * 60; break;
                case 'hours': totalMinutes = reminderInput * 60; break;
                default: totalMinutes = reminderInput; break;
            }
        }

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

        onSave({
            ...event,
            title,
            description,
            location,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            eventTypeId,
            reminderMinutes: totalMinutes,
        }, finalRecurrence);
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Standard Fields */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">Título</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="event-type" className="block text-sm font-medium text-slate-700">Tipo de Evento</label>
                  <select id="event-type" value={eventTypeId} onChange={e => setEventTypeId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Sem tipo</option>
                      {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                  </select>
              </div>
               <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">Local ou Link</label>
                <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-slate-700">Início do 1º Evento</label>
                  <input type="datetime-local" id="start-time" value={startTime} onChange={e => {setStartTime(e.target.value); setEndTime(e.target.value)}} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-slate-700">Fim do 1º Evento</label>
                  <input type="datetime-local" id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrição</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
             <div>
                <label htmlFor="reminder" className="block text-sm font-medium text-slate-700">Lembrete</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="number" id="reminder" value={reminderValue} onChange={e => setReminderValue(e.target.value)} placeholder="Não notificar" min="1" className="block w-24 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm" />
                    <select aria-label="Unidade de tempo para o lembrete" value={reminderUnit} onChange={e => setReminderUnit(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm">
                        <option value="minutes">minutos antes</option>
                        <option value="hours">horas antes</option>
                        <option value="days">dias antes</option>
                    </select>
                </div>
            </div>

             {/* Recurrence Section */}
             <div className="space-y-4 rounded-md border border-slate-200 p-4">
                <div className="flex items-center">
                    <input type="checkbox" id="isRecurrent" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                    <label htmlFor="isRecurrent" className="ml-3 block text-sm font-medium text-slate-700">Evento Recorrente</label>
                </div>
                {isRecurrent && (
                    <div className="space-y-4 pl-7 animate-fade-in-fast">
                        <div className="flex items-center gap-2 flex-wrap">
                             <span className="text-sm text-slate-600">Repetir a cada</span>
                             <input type="number" value={recurrence.interval} onChange={e => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)} min="1" className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"/>
                             <select
                                value={recurrence.frequency}
                                onChange={e => {
                                    const newFrequency = e.target.value as RecurrenceRule['frequency'];
                                    setRecurrence(prev => {
                                        const updated = { ...prev, frequency: newFrequency };
                                        if (newFrequency === 'weekly' && (!updated.daysOfWeek || updated.daysOfWeek.length === 0) && startTime) {
                                            const dayOfWeek = new Date(startTime).getUTCDay();
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
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Evento</button>
            </div>
        </form>
    );
};

// Helper to generate recurring events
const generateRecurringEvents = (baseEvent: Partial<Event>, rule: RecurrenceRule, recurrenceId: string): Event[] => {
    const newEvents: Event[] = [];
    if (!baseEvent.startTime || !baseEvent.endTime || !baseEvent.executiveId) return [];

    const baseStartTime = new Date(baseEvent.startTime);
    const baseEndTime = new Date(baseEvent.endTime);
    const duration = baseEndTime.getTime() - baseStartTime.getTime();
    
    let cursorDate = new Date(baseStartTime);
    const finalDate = rule.endDate ? new Date(rule.endDate + 'T23:59:59') : null;
    const maxOccurrences = rule.count || 100; // Safety limit
    let occurrences = 0;

    const createEventOnDate = (date: Date) => {
        const newEventStartTime = new Date(date);
        const newEventEndTime = new Date(newEventStartTime.getTime() + duration);
        newEvents.push({
            ...baseEvent,
            id: `evt_${recurrenceId}_${occurrences}`,
            startTime: newEventStartTime.toISOString(),
            endTime: newEventEndTime.toISOString(),
            recurrenceId,
            recurrence: rule,
        } as Event);
        occurrences++;
    };

    if (rule.frequency === 'weekly') {
        if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) return [];
        let weekStartDate = new Date(cursorDate);
        weekStartDate.setUTCDate(weekStartDate.getUTCDate() - weekStartDate.getUTCDay()); // Start of the week (Sunday)
        
        while (occurrences < maxOccurrences && (!finalDate || weekStartDate <= finalDate)) {
            for (const day of rule.daysOfWeek) {
                 let nextOccurrenceDate = new Date(weekStartDate);
                 nextOccurrenceDate.setUTCDate(nextOccurrenceDate.getUTCDate() + day);

                 if(nextOccurrenceDate >= cursorDate) {
                     if (occurrences < maxOccurrences && (!finalDate || nextOccurrenceDate <= finalDate)) {
                        createEventOnDate(nextOccurrenceDate);
                     }
                 }
            }
            weekStartDate.setUTCDate(weekStartDate.getUTCDate() + (7 * rule.interval));
        }

    } else {
         while (occurrences < maxOccurrences && (!finalDate || cursorDate <= finalDate)) {
             createEventOnDate(cursorDate);
             switch (rule.frequency) {
                case 'daily': cursorDate.setUTCDate(cursorDate.getUTCDate() + rule.interval); break;
                case 'monthly': cursorDate.setUTCMonth(cursorDate.getUTCMonth() + rule.interval); break;
                case 'annually': cursorDate.setUTCFullYear(cursorDate.getUTCFullYear() + rule.interval); break;
            }
         }
    }
    
    return newEvents.slice(0, rule.count);
};


const AgendaView: React.FC<AgendaViewProps> = ({ events, setEvents, eventTypes, setEventTypes, executiveId }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [showRecurrenceDeleteModal, setShowRecurrenceDeleteModal] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

    const [limit, setLimit] = useLocalStorage('agendaViewLimit', 10);
    const [currentPage, setCurrentPage] = useState(1);
    
    const sortedEvents = useMemo(() => 
        [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events]);

    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        return sortedEvents.slice(start, end);
    }, [sortedEvents, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit, events]);


    const handleAddEvent = () => {
        setEditingEvent({ executiveId });
        setModalOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setModalOpen(true);
    };

    const handleDeleteClick = (event: Event) => {
        setEventToDelete(event);
        if (event.recurrenceId) {
            setShowRecurrenceDeleteModal(true);
        }
    };
    
    const confirmDelete = () => {
        if (!eventToDelete) return;
        setEvents(allEvents => allEvents.filter(e => e.id !== eventToDelete.id));
        setEventToDelete(null);
    };

    const executeRecurrenceDelete = (type: 'one' | 'all' | 'future') => {
        if (!eventToDelete) return;

        setEvents(allEvents => {
            if (type === 'one') {
                return allEvents.filter(e => e.id !== eventToDelete.id);
            }
            const seriesId = eventToDelete.recurrenceId;
            if (type === 'all') {
                return allEvents.filter(e => e.recurrenceId !== seriesId);
            }
            if (type === 'future') {
                const eventStartTime = new Date(eventToDelete.startTime).getTime();
                return allEvents.filter(e => {
                    if (e.recurrenceId !== seriesId) return true;
                    return new Date(e.startTime).getTime() < eventStartTime;
                });
            }
            return allEvents;
        });
        
        setShowRecurrenceDeleteModal(false);
        setEventToDelete(null);
    };

    const handleSaveEvent = (eventData: Partial<Event>, recurrenceRule: RecurrenceRule | null) => {
         const fullEventData = { ...eventData, executiveId: executiveId };

         setEvents(allEvents => {
            // Remove the old series if it exists (for both editing recurrence and making it non-recurrent)
            const oldRecurrenceId = fullEventData.id ? allEvents.find(e => e.id === fullEventData.id)?.recurrenceId : undefined;
            let filteredEvents = oldRecurrenceId ? allEvents.filter(e => e.recurrenceId !== oldRecurrenceId) : allEvents;
            
            if (recurrenceRule) {
                const recurrenceId = oldRecurrenceId || `recur_${new Date().getTime()}`;
                const newSeries = generateRecurringEvents(fullEventData, recurrenceRule, recurrenceId);
                return [...filteredEvents, ...newSeries];
            } else {
                if (fullEventData.id) { // Editing a single event or a previously recurring event made single
                    return filteredEvents.filter(e => e.id !== fullEventData.id).concat(fullEventData as Event);
                } else { // New single event
                    return [...allEvents, { ...fullEventData, id: `single_${new Date().getTime()}` } as Event];
                }
            }
        });
        
        setModalOpen(false);
        setEditingEvent(null);
    };
    
    const formatFullDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const formatReminderText = (minutes: number): string => {
        if (minutes <= 0) return '';
        if (minutes >= 1440 && minutes % 1440 === 0) {
            const days = minutes / 1440;
            return `${days} ${days > 1 ? 'dias' : 'dia'} antes.`;
        }
        if (minutes >= 60 && minutes % 60 === 0) {
            const hours = minutes / 60;
            return `${hours} ${hours > 1 ? 'horas' : 'hora'} antes.`;
        }
        return `${minutes} minutos antes.`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Agenda de Eventos</h2>
                    <p className="text-slate-500 mt-1">Visualize e gerencie os próximos eventos.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleAddEvent} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                        <PlusIcon />
                        Novo Evento
                    </button>
                    <button onClick={() => setSettingsModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-700 rounded-md shadow-sm hover:bg-indigo-200 transition" aria-label="Configurar Tipos de Evento">
                        <SettingsIcon />
                    </button>
                </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 text-sm">
                <label htmlFor="limit" className="text-slate-600">Itens por página:</label>
                <select 
                    id="limit"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4">
              {paginatedEvents.length > 0 ? paginatedEvents.map(event => {
                  const eventType = eventTypes.find(et => et.id === event.eventTypeId);
                  return (
                      <div key={event.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50" style={{borderLeft: `4px solid ${eventType?.color || '#a855f7'}`}}>
                          <div className="flex-shrink-0 text-center bg-slate-700 text-white rounded-lg p-3 w-24">
                              <p className="text-3xl font-bold">{formatTime(event.startTime)}</p>
                              <p className="text-sm">{new Date(event.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                  {event.recurrenceId && <span className="text-slate-400" title="Evento recorrente"><RecurrenceIcon className="w-4 h-4" /></span>}
                                  {event.title}
                                </h3>
                                {eventType && <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{backgroundColor: eventType.color, color: '#fff'}}>{eventType.name}</span>}
                              </div>
                              <p className="text-slate-500">{event.location}</p>
                              {event.reminderMinutes && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                    <BellIcon className="w-4 h-4" /> Lembrete: {formatReminderText(event.reminderMinutes)}
                                </p>
                              )}
                              <p className="text-sm text-slate-400 mt-1">{formatFullDate(event.startTime)}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-1">
                              <button onClick={() => handleEditEvent(event)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar evento">
                                  <EditIcon />
                              </button>
                              <button onClick={() => handleDeleteClick(event)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir evento">
                                  <DeleteIcon />
                              </button>
                          </div>
                      </div>
                  )
              }) : (
                <div className="text-center p-6">
                    <p className="text-slate-500">Nenhum evento agendado para este executivo.</p>
                </div>
              )}
               {sortedEvents.length > 0 && (
                 <Pagination
                    currentPage={currentPage}
                    totalItems={sortedEvents.length}
                    itemsPerPage={limit}
                    onPageChange={setCurrentPage}
                 />
               )}
            </div>

            {isModalOpen && (
                <Modal title={editingEvent?.id ? 'Editar Evento' : 'Novo Evento'} onClose={() => setModalOpen(false)}>
                    <EventForm event={editingEvent || {}} onSave={handleSaveEvent} onCancel={() => { setModalOpen(false); setEditingEvent(null); }} eventTypes={eventTypes} />
                </Modal>
            )}
            
            <EventTypeSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                eventTypes={eventTypes}
                setEventTypes={setEventTypes}
            />

            {showRecurrenceDeleteModal && (
                <Modal title="Excluir Evento Recorrente" onClose={() => { setShowRecurrenceDeleteModal(false); setEventToDelete(null); }}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Este é um evento recorrente. O que você gostaria de excluir?</p>
                        <div className="flex flex-col space-y-3">
                             <button onClick={() => executeRecurrenceDelete('one')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Apenas esta ocorrência</button>
                             <button onClick={() => executeRecurrenceDelete('future')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Esta e as futuras ocorrências</button>
                             <button onClick={() => executeRecurrenceDelete('all')} className="w-full text-left px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition">Toda a série</button>
                        </div>
                    </div>
                </Modal>
            )}

            {eventToDelete && !eventToDelete.recurrenceId && (
                <ConfirmationModal
                    isOpen={!!eventToDelete}
                    onClose={() => setEventToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
                />
            )}
        </div>
    );
};

export default AgendaView;