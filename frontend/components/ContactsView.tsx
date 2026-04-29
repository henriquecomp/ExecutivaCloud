import React, { useState, useMemo, useEffect } from 'react';
import { Contact, ContactType, LayoutView } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewSwitcher from './ViewSwitcher';
import { EditIcon, DeleteIcon, PlusIcon, EmailIcon, PhoneIcon, CogIcon } from './Icons';
import { FormDangerAlert } from './ui/FormDangerAlert';
import { contactTypeService } from '../services/contactTypeService';
import { contactService } from '../services/contactService';
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
import TypeColorFormField from './ui/TypeColorFormField';
import TypeColorSwatch from './ui/TypeColorSwatch';
import { typeMgmtDeleteIconBtn, typeMgmtEditIconBtn } from './ui/typeManagementStyles';
import AppSelect from './ui/AppSelect';
import AppTextarea from './ui/AppTextarea';
import FormActions from './ui/FormActions';
import ToolbarPanel from './ui/ToolbarPanel';

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
                <AppLabel htmlFor="ct-name">Nome do Tipo</AppLabel>
                <AppInput id="ct-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1" />
            </div>
            <TypeColorFormField
                id="ct-color"
                label="Cor da etiqueta"
                value={color}
                onChange={setColor}
                defaultColor="#64748b"
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

const ContactTypeSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    contactTypes: ContactType[];
    onRefresh: () => Promise<void>;
}> = ({ isOpen, onClose, contactTypes, onRefresh }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingContactType, setEditingContactType] = useState<Partial<ContactType> | null>(null);
    const [contactTypeToDelete, setContactTypeToDelete] = useState<ContactType | null>(null);
    const [typeActionError, setTypeActionError] = useState<string | null>(null);

    const handleSave = async (contactType: ContactType) => {
        setTypeActionError(null);
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
            setTypeActionError(getApiErrorMessage(error, 'Não foi possível salvar o tipo de contato.'));
        }
    };

    const confirmDelete = async () => {
        if (!contactTypeToDelete) return;
        setTypeActionError(null);
        try {
            await contactTypeService.delete(contactTypeToDelete.id);
            await onRefresh();
            setContactTypeToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir tipo de contato:', error);
            setTypeActionError(getApiErrorMessage(error, 'Não foi possível excluir o tipo de contato.'));
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Tipos de contato" onClose={onClose}>
            <div className="space-y-4">
                <FormDangerAlert message={typeActionError} />
                <div className="flex justify-end">
                    <AppButton
                        type="button"
                        variant="primary"
                        className="!p-2"
                        title="Adicionar tipo de contato"
                        aria-label="Adicionar tipo de contato"
                        onClick={() => { setEditingContactType({}); setFormModalOpen(true); }}
                    >
                        <PlusIcon />
                    </AppButton>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {contactTypes.map(ct => (
                       <li key={ct.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <TypeColorSwatch color={ct.color} size="md" />
                                <span className="truncate font-medium text-slate-800">{ct.name}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button type="button" aria-label="Editar tipo" onClick={() => { setEditingContactType(ct); setFormModalOpen(true); }} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                <button type="button" aria-label="Excluir tipo" onClick={() => setContactTypeToDelete(ct)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                            </div>
                        </li>
                    ))}
                    {contactTypes.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum tipo de contato cadastrado.</p>}
                </ul>
            </div>

            {isFormModalOpen && (
                <Modal title={editingContactType?.id ? 'Editar tipo' : 'Novo tipo'} onClose={() => setFormModalOpen(false)}>
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


const ContactForm: React.FC<{ contact: Partial<Contact>, onSave: (contact: Partial<Contact>) => void | Promise<void>, onCancel: () => void, contactTypes: ContactType[] }> = ({ contact, onSave, onCancel, contactTypes }) => {
    const [fullName, setFullName] = useState(contact.fullName || '');
    const [company, setCompany] = useState(contact.company || '');
    const [role, setRole] = useState(contact.role || '');
    const [email, setEmail] = useState(contact.email || '');
    const [phone, setPhone] = useState(contact.phone || '');
    const [notes, setNotes] = useState(contact.notes || '');
    const [contactTypeId, setContactTypeId] = useState(contact.contactTypeId || '');
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!fullName || !contact.executiveId) return;
        try {
            await Promise.resolve(
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
                }),
            );
        } catch (err: unknown) {
            setFormError(getApiErrorMessage(err, 'Não foi possível salvar o contato.'));
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <FormDangerAlert message={formError} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <AppLabel htmlFor="name">Nome Completo</AppLabel>
                    <AppInput id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <AppLabel htmlFor="contactType">Tipo de Contato</AppLabel>
                  <AppSelect id="contactType" value={contactTypeId} onChange={e => setContactTypeId(e.target.value)} className="mt-1">
                      <option value="">Sem tipo</option>
                      {contactTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                  </AppSelect>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <AppLabel htmlFor="company">Empresa</AppLabel>
                    <AppInput type="text" id="company" value={company} onChange={e => setCompany(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <AppLabel htmlFor="role">Cargo</AppLabel>
                    <AppInput type="text" id="role" value={role} onChange={e => setRole(e.target.value)} className="mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <AppLabel htmlFor="email">E-mail</AppLabel>
                    <AppInput type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <AppLabel htmlFor="phone">Telefone</AppLabel>
                    <AppInput type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" />
                </div>
            </div>
             <div>
                <AppLabel htmlFor="notes" optional>Anotações</AppLabel>
                <AppTextarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1" />
            </div>
            <FormActions>
                <AppButton type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </AppButton>
                <AppButton type="submit" variant="primary">
                    Salvar Contato
                </AppButton>
            </FormActions>
        </form>
    );
};

const ContactsView: React.FC<ContactsViewProps> = ({ contacts, contactTypes, executiveId, onRefresh }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [contactListError, setContactListError] = useState<string | null>(null);

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
        setContactListError(null);
        setEditingContact({ executiveId });
        setModalOpen(true);
    };

    const handleEditContact = (contact: Contact) => {
        setContactListError(null);
        setEditingContact(contact);
        setModalOpen(true);
    };

    const handleDeleteContact = (contact: Contact) => {
        setContactToDelete(contact);
    };
    
    const confirmDelete = async () => {
        if (contactToDelete) {
            setContactListError(null);
            try {
                await contactService.delete(contactToDelete.id);
                await onRefresh();
                setContactToDelete(null);
            } catch (error) {
                console.error('Erro ao excluir contato:', error);
                setContactListError(getApiErrorMessage(error, 'Não foi possível excluir o contato.'));
            }
        }
    };

    const normalizeContactPayload = (contact: Partial<Contact>): Partial<Contact> => {
        const cleanText = (value?: string) => {
            if (value == null) return undefined;
            const trimmed = value.trim();
            return trimmed === '' ? undefined : trimmed;
        };
        const contactTypeId =
            contact.contactTypeId == null || contact.contactTypeId === ''
                ? undefined
                : String(contact.contactTypeId);
        return {
            fullName: cleanText(contact.fullName) ?? '',
            company: cleanText(contact.company),
            role: cleanText(contact.role),
            email: cleanText(contact.email),
            phone: cleanText(contact.phone),
            notes: cleanText(contact.notes),
            contactTypeId,
            executiveId:
                contact.executiveId != null && contact.executiveId !== ''
                    ? String(contact.executiveId)
                    : undefined,
        };
    };

    const handleSaveContact = async (contact: Partial<Contact>) => {
        const payload = normalizeContactPayload(contact);
        if (editingContact?.id) {
            await contactService.update(editingContact.id, payload);
        } else {
            await contactService.create(payload);
        }
        await onRefresh();
        setModalOpen(false);
        setEditingContact(null);
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
                    <DataTable>
                        <DataTableHead>
                            <tr>
                                <DataTableTh>Nome</DataTableTh>
                                <DataTableTh className="hidden md:table-cell">Empresa</DataTableTh>
                                <DataTableTh className="hidden lg:table-cell">E-mail / Telefone</DataTableTh>
                                <DataTableTh>Tipo</DataTableTh>
                                <DataTableTh className="text-right">Ações</DataTableTh>
                            </tr>
                        </DataTableHead>
                        <DataTableBody>
                            {paginatedContacts.map((contact) => (
                                <DataTableRow key={contact.id}>
                                    <DataTableTd className="font-medium text-slate-800">{contact.fullName}</DataTableTd>
                                    <DataTableTd className="hidden md:table-cell text-slate-600">{contact.company}</DataTableTd>
                                    <DataTableTd className="hidden lg:table-cell text-sm text-slate-600">
                                        {contact.email && <p>{contact.email}</p>}
                                        {contact.phone && <p>{contact.phone}</p>}
                                    </DataTableTd>
                                    <DataTableTd className="text-slate-600">
                                        {contact.contactTypeId && (
                                            <span
                                                className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold"
                                                style={getTagStyle(getTypeById(contact.contactTypeId)?.color)}
                                            >
                                                {getTypeById(contact.contactTypeId)?.name}
                                            </span>
                                        )}
                                    </DataTableTd>
                                    <DataTableTd className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button type="button" onClick={() => handleEditContact(contact)} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                            <button type="button" onClick={() => handleDeleteContact(contact)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
                                        </div>
                                    </DataTableTd>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
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
                                    <button onClick={() => handleEditContact(contact)} className={typeMgmtEditIconBtn}><EditIcon /></button>
                                    <button onClick={() => handleDeleteContact(contact)} className={typeMgmtDeleteIconBtn}><DeleteIcon /></button>
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
                                    <button onClick={() => handleEditContact(contact)} className={typeMgmtEditIconBtn} aria-label="Editar contato"><EditIcon /></button>
                                    <button onClick={() => handleDeleteContact(contact)} className={typeMgmtDeleteIconBtn} aria-label="Excluir contato"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <FormDangerAlert message={contactListError} />
            <div className="flex flex-wrap justify-end items-center gap-2">
                <AppButton
                    type="button"
                    variant="primary"
                    onClick={handleAddContact}
                    className="!p-2"
                    title="Novo contato"
                    aria-label="Novo contato"
                >
                    <PlusIcon />
                </AppButton>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Gerenciar tipos de contato"
                    aria-label="Gerenciar tipos de contato"
                    onClick={() => setSettingsModalOpen(true)}
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

            <ToolbarPanel>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Filtrar por tipo:</span>
                    <button type="button" onClick={() => setFilterType('all')} className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Todos
                    </button>
                    {contactTypes.map(ct => (
                         <button
                            key={ct.id}
                            type="button"
                            onClick={() => setFilterType(ct.id)}
                            className="rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            style={filterType === ct.id ? getTagStyle(ct.color) : { backgroundColor: '#f1f5f9', color: '#475569' }}
                         >
                            {ct.name}
                        </button>
                    ))}
                </div>
            </ToolbarPanel>

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
                <Modal title={editingContact?.id ? 'Editar contato' : 'Novo contato'} onClose={() => setModalOpen(false)}>
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