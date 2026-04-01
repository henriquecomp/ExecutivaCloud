import React, { useState, useMemo, useEffect } from 'react';
import { Contact, ContactType, LayoutView } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewSwitcher from './ViewSwitcher';
import { EditIcon, DeleteIcon, PlusIcon, EmailIcon, PhoneIcon, SettingsIcon } from './Icons';
import { contactTypeService } from '../services/contactTypeService';
import { contactService } from '../services/contactService';

interface ContactsViewProps {
  contacts: Contact[];
  contactTypes: ContactType[];
  executiveId: string;
  onRefresh: () => Promise<void>;
}

// --- Contact Type Management Components (Moved from SettingsView) ---
const ContactTypeForm: React.FC<{ contactType: Partial<ContactType>, onSave: (ct: ContactType) => void, onCancel: () => void }> = ({ contactType, onSave, onCancel }) => {
    const [name, setName] = useState(contactType.name || '');
    const [color, setColor] = useState(contactType.color || '#64748b');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ id: contactType.id || `ct_${new Date().getTime()}`, name, color });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="ct-name" className="block text-sm font-medium text-slate-700">Nome do Tipo</label>
                <input type="text" id="ct-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="ct-color" className="block text-sm font-medium text-slate-700">Cor da Etiqueta</label>
                <div className="mt-1 flex items-center gap-3">
                    <input
                        type="color"
                        id="ct-color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        placeholder="#64748b"
                        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar</button>
            </div>
        </form>
    );
};

const ContactTypeSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    contactTypes: ContactType[];
    onRefresh: () => Promise<void>;
}> = ({ isOpen, onClose, contactTypes, onRefresh }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingContactType, setEditingContactType] = useState<Partial<ContactType> | null>(null);
    const [contactTypeToDelete, setContactTypeToDelete] = useState<ContactType | null>(null);

    const handleSave = async (contactType: ContactType) => {
        try {
            if (editingContactType?.id) {
                await contactTypeService.update(editingContactType.id, { name: contactType.name, color: contactType.color });
            } else {
                await contactTypeService.create({ name: contactType.name, color: contactType.color });
            }
            await onRefresh();
            setFormModalOpen(false);
            setEditingContactType(null);
        } catch (error) {
            console.error('Erro ao salvar tipo de contato:', error);
            alert('Nao foi possivel salvar o tipo de contato.');
        }
    };

    const confirmDelete = async () => {
        if (!contactTypeToDelete) return;
        try {
            await contactTypeService.delete(contactTypeToDelete.id);
            await onRefresh();
            setContactTypeToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir tipo de contato:', error);
            alert('Nao foi possivel excluir o tipo de contato.');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Gerenciar Tipos de Contato" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => { setEditingContactType({}); setFormModalOpen(true); }} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition text-sm">
                        <PlusIcon /> Adicionar Tipo
                    </button>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {contactTypes.map(ct => (
                       <li key={ct.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-800">{ct.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingContactType(ct); setFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                <button onClick={() => setContactTypeToDelete(ct)} className="p-2 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                    {contactTypes.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum tipo de contato cadastrado.</p>}
                </ul>
            </div>

            {isFormModalOpen && (
                <Modal title={editingContactType?.id ? 'Editar Tipo de Contato' : 'Novo Tipo de Contato'} onClose={() => setFormModalOpen(false)}>
                    <ContactTypeForm contactType={editingContactType || {}} onSave={handleSave} onCancel={() => { setFormModalOpen(false); setEditingContactType(null); }} />
                </Modal>
            )}

            {contactTypeToDelete && (
                 <ConfirmationModal
                    isOpen={!!contactTypeToDelete}
                    onClose={() => setContactTypeToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o tipo de contato "${contactTypeToDelete.name}"?`}
                />
            )}
        </Modal>
    );
};


const ContactForm: React.FC<{ contact: Partial<Contact>, onSave: (contact: Partial<Contact>) => void, onCancel: () => void, contactTypes: ContactType[] }> = ({ contact, onSave, onCancel, contactTypes }) => {
    const [fullName, setFullName] = useState(contact.fullName || '');
    const [company, setCompany] = useState(contact.company || '');
    const [role, setRole] = useState(contact.role || '');
    const [email, setEmail] = useState(contact.email || '');
    const [phone, setPhone] = useState(contact.phone || '');
    const [notes, setNotes] = useState(contact.notes || '');
    const [contactTypeId, setContactTypeId] = useState(contact.contactTypeId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !contact.executiveId) return;
        onSave({
            id: contact.id,
            executiveId: contact.executiveId,
            fullName,
            company,
            role,
            email,
            phone,
            notes,
            contactTypeId,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input type="text" id="name" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="contactType" className="block text-sm font-medium text-slate-700">Tipo de Contato</label>
                  <select id="contactType" value={contactTypeId} onChange={e => setContactTypeId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Sem tipo</option>
                      {contactTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                  </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700">Empresa</label>
                    <input type="text" id="company" value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700">Cargo</label>
                    <input type="text" id="role" value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Telefone</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Anotações</label>
                <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Contato</button>
            </div>
        </form>
    );
};

const ContactsView: React.FC<ContactsViewProps> = ({ contacts, contactTypes, executiveId, onRefresh }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    const [layout, setLayout] = useState<LayoutView>('card');
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const getTypeById = (contactTypeId?: string) => {
        if (!contactTypeId) return undefined;
        return contactTypes.find(ct => ct.id === contactTypeId);
    };

    const getTagStyle = (color?: string) => {
        const safeColor = color || '#64748b';
        const hex = safeColor.replace('#', '');
        if (hex.length !== 6) {
            return { backgroundColor: '#e2e8f0', color: '#334155' };
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return {
            backgroundColor: safeColor,
            color: luminance > 0.6 ? '#0f172a' : '#ffffff',
        };
    };

    const filteredContacts = useMemo(() => {
        const sorted = [...contacts].sort((a, b) => a.fullName.localeCompare(b.fullName));
        if (filterType === 'all') {
          return sorted;
        }
        return sorted.filter(contact => contact.contactTypeId === filterType);
    }, [contacts, filterType]);

    const paginatedContacts = useMemo(() => {
        const start = (currentPage - 1) * limit;
        const end = start + limit;
        return filteredContacts.slice(start, end);
    }, [filteredContacts, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [limit, contacts, layout, filterType]);


    const handleAddContact = () => {
        setEditingContact({ executiveId });
        setModalOpen(true);
    };

    const handleEditContact = (contact: Contact) => {
        setEditingContact(contact);
        setModalOpen(true);
    };

    const handleDeleteContact = (contact: Contact) => {
        setContactToDelete(contact);
    };
    
    const confirmDelete = async () => {
        if (contactToDelete) {
            try {
                await contactService.delete(contactToDelete.id);
                await onRefresh();
                setContactToDelete(null);
            } catch (error) {
                console.error('Erro ao excluir contato:', error);
                alert('Nao foi possivel excluir o contato.');
            }
        }
    };

    const normalizeContactPayload = (contact: Partial<Contact>) => {
        const cleanText = (value?: string) => {
            if (value == null) return undefined;
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
        };
        return {
            fullName: cleanText(contact.fullName) ?? '',
            company: cleanText(contact.company),
            role: cleanText(contact.role),
            email: cleanText(contact.email),
            phone: cleanText(contact.phone),
            notes: cleanText(contact.notes),
            contactTypeId:
                contact.contactTypeId == null || contact.contactTypeId === ''
                    ? null
                    : Number(contact.contactTypeId),
            executiveId: Number(contact.executiveId),
        };
    };

    const handleSaveContact = async (contact: Partial<Contact>) => {
        try {
            const payload = normalizeContactPayload(contact);
            if (editingContact?.id) {
                await contactService.update(editingContact.id, payload);
            } else {
                await contactService.create(payload);
            }
            await onRefresh();
            setModalOpen(false);
            setEditingContact(null);
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
            alert('Nao foi possivel salvar o contato.');
        }
    };

    const renderItems = () => {
        if (paginatedContacts.length === 0) {
            return (
                <div className="col-span-full text-center p-6 bg-white rounded-xl shadow-md">
                    <p className="text-slate-500">Nenhum contato encontrado para este filtro.</p>
                </div>
            );
        }

        switch (layout) {
            case 'table':
                return (
                    <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-slate-200 text-sm text-slate-500">
                                <tr>
                                    <th className="p-3">Nome</th>
                                    <th className="p-3 hidden md:table-cell">Empresa</th>
                                    <th className="p-3 hidden lg:table-cell">E-mail / Telefone</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContacts.map(contact => (
                                    <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-800">{contact.fullName}</td>
                                        <td className="p-3 hidden md:table-cell text-slate-600">{contact.company}</td>
                                        <td className="p-3 hidden lg:table-cell text-slate-600 text-sm">
                                            {contact.email && <p>{contact.email}</p>}
                                            {contact.phone && <p>{contact.phone}</p>}
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            {contact.contactTypeId && (
                                                <span
                                                    className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                                                    style={getTagStyle(getTypeById(contact.contactTypeId)?.color)}
                                                >
                                                    {getTypeById(contact.contactTypeId)?.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => handleEditContact(contact)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition"><EditIcon /></button>
                                                <button onClick={() => handleDeleteContact(contact)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'list':
                return (
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4">
                        {paginatedContacts.map(contact => (
                             <div key={contact.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 border-l-4 border-indigo-500">
                                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                                    {contact.fullName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-slate-800">{contact.fullName}</h3>
                                        {contact.contactTypeId && (
                                            <span
                                                className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                                                style={getTagStyle(getTypeById(contact.contactTypeId)?.color)}
                                            >
                                                {getTypeById(contact.contactTypeId)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">{contact.company}</p>
                                    {contact.email && <p className="flex items-center text-slate-600 truncate text-sm mt-1"><EmailIcon className="text-slate-400" /> <a href={`mailto:${contact.email}`} className="ml-2 hover:underline">{contact.email}</a></p>}
                                    {contact.phone && <p className="flex items-center text-slate-600 text-sm"><PhoneIcon className="text-slate-400" /> <span className="ml-2">{contact.phone}</span></p>}
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-1">
                                    <button onClick={() => handleEditContact(contact)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition"><EditIcon /></button>
                                    <button onClick={() => handleDeleteContact(contact)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'card':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedContacts.map(contact => (
                            <div key={contact.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                                                {contact.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">{contact.fullName}</h3>
                                                <p className="text-sm text-slate-500">{contact.company}</p>
                                            </div>
                                        </div>
                                        {contact.contactTypeId && (
                                            <span
                                                className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                                                style={getTagStyle(getTypeById(contact.contactTypeId)?.color)}
                                            >
                                                {getTypeById(contact.contactTypeId)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        {contact.email && <p className="flex items-center text-slate-600 truncate"><EmailIcon className="text-slate-400" /> <a href={`mailto:${contact.email}`} className="ml-2 hover:underline">{contact.email}</a></p>}
                                        {contact.phone && <p className="flex items-center text-slate-600"><PhoneIcon className="text-slate-400" /> <span className="ml-2">{contact.phone}</span></p>}
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-1 mt-4">
                                    <button onClick={() => handleEditContact(contact)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar contato"><EditIcon /></button>
                                    <button onClick={() => handleDeleteContact(contact)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition" aria-label="Excluir contato"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Lista de Contatos</h2>
                    <p className="text-slate-500 mt-1">Sua rede profissional, sempre à mão.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleAddContact} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                        <PlusIcon />
                        Novo Contato
                    </button>
                     <button onClick={() => setSettingsModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-700 rounded-md shadow-sm hover:bg-indigo-200 transition" aria-label="Configurar Tipos de Contato">
                        <SettingsIcon />
                    </button>
                </div>
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
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <span className="text-sm font-medium text-slate-600">Filtrar por tipo:</span>
                    <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-sm rounded-full transition ${filterType === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos
                    </button>
                    {contactTypes.map(ct => (
                         <button
                            key={ct.id}
                            onClick={() => setFilterType(ct.id)}
                            className="px-3 py-1 text-sm rounded-full transition font-semibold"
                            style={filterType === ct.id ? getTagStyle(ct.color) : { backgroundColor: '#f1f5f9', color: '#475569' }}
                         >
                            {ct.name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                {renderItems()}
                {filteredContacts.length > 0 && (
                    <div className={layout !== 'table' ? "mt-6" : "bg-white p-4 rounded-b-xl shadow-md"}>
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredContacts.length}
                            itemsPerPage={limit}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title={editingContact?.id ? 'Editar Contato' : 'Novo Contato'} onClose={() => setModalOpen(false)}>
                    <ContactForm 
                        contact={editingContact || {}} 
                        onSave={handleSaveContact} 
                        onCancel={() => { setModalOpen(false); setEditingContact(null); }}
                        contactTypes={contactTypes}
                    />
                </Modal>
            )}

            <ContactTypeSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                contactTypes={contactTypes}
                onRefresh={onRefresh}
            />

            {contactToDelete && (
                 <ConfirmationModal
                    isOpen={!!contactToDelete}
                    onClose={() => setContactToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o contato ${contactToDelete.fullName}?`}
                />
            )}
        </div>
    );
};

export default ContactsView;