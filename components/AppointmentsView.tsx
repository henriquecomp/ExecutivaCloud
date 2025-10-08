
import React, { useState } from 'react';
import { Appointment } from '../types';
import Modal from './Modal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';

interface AppointmentsViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AppointmentForm: React.FC<{ appointment: Partial<Appointment>, onSave: (appointment: Appointment) => void, onCancel: () => void }> = ({ appointment, onSave, onCancel }) => {
    const [title, setTitle] = useState(appointment.title || '');
    const [location, setLocation] = useState(appointment.location || '');
    const [date, setDate] = useState(appointment.date || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(appointment.time || '09:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !time) return;
        onSave({
            id: appointment.id || new Date().toISOString(),
            title,
            location,
            date,
            time,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">Título</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">Local ou Link</label>
                <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data</label>
                  <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="time" className="block text-sm font-medium text-slate-700">Horário</label>
                  <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Compromisso</button>
            </div>
        </form>
    );
};

const AppointmentsView: React.FC<AppointmentsViewProps> = ({ appointments, setAppointments }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);

    const handleAddAppointment = () => {
        setEditingAppointment({});
        setModalOpen(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setModalOpen(true);
    };

    const handleDeleteAppointment = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este compromisso?')) {
            setAppointments(appointments.filter(a => a.id !== id));
        }
    };
    
    const handleSaveAppointment = (appointment: Appointment) => {
        if (editingAppointment && editingAppointment.id) {
            setAppointments(appointments.map(a => a.id === appointment.id ? appointment : a));
        } else {
            setAppointments([...appointments, appointment]);
        }
        setModalOpen(false);
        setEditingAppointment(null);
    };
    
    const sortedAppointments = [...appointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + timeZoneOffset);
        return adjustedDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Agenda de Compromissos</h2>
                    <p className="text-slate-500 mt-1">Visualize e gerencie seus próximos eventos.</p>
                </div>
                <button onClick={handleAddAppointment} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                    <PlusIcon />
                    Novo Compromisso
                </button>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4">
              {sortedAppointments.length > 0 ? sortedAppointments.map(appointment => (
                  <div key={appointment.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 border-l-4 border-purple-500">
                      <div className="flex-shrink-0 text-center bg-purple-600 text-white rounded-lg p-3 w-24">
                          <p className="text-3xl font-bold">{appointment.time.substring(0, 5)}</p>
                          <p className="text-sm">{new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' })}</p>
                      </div>
                      <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800">{appointment.title}</h3>
                          <p className="text-slate-500">{appointment.location}</p>
                          <p className="text-sm text-slate-400 mt-1">{formatDate(appointment.date)}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-1">
                          <button onClick={() => handleEditAppointment(appointment)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition">
                              <EditIcon />
                          </button>
                          <button onClick={() => handleDeleteAppointment(appointment.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition">
                              <DeleteIcon />
                          </button>
                      </div>
                  </div>
              )) : (
                <p className="text-center p-6 text-slate-500">Nenhum compromisso agendado.</p>
              )}
            </div>

            {isModalOpen && (
                <Modal title={editingAppointment?.id ? 'Editar Compromisso' : 'Novo Compromisso'} onClose={() => setModalOpen(false)}>
                    <AppointmentForm appointment={editingAppointment || {}} onSave={handleSaveAppointment} onCancel={() => { setModalOpen(false); setEditingAppointment(null); }} />
                </Modal>
            )}
        </div>
    );
};

export default AppointmentsView;
