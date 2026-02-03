import React, { useState, useMemo, useRef } from 'react';
import { LegalOrganization, Organization, Department, Executive, Secretary, Event, Contact, Expense, Task, Document, User, LegalOrganizationCreate, LegalOrganizationUpdate, OrganizationUpdate, OrganizationCreate } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';
import { legalOrganizationService } from '@/services/legalOrganizationService';
import { organizationService } from '@/services/organizationService';

// --- Helper Functions ---
function validateCNPJ(cnpj: string): boolean {
    const cnpjClean = cnpj.replace(/[^\d]+/g, '');
    if (cnpjClean.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpjClean)) return false;
    let size = cnpjClean.length - 2;
    let numbers = cnpjClean.substring(0, size);
    const digits = cnpjClean.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = cnpjClean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    return true;
}

const maskCNPJ = (value: string) => {
    if (!value) return "";
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
    if (!value) return "";
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
};

interface LegalOrganizationsViewProps {
  currentUser: User;
  legalOrganizations: LegalOrganization[];
  setLegalOrganizations: React.Dispatch<React.SetStateAction<LegalOrganization[]>>;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  executives: Executive[];
  setExecutives: React.Dispatch<React.SetStateAction<Executive[]>>;
  secretaries: Secretary[];
  setSecretaries: React.Dispatch<React.SetStateAction<Secretary[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onRefresh: () => void;
}

const LegalOrganizationForm: React.FC<{ 
    legalOrganization: Partial<LegalOrganization>, 
    onSave: (legalOrganization: LegalOrganizationCreate | LegalOrganization) => void, 
    onCancel: () => void 
}> = ({ legalOrganization, onSave, onCancel }) => {
    const [name, setName] = useState(legalOrganization.name || '');
    const [cnpj, setCnpj] = useState(legalOrganization.cnpj || '');
    const [street, setStreet] = useState(legalOrganization.street || '');
    const [number, setNumber] = useState(legalOrganization.number || '');
    const [neighborhood, setNeighborhood] = useState(legalOrganization.neighborhood || '');
    const [city, setCity] = useState(legalOrganization.city || '');
    const [state, setState] = useState(legalOrganization.state || '');
    const [zipCode, setZipCode] = useState(legalOrganization.zipCode || '');

    const [cnpjError, setCnpjError] = useState('');
    const [cepError, setCepError] = useState('');
    const [isCepLoading, setIsCepLoading] = useState(false);
    const cnpjInputRef = useRef<HTMLInputElement>(null);

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cnpjError) setCnpjError('');
        setCnpj(maskCNPJ(e.target.value));
    };

    const handleCnpjBlur = () => {
        if (cnpj && !validateCNPJ(cnpj)) {
            setCnpjError('CNPJ inválido. Verifique o número e tente novamente.');
        } else {
            setCnpjError('');
        }
    };

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cepError) setCepError('');
        setZipCode(maskCEP(e.target.value));
    };

    const handleCepBlur = async () => {
        const cepClean = zipCode.replace(/\D/g, '');
        if (cepClean.length !== 8) {
            if (cepClean.length > 0) setCepError('CEP incompleto ou inválido.');
            return;
        }

        setIsCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
            if (!response.ok) throw new Error('Erro ao buscar CEP.');
            const data = await response.json();
            if (data.erro) throw new Error('CEP não encontrado ou inválido.');

            setStreet(data.logradouro || '');
            setNeighborhood(data.bairro || '');
            setCity(data.localidade || '');
            setState(data.uf || '');
            setCepError('');
        } catch (error) {
            setCepError('CEP inválido. Verifique e tente novamente.');
            setStreet(''); setNeighborhood(''); setCity(''); setState('');
        } finally {
            setIsCepLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        if (cnpj && !validateCNPJ(cnpj)) {
            handleCnpjBlur();
            cnpjInputRef.current?.focus();
            return;
        };
        
        const dataToSave: any = { name, cnpj, street, number, neighborhood, city, state, zipCode };
        if (legalOrganization.id) dataToSave.id = legalOrganization.id;
        onSave(dataToSave);
    };

    return (
        <>
            {isCepLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-700 font-semibold">Buscando CEP...</p>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome da Organização</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="flex items-start gap-4">
                    <div style={{ width: '190px' }}>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700">CNPJ</label>
                        <input ref={cnpjInputRef} type="text" id="cnpj" value={cnpj} onChange={handleCnpjChange} onBlur={handleCnpjBlur} className={`mt-1 block w-full px-3 py-2 bg-white border ${cnpjError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        {cnpjError && <p className="mt-1 text-xs text-red-600">{cnpjError}</p>}
                    </div>
                    <div style={{ width: '120px' }}>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">CEP</label>
                        <input type="text" id="zipCode" value={zipCode} onChange={handleCepChange} onBlur={handleCepBlur} className={`mt-1 block w-full px-3 py-2 bg-white border ${cepError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        {cepError && <p className="mt-1 text-xs text-red-600">{cepError}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="street" className="block text-sm font-medium text-slate-700">Rua</label>
                    <input type="text" id="street" value={street} onChange={e => setStreet(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="number" className="block text-sm font-medium text-slate-700">Número</label>
                        <input type="text" id="number" value={number} onChange={e => setNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="neighborhood" className="block text-sm font-medium text-slate-700">Bairro</label>
                        <input type="text" id="neighborhood" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700">Cidade</label>
                        <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="state" className="block text-sm font-medium text-slate-700">Estado (UF)</label>
                        <input type="text" id="state" value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Organização</button>
                </div>
            </form>
        </>
    );
};

const OrganizationForm: React.FC<{
    organization: Partial<Organization>, 
    onSave: (organization: OrganizationUpdate | Organization) => void, 
    onCancel: () => void, 
    legalOrganizations: LegalOrganization[],
    currentUser: User;
}> = ({ organization, onSave, onCancel, legalOrganizations, currentUser }) => {
    const [name, setName] = useState(organization.name || '');
    const [cnpj, setCnpj] = useState(organization.cnpj || '');
    const [street, setStreet] = useState(organization.street || '');
    const [number, setNumber] = useState(organization.number || '');
    const [neighborhood, setNeighborhood] = useState(organization.neighborhood || '');
    const [city, setCity] = useState(organization.city || '');
    const [state, setState] = useState(organization.state || '');
    const [zipCode, setZipCode] = useState(organization.zipCode || '');
    const [cnpjError, setCnpjError] = useState('');
    const [cepError, setCepError] = useState('');
    const [isCepLoading, setIsCepLoading] = useState(false);
    
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;
    const [legalOrganizationId, setLegalOrganizationId] = useState(isAdminForLegalOrg ? currentUser.legalOrganizationId : organization.legalOrganizationId || '');

    const [isCopyDataConfirmOpen, setCopyDataConfirmOpen] = useState(false);
    const [dataToCopy, setDataToCopy] = useState<Partial<LegalOrganization> | null>(null);

    const visibleLegalOrgs = useMemo(() => {
        if (isAdminForLegalOrg) return legalOrganizations.filter(lo => String(lo.id) === String(currentUser.legalOrganizationId));
        return legalOrganizations;
    }, [legalOrganizations, currentUser, isAdminForLegalOrg]);

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (cnpjError) setCnpjError(''); setCnpj(maskCNPJ(e.target.value)); };
    const handleCnpjBlur = () => { if (cnpj && !validateCNPJ(cnpj)) setCnpjError('CNPJ inválido.'); else setCnpjError(''); };
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (cepError) setCepError(''); setZipCode(maskCEP(e.target.value)); };
    
    const handleCepBlur = async () => {
        const cepClean = zipCode.replace(/\D/g, '');
        if (cepClean.length !== 8) return;
        setIsCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setStreet(data.logradouro || ''); setNeighborhood(data.bairro || ''); setCity(data.localidade || ''); setState(data.uf || '');
            }
        } catch { setCepError('Erro ao buscar CEP.'); } finally { setIsCepLoading(false); }
    };
    
    const handleCompanyNameBlur = () => {
        if (!name || !legalOrganizationId || cnpj || zipCode) return;
        const selectedLegalOrg = legalOrganizations.find(lo => String(lo.id) === String(legalOrganizationId));
        if (selectedLegalOrg && (selectedLegalOrg.cnpj || selectedLegalOrg.zipCode)) {
            setDataToCopy(selectedLegalOrg); setCopyDataConfirmOpen(true);
        }
    };
    
    const handleConfirmCopyData = () => {
        if (dataToCopy) {
            setCnpj(maskCNPJ(dataToCopy.cnpj || '')); setZipCode(maskCEP(dataToCopy.zipCode || ''));
            setStreet(dataToCopy.street || ''); setNumber(dataToCopy.number || '');
            setNeighborhood(dataToCopy.neighborhood || ''); setCity(dataToCopy.city || ''); setState(dataToCopy.state || '');
        }
        setCopyDataConfirmOpen(false);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !legalOrganizationId) return;
        const data: any = { name, legalOrganizationId, cnpj, street, number, neighborhood, city, state, zipCode };
        if (organization.id) data.id = organization.id;
        onSave(data);
    };

    return (
        <>
            {isCepLoading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"><div className="bg-white p-6 rounded-lg shadow-xl text-center"><p>Buscando CEP...</p></div></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium">Matriz</label><select value={legalOrganizationId} onChange={e => setLegalOrganizationId(e.target.value)} disabled={isAdminForLegalOrg || isOrgAdmin} className="mt-1 block w-full border rounded-md p-2"><option value="">Selecione</option>{visibleLegalOrgs.map(lo => <option key={lo.id} value={lo.id}>{lo.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Nome da Empresa</label><input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={handleCompanyNameBlur} className="mt-1 block w-full border rounded-md p-2" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium">CNPJ</label><input type="text" value={cnpj} onChange={handleCnpjChange} onBlur={handleCnpjBlur} className="mt-1 block w-full border rounded-md p-2" />{cnpjError && <p className="text-red-600 text-xs">{cnpjError}</p>}</div><div><label className="block text-sm font-medium">CEP</label><input type="text" value={zipCode} onChange={handleCepChange} onBlur={handleCepBlur} className="mt-1 block w-full border rounded-md p-2" /></div></div>
                <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded-md">Cancelar</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Salvar</button></div>
            </form>
            <ConfirmationModal isOpen={isCopyDataConfirmOpen} onClose={() => setCopyDataConfirmOpen(false)} onConfirm={handleConfirmCopyData} title="Copiar Dados" message="Deseja copiar os dados de endereço da Matriz?" />
        </>
    );
};

const LegalOrganizationsView: React.FC<LegalOrganizationsViewProps> = ({
    currentUser, legalOrganizations, setLegalOrganizations, organizations, setOrganizations, onRefresh
}) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingLegalOrg, setEditingLegalOrg] = useState<Partial<LegalOrganization> | null>(null);
    const [legalOrgToDelete, setLegalOrgToDelete] = useState<LegalOrganization | null>(null);
    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Partial<Organization> | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Organization | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;

    const visibleLegalOrgs = useMemo(() => {
        if (isAdminForLegalOrg) return legalOrganizations.filter(lo => String(lo.id) === String(currentUser.legalOrganizationId));
        return legalOrganizations;
    }, [legalOrganizations, currentUser, isAdminForLegalOrg]);

    // Limpa erro ao abrir modais
    const openAddModal = () => { setApiError(null); setEditingLegalOrg({}); setModalOpen(true); };
    const openEditModal = (lo: LegalOrganization) => { setApiError(null); setEditingLegalOrg(lo); setModalOpen(true); };
    const openDeleteModal = (lo: LegalOrganization) => { setApiError(null); setLegalOrgToDelete(lo); };

    const handleSave = async (legalOrgData: LegalOrganizationCreate | LegalOrganization) => {
        try {
            setApiError(null);
            if ('id' in legalOrgData && legalOrgData.id) {
                const updated = await legalOrganizationService.update(String(legalOrgData.id), legalOrgData as LegalOrganizationUpdate);
                setLegalOrganizations(prev => prev.map(lo => String(lo.id) === String(legalOrgData.id) ? updated : lo));
            } else {
                const created = await legalOrganizationService.create(legalOrgData as LegalOrganizationCreate);
                setLegalOrganizations(prev => [...prev, created]);
            }
            if (onRefresh) onRefresh();
            setModalOpen(false);
            setEditingLegalOrg(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao salvar Matriz.");
            // NÃO fecha o modal aqui para mostrar o erro
        }
    };

    const confirmDelete = async () => {
        if (!legalOrgToDelete) return;
        try {
            setApiError(null);
            await legalOrganizationService.delete(legalOrgToDelete.id);
            setLegalOrganizations(prev => prev.filter(lo => lo.id !== legalOrgToDelete.id));
            if (onRefresh) onRefresh();
            setLegalOrgToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir. Verifique se há empresas vinculadas.");
            // NÃO fecha o modal para mostrar o erro
        }
    };

    // --- Organization Functions ---
    const openAddCompany = () => { setApiError(null); setEditingCompany({}); setCompanyModalOpen(true); } // Se houver botão de add separado
    const openEditCompany = (org: Organization) => { setApiError(null); setEditingCompany(org); setCompanyModalOpen(true); };
    const openDeleteCompany = (org: Organization) => { setApiError(null); setCompanyToDelete(org); };

    const handleSaveCompany = async (companyData: OrganizationUpdate | Organization) => {
        try {
            setApiError(null);
            if ('id' in companyData && companyData.id) {
                const updated = await organizationService.update(String(companyData.id), companyData as OrganizationUpdate);
                setOrganizations(prev => prev.map(org => String(org.id) === String(companyData.id) ? updated : org));
            }
            if (onRefresh) onRefresh();
            setCompanyModalOpen(false);
            setEditingCompany(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao salvar empresa.");
            // NÃO fecha o modal
        }
    };

    const confirmDeleteCompany = async () => {
        if (!companyToDelete) return;
        try {
            await organizationService.delete(companyToDelete.id);
            setOrganizations(prev => prev.filter(org => org.id !== companyToDelete.id));
            if (onRefresh) onRefresh();
            setCompanyToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir empresa.");
            // NÃO fecha o modal
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Organizações</h2>
                    <p className="text-slate-500 mt-1">Matrizes e empresas filiais do sistema.</p>
                </div>
                <button onClick={openAddModal} disabled={isAdminForLegalOrg} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-300">
                    <PlusIcon /> Nova Organização
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleLegalOrgs.map(lo => {
                    const childOrgs = organizations.filter(o => String(o.legalOrganizationId) === String(lo.id));
                    const canManage = currentUser.role === 'master' || (currentUser.role === 'admin' && String(currentUser.legalOrganizationId) === String(lo.id));
                    return (
                        <div key={lo.id} className="bg-white rounded-xl shadow-md flex flex-col">
                            <header className="flex items-center justify-between p-4 border-b">
                                <div><h3 className="text-lg font-bold text-slate-800">{lo.name}</h3><p className="text-sm text-slate-500">CNPJ: {lo.cnpj}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(lo)} className="p-2 hover:bg-slate-100 rounded-full text-indigo-600"><EditIcon /></button>
                                    <button onClick={() => openDeleteModal(lo)} disabled={isAdminForLegalOrg} className="p-2 hover:bg-slate-100 rounded-full text-red-500 disabled:text-slate-300"><DeleteIcon /></button>
                                </div>
                            </header>
                            <div className="p-4 flex-1">
                                {(lo.street || lo.city) && (
                                    <div className="mb-4 text-sm text-slate-600 border-b pb-4">
                                        <h4 className="font-semibold mb-2">Endereço</h4>
                                        <address className="not-italic">{lo.street}{lo.number && `, ${lo.number}`}<br />{lo.neighborhood && `${lo.neighborhood} - `}{lo.city}/{lo.state}<br />{lo.zipCode}</address>
                                    </div>
                                )}
                                <h4 className="text-sm font-semibold text-slate-600 mb-2">Empresas Vinculadas</h4>
                                {childOrgs.length > 0 ? (
                                    <ul className="space-y-2">
                                        {childOrgs.map(org => (
                                            <li key={org.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                                <span className="text-slate-700">{org.name}</span>
                                                {canManage && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openEditCompany(org)} className="p-1 text-slate-400 hover:text-indigo-600"><EditIcon /></button>
                                                        <button onClick={() => openDeleteCompany(org)} className="p-1 text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-slate-500 text-center py-4">Nenhuma empresa vinculada.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <Modal title={editingLegalOrg?.id ? 'Editar Organização' : 'Nova Organização'} onClose={() => setModalOpen(false)}>
                    {apiError && (
                        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded" role="alert">
                            <p className="font-bold">Atenção</p>
                            <p>{apiError}</p>
                        </div>
                    )}
                    <LegalOrganizationForm legalOrganization={editingLegalOrg || {}} onSave={handleSave} onCancel={() => setModalOpen(false)} />
                </Modal>
            )}

            {legalOrgToDelete && (
                <ConfirmationModal 
                    isOpen={!!legalOrgToDelete} 
                    onClose={() => setLegalOrgToDelete(null)} 
                    onConfirm={confirmDelete} 
                    title="Confirmar Exclusão" 
                    message={apiError ? `ERRO: ${apiError}` : `Deseja excluir ${legalOrgToDelete.name}?`} 
                />
            )}
            
            {isCompanyModalOpen && (
                <Modal title="Editar Empresa" onClose={() => setCompanyModalOpen(false)}>
                     {apiError && (
                        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded" role="alert">
                            <p className="font-bold">Atenção</p>
                            <p>{apiError}</p>
                        </div>
                    )}
                    <OrganizationForm organization={editingCompany || {}} onSave={handleSaveCompany} onCancel={() => setCompanyModalOpen(false)} legalOrganizations={legalOrganizations} currentUser={currentUser} />
                </Modal>
            )}

            {companyToDelete && (
                <ConfirmationModal 
                    isOpen={!!companyToDelete} 
                    onClose={() => setCompanyToDelete(null)} 
                    onConfirm={confirmDeleteCompany} 
                    title="Confirmar Exclusão" 
                    message={apiError ? `ERRO: ${apiError}` : `Deseja excluir a empresa ${companyToDelete.name}?`} 
                />
            )}
        </div>
    );
};

export default LegalOrganizationsView;