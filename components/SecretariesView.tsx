import React, { useState } from 'react';
import { Secretary, Executive, User } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';

interface SecretariesViewProps {
  secretaries: Secretary[];
  setSecretaries: React.Dispatch<React.SetStateAction<Secretary[]>>;
  executives: Executive[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SecretaryForm: React.FC<{
    secretary: Partial<Secretary>, 
    onSave: (secretary: Secretary) => void, 
    onCancel: () => void, 
    executives: Executive[] 
}> = ({ secretary, onSave, onCancel, executives }) => {
    const [fullName, setFullName] = useState(secretary.fullName || '');
    const [email, setEmail] = useState(secretary.email || '');
    const [selectedExecutiveIds, setSelectedExecutiveIds] = useState<string[]>(secretary.executiveIds || []);

    const handleExecutiveToggle = (execId: string) => {
        setSelectedExecutiveIds(prev =>
            prev.includes(execId)
                ? prev.filter(id => id !== execId)
                : [...prev, execId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName) return;
        onSave({
            id: secretary.id || `sec_${new Date().getTime()}`,
            fullName,
            email,
            executiveIds: selectedExecutiveIds,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Executivos Atendidos</label>
                <div className="mt-2 p-3 border border-slate-300 rounded-md max-h-60 overflow-y-auto space-y-2">
                    {executives.length > 0 ? executives.map(exec => (
                        <div key={exec.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`exec-${exec.id}`}
                                checked={selectedExecutiveIds.includes(exec.id)}
                                onChange={() => handleExecutiveToggle(exec.id)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`exec-${exec.id}`} className="ml-3 block text-sm text-slate-600">{exec.fullName}</label>
                        </div>
                    )) : <p className="text-sm text-slate-500">Nenhum executivo cadastrado.</p>}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Secretária</button>
            </div>
        </form>
    );
};

const SecretariesView: React.FC<SecretariesViewProps> = ({ secretaries, setSecretaries, executives, setUsers }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSecretary, setEditingSecretary] = useState<Partial<Secretary> | null>(null);
    const [secretaryToDelete, setSecretaryToDelete] = useState<Secretary | null>(null);

    const handleAddSecretary = () => {
        setEditingSecretary({});
        setModalOpen(true);
    };

    const handleEditSecretary = (secretary: Secretary) => {
        setEditingSecretary(secretary);
        setModalOpen(true);
    };

    const handleDeleteSecretary = (secretary: Secretary) => {
        setSecretaryToDelete(secretary);
    };
    
    const confirmDelete = () => {
        if(secretaryToDelete) {
            setSecretaries(prev => prev.filter(s => s.id !== secretaryToDelete.id));
            setUsers(prev => prev.filter(u => u.secretaryId !== secretaryToDelete.id));
            setSecretaryToDelete(null);
        }
    };
    
    const handleSaveSecretary = (secretary: Secretary) => {
        if (editingSecretary && editingSecretary.id) {
            setSecretaries(prev => prev.map(s => s.id === secretary.id ? secretary : s));
            setUsers(users => users.map(u => u.secretaryId === secretary.id ? { ...u, fullName: secretary.fullName } : u));
        } else {
            setSecretaries(prev => [...prev, secretary]);
            setUsers(users => [...users, {
                id: `user_sec_${secretary.id}`,
                fullName: secretary.fullName,
                role: 'secretary',
                secretaryId: secretary.id,
            }]);
        }
        setModalOpen(false);
        setEditingSecretary(null);
    };

    const getExecutiveNames = (executiveIds: string[]): string => {
        return executiveIds
            .map(id => executives.find(exec => exec.id === id)?.fullName)
            .filter(Boolean)
            .join(', ');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Secretárias</h2>
                    <p className="text-slate-500 mt-1">Adicione e associe secretárias aos executivos.</p>
                </div>
                <button onClick={handleAddSecretary} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                    <PlusIcon />
                    Nova Secretária
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-slate-200 text-sm text-slate-500">
                            <tr>
                                <th className="p-3">Nome</th>
                                <th className="p-3 hidden md:table-cell">E-mail</th>
                                <th className="p-3">Executivos Atendidos</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {secretaries.map(sec => (
                                <tr key={sec.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{sec.fullName}</td>
                                    <td className="p-3 hidden md:table-cell text-slate-600">{sec.email || '-'}</td>
                                    <td className="p-3 text-slate-600 text-sm">{getExecutiveNames(sec.executiveIds) || '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleEditSecretary(sec)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar secretária">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDeleteSecretary(sec)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir secretária">
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {secretaries.length === 0 && <p className="text-center p-6 text-slate-500">Nenhuma secretária cadastrada.</p>}
                </div>
            </div>

            {isModalOpen && (
                <Modal title={editingSecretary?.id ? 'Editar Secretária' : 'Nova Secretária'} onClose={() => setModalOpen(false)}>
                    <SecretaryForm
                        secretary={editingSecretary || {}} 
                        onSave={handleSaveSecretary} 
                        onCancel={() => { setModalOpen(false); setEditingSecretary(null); }}
                        executives={executives}
                    />
                </Modal>
            )}

            {secretaryToDelete && (
                 <ConfirmationModal
                    isOpen={!!secretaryToDelete}
                    onClose={() => setSecretaryToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a secretária ${secretaryToDelete.fullName}? O usuário associado também será removido.`}
                />
            )}
        </div>
    );
};

export default SecretariesView;