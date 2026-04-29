import React, { useState, useEffect, useMemo } from 'react';
import { Event, EventType, RecurrenceRule } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import { EditIcon, DeleteIcon, PlusIcon, BellIcon, RecurrenceIcon, CogIcon } from './Icons';
import { FormDangerAlert } from './ui/FormDangerAlert';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';
import AppLabel from './ui/AppLabel';
import TypeColorFormField from './ui/TypeColorFormField';
import TypeColorSwatch from './ui/TypeColorSwatch';
import { typeMgmtDeleteIconBtn, typeMgmtEditIconBtn } from './ui/typeManagementStyles';
import AppSelect from './ui/AppSelect';
import AppTextarea from './ui/AppTextarea';
import FormActions from './ui/FormActions';
import ToolbarPanel from './ui/ToolbarPanel';
import { checkboxClass, radioClass } from './ui/controlTokens';
import { eventService } from '../services/eventService';
import { eventTypeService } from '../services/eventTypeService';
import { getApiErrorMessage } from '../utils/apiError';
import { toDatetimeLocalInputValue, todayDateInputValue } from '../utils/datetimeLocal';

interface AgendaViewProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  eventTypes: EventType[];
  setEventTypes: React.Dispatch<React.SetStateAction<EventType[]>>;
  executiveId: string;
  onRefresh: () => Promise<void>;
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
                <AppLabel htmlFor="et-name">Nome do Tipo</AppLabel>
                <AppInput id="et-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1" />
            </div>
            <TypeColorFormField
                id="et-color"
                label="Cor da etiqueta"
                value={color}
                onChange={setColor}
                defaultColor="#3b82f6"
            />
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

const EventTypeSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    eventTypes: EventType[];
    setEventTypes: React.Dispatch<React.SetStateAction<EventType[]>>;
    onRefresh: () => Promise<void>;
}> = ({ isOpen, onClose, eventTypes, setEventTypes, onRefresh }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingEventType, setEditingEventType] = useState<Partial<EventType> | null>(null);
    const [eventTypeToDelete, setEventTypeToDelete] = useState<EventType | null>(null);
    const [typeActionError, setTypeActionError] = useState<string | null>(null);

    const handleSave = async (eventType: EventType) => {
        setTypeActionError(null);
        try {
            if (editingEventType?.id) {
                await eventTypeService.update(eventType.id, {
                    name: eventType.name,
                    color: eventType.color,
                });
            } else {
                await eventTypeService.create({
                    name: eventType.name,
                    color: eventType.color,
                });
            }
            await onRefresh();
            setFormModalOpen(false);
            setEditingEventType(null);
        } catch (error) {
            console.error('Erro ao salvar tipo de evento:', error);
            setTypeActionError(getApiErrorMessage(error, 'Erro ao salvar tipo de evento.'));
        }
    };

    const confirmDelete = async () => {
        if (!eventTypeToDelete) return;
        setTypeActionError(null);
        try {
            await eventTypeService.delete(eventTypeToDelete.id);
            await onRefresh();
            setEventTypeToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir tipo de evento:', error);
            setTypeActionError(getApiErrorMessage(error, 'Erro ao excluir tipo de evento.'));
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal title="Tipos de evento" onClose={onClose}>
            <div className="space-y-4">
                <FormDangerAlert message={typeActionError} />
                <div className="flex justify-end">
                    <AppButton
                        type="button"
                        variant="primary"
                        className="!p-2"
                        title="Adicionar tipo de evento"
                        aria-label="Adicionar tipo de evento"
                        onClick={() => { setEditingEventType({}); setFormModalOpen(true); }}
                    >
                        <PlusIcon />
                    </AppButton>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {eventTypes.map(et => (
                        <li key={et.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <TypeColorSwatch color={et.color} size="md" />
                                <span className="truncate font-medium text-slate-800">{et.name}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button type="button" aria-label="Editar tipo" onClick={() => { setEditingEventType(et); setFormModalOpen(true); }} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                <button type="button" aria-label="Excluir tipo" onClick={() => setEventTypeToDelete(et)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                     {eventTypes.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum tipo de evento cadastrado.</p>}
                </ul>
            </div>

            {isFormModalOpen && (
                <Modal title={editingEventType?.id ? 'Editar tipo' : 'Novo tipo'} onClose={() => setFormModalOpen(false)}>
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
const EventForm: React.FC<{
    event: Partial<Event>;
    onSave: (event: Partial<Event>, recurrence: RecurrenceRule | null) => void | Promise<void>;
    onCancel: () => void;
    eventTypes: EventType[];
}> = ({ event, onSave, onCancel, eventTypes }) => {
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

    const [formError, setFormError] = useState<string | null>(null);

    // Handle datetime-local input which requires YYYY-MM-DDTHH:mm format
    const formatDateTimeForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const minDatetimeLocal = useMemo(() => toDatetimeLocalInputValue(new Date()), []);
    const minEndDateOnly = useMemo(() => todayDateInputValue(), []);

    const [startTime, setStartTime] = useState(() => {
        if (event.startTime) return formatDateTimeForInput(event.startTime);
        return toDatetimeLocalInputValue(new Date());
    });
    const [endTime, setEndTime] = useState(() => {
        if (event.endTime) return formatDateTimeForInput(event.endTime);
        if (event.startTime) {
            const s = new Date(event.startTime);
            return formatDateTimeForInput(new Date(s.getTime() + 3600000).toISOString());
        }
        return toDatetimeLocalInputValue(new Date(Date.now() + 3600000));
    });

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

    const handleStartTimeChange = (value: string) => {
        setStartTime(value);
        setFormError(null);
        const startMs = new Date(value).getTime();
        const endMs = new Date(endTime).getTime();
        if (!Number.isFinite(startMs)) return;
        if (!endTime || !Number.isFinite(endMs) || endMs <= startMs) {
            setEndTime(formatDateTimeForInput(new Date(startMs + 3600000).toISOString()));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
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

        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();
        const nowMs = Date.now();
        if (startMs < nowMs) {
            setFormError('A data e hora de início não podem ser no passado.');
            return;
        }
        if (endMs <= startMs) {
            setFormError('O horário de fim deve ser posterior ao de início.');
            return;
        }
        if (totalMinutes != null && startMs - totalMinutes * 60 * 1000 < nowMs) {
            setFormError(
                'O lembrete não pode cair no passado. Reduza o tempo de antecedência ou escolha um horário de início mais tarde.',
            );
            return;
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
            if (finalRecurrence.frequency === 'weekly' && (!finalRecurrence.daysOfWeek || finalRecurrence.daysOfWeek.length === 0)) {
                setFormError('Para recorrência semanal, selecione pelo menos um dia da semana.');
                return;
            }
        }

        try {
            await Promise.resolve(
                onSave(
                    {
                        ...event,
                        title,
                        description,
                        location,
                        startTime: new Date(startTime).toISOString(),
                        endTime: new Date(endTime).toISOString(),
                        eventTypeId,
                        reminderMinutes: totalMinutes,
                    },
                    finalRecurrence,
                ),
            );
        } catch (err: unknown) {
            console.error('Erro ao salvar evento:', err);
            setFormError(getApiErrorMessage(err, 'Erro ao salvar evento.'));
        }
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <FormDangerAlert message={formError} />
            {/* Standard Fields */}
            <div>
                <AppLabel htmlFor="title">Título</AppLabel>
                <AppInput type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                  <AppLabel htmlFor="event-type">Tipo de Evento</AppLabel>
                  <AppSelect id="event-type" value={eventTypeId} onChange={e => setEventTypeId(e.target.value)} className="mt-1">
                      <option value="">Sem tipo</option>
                      {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                  </AppSelect>
              </div>
               <div>
                <AppLabel htmlFor="location" optional>Local ou Link</AppLabel>
                <AppInput type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1" />
            </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                  <AppLabel htmlFor="start-time">Início do 1º Evento</AppLabel>
                  <AppInput
                    type="datetime-local"
                    id="start-time"
                    value={startTime}
                    min={minDatetimeLocal}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    onFocus={() => setFormError(null)}
                    required
                    className="mt-1"
                  />
              </div>
              <div>
                  <AppLabel htmlFor="end-time">Fim do 1º Evento</AppLabel>
                  <AppInput
                    type="datetime-local"
                    id="end-time"
                    value={endTime}
                    min={startTime || minDatetimeLocal}
                    onChange={e => {
                      setEndTime(e.target.value);
                      setFormError(null);
                    }}
                    required
                    className="mt-1"
                  />
              </div>
            </div>
             <div>
                <AppLabel htmlFor="description" optional>Descrição</AppLabel>
                <AppTextarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1" />
            </div>
             <div>
                <AppLabel htmlFor="reminder" optional>Lembrete</AppLabel>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <AppInput type="number" id="reminder" value={reminderValue} onChange={e => { setReminderValue(e.target.value); setFormError(null); }} placeholder="Não notificar" min={1} className="w-28" />
                    <AppSelect aria-label="Unidade de tempo para o lembrete" value={reminderUnit} onChange={e => setReminderUnit(e.target.value)} className="min-w-0 flex-1 sm:max-w-xs">
                        <option value="minutes">minutos antes</option>
                        <option value="hours">horas antes</option>
                        <option value="days">dias antes</option>
                    </AppSelect>
                </div>
            </div>

             {/* Recurrence Section */}
             <div className="space-y-4 rounded-md border border-slate-200 p-4">
                <div className="flex items-center">
                    <input type="checkbox" id="isRecurrent" checked={isRecurrent} onChange={e => setIsRecurrent(e.target.checked)} className={checkboxClass}/>
                    <AppLabel htmlFor="isRecurrent" className="mb-0 ml-3 inline font-medium">
                        Evento Recorrente
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
                                        if (newFrequency === 'weekly' && (!updated.daysOfWeek || updated.daysOfWeek.length === 0) && startTime) {
                                            const dayOfWeek = new Date(startTime).getUTCDay();
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
                                    <input type="radio" id="end-after" name="endType" value="after" checked={endType === 'after'} onChange={e => setEndType(e.target.value)} className={radioClass}/>
                                    <label htmlFor="end-after" className="ml-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                        <span>Após</span>
                                        <AppInput type="number" disabled={endType !== 'after'} value={recurrence.count || ''} onChange={e => handleRecurrenceChange('count', parseInt(e.target.value, 10))} min={1} className="w-16 px-2 py-1"/>
                                        <span>ocorrências</span>
                                    </label>
                                </div>
                                 <div className="flex items-center">
                                    <input type="radio" id="end-on" name="endType" value="on" checked={endType === 'on'} onChange={e => setEndType(e.target.value)} className={radioClass}/>
                                    <label htmlFor="end-on" className="ml-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                        <span>Em</span>
                                        <AppInput type="date" disabled={endType !== 'on'} min={minEndDateOnly} value={recurrence.endDate || ''} onChange={e => handleRecurrenceChange('endDate', e.target.value)} className="px-2 py-1"/>
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
                    Salvar Evento
                </AppButton>
            </FormActions>
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


const AgendaView: React.FC<AgendaViewProps> = ({ events, setEvents, eventTypes, setEventTypes, executiveId, onRefresh }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [showRecurrenceDeleteModal, setShowRecurrenceDeleteModal] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [listActionError, setListActionError] = useState<string | null>(null);

    const [limit, setLimit] = useState(10);
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
        setListActionError(null);
        setEditingEvent({ executiveId });
        setModalOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setListActionError(null);
        setEditingEvent(event);
        setModalOpen(true);
    };

    const handleDeleteClick = (event: Event) => {
        setEventToDelete(event);
        if (event.recurrenceId) {
            setShowRecurrenceDeleteModal(true);
        }
    };
    
    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setListActionError(null);
        try {
            await eventService.delete(eventToDelete.id);
            await onRefresh();
            setEventToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            setListActionError(getApiErrorMessage(error, 'Erro ao excluir evento.'));
        }
    };

    const executeRecurrenceDelete = async (type: 'one' | 'all' | 'future') => {
        if (!eventToDelete) return;
        setListActionError(null);
        try {
            if (type === 'one') {
                await eventService.delete(eventToDelete.id);
            } else if (eventToDelete.recurrenceId) {
                await eventService.deleteByRecurrence(
                    eventToDelete.recurrenceId,
                    type === 'future' ? eventToDelete.startTime : undefined,
                );
            }
            await onRefresh();
            setShowRecurrenceDeleteModal(false);
            setEventToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir recorrência:', error);
            setListActionError(getApiErrorMessage(error, 'Erro ao excluir recorrência.'));
        }
    };

    const handleSaveEvent = async (eventData: Partial<Event>, recurrenceRule: RecurrenceRule | null) => {
        const fullEventData = { ...eventData, executiveId: executiveId };
        const oldRecurrenceId = fullEventData.id
            ? events.find((e) => e.id === fullEventData.id)?.recurrenceId
            : undefined;

        const toPayload = (evt: Partial<Event>) => ({
            ...evt,
            id: undefined,
        });

        if (recurrenceRule) {
            const recurrenceId = oldRecurrenceId || `recur_${new Date().getTime()}`;
            const series = generateRecurringEvents(fullEventData, recurrenceRule, recurrenceId);
            if (series.length === 0) {
                throw new Error('Não foi possível gerar ocorrências com a recorrência informada. Verifique os dias ou o período.');
            }

            if (oldRecurrenceId) {
                await eventService.deleteByRecurrence(oldRecurrenceId);
            } else if (fullEventData.id) {
                await eventService.delete(fullEventData.id);
            }

            await eventService.createBulk(series.map(toPayload));
        } else {
            if (oldRecurrenceId) {
                await eventService.deleteByRecurrence(oldRecurrenceId);
                await eventService.create(toPayload(fullEventData));
            } else if (fullEventData.id) {
                await eventService.update(fullEventData.id, fullEventData);
            } else {
                await eventService.create(toPayload(fullEventData));
            }
        }

        await onRefresh();
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
            <FormDangerAlert message={listActionError} />
            <div className="flex flex-wrap justify-end items-center gap-2">
                <AppButton
                    type="button"
                    variant="primary"
                    onClick={handleAddEvent}
                    className="!p-2"
                    title="Novo evento"
                    aria-label="Novo evento"
                >
                    <PlusIcon />
                </AppButton>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Gerenciar tipos de evento"
                    aria-label="Gerenciar tipos de evento"
                    onClick={() => setSettingsModalOpen(true)}
                >
                    <CogIcon />
                </AppButton>
            </div>
            
            <ToolbarPanel className="flex flex-wrap items-center justify-end gap-2">
                <AppLabel htmlFor="limit-agenda" className="mb-0 inline text-slate-600">
                    Itens por página
                </AppLabel>
                <AppSelect
                    id="limit-agenda"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-auto min-w-[5rem]"
                >
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                </AppSelect>
            </ToolbarPanel>

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
                              <button type="button" onClick={() => handleEditEvent(event)} className={typeMgmtEditIconBtn} aria-label="Editar evento">
                                  <EditIcon />
                              </button>
                              <button type="button" onClick={() => handleDeleteClick(event)} className={typeMgmtDeleteIconBtn} aria-label="Excluir evento">
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
                <Modal title={editingEvent?.id ? 'Editar evento' : 'Novo evento'} onClose={() => { setModalOpen(false); setEditingEvent(null); }}>
                    <EventForm event={editingEvent || {}} onSave={handleSaveEvent} onCancel={() => { setModalOpen(false); setEditingEvent(null); }} eventTypes={eventTypes} />
                </Modal>
            )}
            
            <EventTypeSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                eventTypes={eventTypes}
                setEventTypes={setEventTypes}
                onRefresh={onRefresh}
            />

            {showRecurrenceDeleteModal && (
                <Modal title="Excluir Evento Recorrente" onClose={() => { setShowRecurrenceDeleteModal(false); setEventToDelete(null); }}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Este é um evento recorrente. O que você gostaria de excluir?</p>
                        <div className="flex flex-col gap-3">
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('one')}>Apenas esta ocorrência</AppButton>
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('future')}>Esta e as futuras ocorrências</AppButton>
                             <AppButton type="button" variant="secondary" className="w-full justify-start text-left" onClick={() => executeRecurrenceDelete('all')}>Toda a série</AppButton>
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