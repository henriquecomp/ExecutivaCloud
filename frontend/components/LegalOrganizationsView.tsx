import React, { useState, useRef, useMemo } from 'react';
import { LegalOrganization, Organization, Department, Executive, Secretary, Event, Contact, Expense, Task, Document, User } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';

// --- Helper Functions ---

/**
 * Validates a Brazilian CNPJ number.
 * @param {string} cnpj - The CNPJ string to validate.
 * @returns {boolean} - True if the CNPJ is valid, false otherwise.
 */
function validateCNPJ(cnpj: string): boolean {
    const cnpjClean = cnpj.replace(/[^\d]+/g, '');

    if (cnpjClean.length !== 14) return false;
    // Elimina CNPJs invalidos conhecidos
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

/**
 * Applies a CNPJ mask (00.000.000/0000-00) to a string.
 * @param {string} value - The input string.
 * @returns {string} - The masked string.
 */
const maskCNPJ = (value: string) => {
    if (!value) return "";
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

/**
 * Applies a CEP mask (00000-000) to a string.
 * @param {string} value - The input string.
 * @returns {string} - The masked string.
 */
const maskCEP = (value: string) => {
    if (!value) return "";
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
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
}

const LegalOrganizationForm: React.FC<{ legalOrganization: Partial<LegalOrganization>, onSave: (legalOrganization: LegalOrganization) => void, onCancel: () => void }> = ({ legalOrganization, onSave, onCancel }) => {
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
    const cepInputRef = useRef<HTMLInputElement>(null);

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cnpjError) setCnpjError('');
        setCnpj(maskCNPJ(e.target.value));
    };

    const handleCnpjBlur = () => {
        if (cnpj && !validateCNPJ(cnpj)) {
            setCnpjError('CNPJ inválido. Verifique o número e tente novamente.');
            setCnpj('');
            cnpjInputRef.current?.focus();
        }
    };

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cepError) setCepError('');
        setZipCode(maskCEP(e.target.value));
    };

    const handleCepBlur = async () => {
        const cepClean = zipCode.replace(/\D/g, '');
        if (cepClean.length !== 8) {
            if (cepClean.length > 0) {
                 setCepError('CEP incompleto ou inválido.');
                 setZipCode('');
                 cepInputRef.current?.focus();
            }
            return;
        }

        setIsCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
            if (!response.ok) throw new Error('Erro ao buscar CEP.');
            
            const data = await response.json();
            if (data.erro) {
                throw new Error('CEP não encontrado ou inválido.');
            }

            setStreet(data.logradouro || '');
            setNeighborhood(data.bairro || '');
            setCity(data.localidade || '');
            setState(data.uf || '');
            setCepError('');
        } catch (error) {
            setCepError('CEP inválido. Verifique e tente novamente.');
            setStreet('');
            setNeighborhood('');
            setCity('');
            setState('');
            setZipCode('');
            cepInputRef.current?.focus();
        } finally {
            setIsCepLoading(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || (cnpj && !validateCNPJ(cnpj))) {
            if (cnpj && !validateCNPJ(cnpj)) handleCnpjBlur();
            return;
        };
        onSave({
            id: legalOrganization.id || `legal_org_${new Date().getTime()}`,
            name,
            cnpj,
            street,
            number,
            neighborhood,
            city,
            state,
            zipCode,
        });
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
                        <input
                            ref={cnpjInputRef}
                            type="text"
                            id="cnpj"
                            value={cnpj}
                            onChange={handleCnpjChange}
                            onBlur={handleCnpjBlur}
                            className={`mt-1 block w-full px-3 py-2 bg-white border ${cnpjError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {cnpjError && <p className="mt-1 text-xs text-red-600">{cnpjError}</p>}
                    </div>
                    <div style={{ width: '120px' }}>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">CEP</label>
                        <input
                            ref={cepInputRef}
                            type="text"
                            id="zipCode"
                            value={zipCode}
                            onChange={handleCepChange}
                            onBlur={handleCepBlur}
                            className={`mt-1 block w-full px-3 py-2 bg-white border ${cepError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
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
    onSave: (organization: Organization) => void, 
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
    const cnpjInputRef = useRef<HTMLInputElement>(null);
    const cepInputRef = useRef<HTMLInputElement>(null);
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;
    const [legalOrganizationId, setLegalOrganizationId] = useState(isAdminForLegalOrg ? currentUser.legalOrganizationId : organization.legalOrganizationId || '');

    const [isCopyDataConfirmOpen, setCopyDataConfirmOpen] = useState(false);
    const [dataToCopy, setDataToCopy] = useState<Partial<LegalOrganization> | null>(null);
    const copyConfirmedRef = useRef(false);

    const visibleLegalOrgs = useMemo(() => {
        if (isAdminForLegalOrg) return legalOrganizations.filter(lo => lo.id === currentUser.legalOrganizationId);
        return legalOrganizations;
    }, [legalOrganizations, currentUser, isAdminForLegalOrg]);

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cnpjError) setCnpjError('');
        setCnpj(maskCNPJ(e.target.value));
    };

    const handleCnpjBlur = () => {
        if (cnpj && !validateCNPJ(cnpj)) setCnpjError('CNPJ inválido. Verifique o número e tente novamente.');
        else setCnpjError('');
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
            setStreet('');
            setNeighborhood('');
            setCity('');
            setState('');
        } finally {
            setIsCepLoading(false);
        }
    };
    
    const handleCompanyNameBlur = () => {
        if (!name || !legalOrganizationId || cnpj || zipCode) {
            return;
        }
        const selectedLegalOrg = legalOrganizations.find(lo => lo.id === legalOrganizationId);
        if (selectedLegalOrg && (selectedLegalOrg.cnpj || selectedLegalOrg.zipCode || selectedLegalOrg.street)) {
            copyConfirmedRef.current = false;
            setDataToCopy(selectedLegalOrg);
            setCopyDataConfirmOpen(true);
        }
    };
    
    const handleConfirmCopyData = () => {
        if (dataToCopy) {
            setCnpj(maskCNPJ(dataToCopy.cnpj || ''));
            setZipCode(maskCEP(dataToCopy.zipCode || ''));
            setStreet(dataToCopy.street || '');
            setNumber(dataToCopy.number || '');
            setNeighborhood(dataToCopy.neighborhood || '');
            setCity(dataToCopy.city || '');
            setState(dataToCopy.state || '');
            setCnpjError('');
            setCepError('');
        }
        copyConfirmedRef.current = true;
    };
    
    const handleCloseCopyModal = () => {
        setCopyDataConfirmOpen(false);
        if (!copyConfirmedRef.current) {
            cnpjInputRef.current?.focus();
        }
        setDataToCopy(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !legalOrganizationId || (cnpj && !validateCNPJ(cnpj))) {
            if (cnpj && !validateCNPJ(cnpj)) {
                handleCnpjBlur();
                cnpjInputRef.current?.focus();
            }
            return;
        };
        onSave({
            id: organization.id || `org_${new Date().getTime()}`,
            name, legalOrganizationId, cnpj, street, number, neighborhood, city, state, zipCode,
        });
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
                    <label htmlFor="legalOrganizationId" className="block text-sm font-medium text-slate-700">Organização Matriz</label>
                    <select id="legalOrganizationId" value={legalOrganizationId} onChange={e => setLegalOrganizationId(e.target.value)} required disabled={isAdminForLegalOrg || isOrgAdmin} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed">
                        <option value="" disabled>Selecione uma organização</option>
                        {visibleLegalOrgs.map(lo => <option key={lo.id} value={lo.id}>{lo.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome da Empresa</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} onBlur={handleCompanyNameBlur} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700">CNPJ</label>
                        <input ref={cnpjInputRef} type="text" id="cnpj" value={cnpj} onChange={handleCnpjChange} onBlur={handleCnpjBlur} className={`mt-1 block w-full px-3 py-2 bg-white border ${cnpjError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        {cnpjError && <p className="mt-1 text-xs text-red-600">{cnpjError}</p>}
                    </div>
                    <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">CEP</label>
                        <input ref={cepInputRef} type="text" id="zipCode" value={zipCode} onChange={handleCepChange} onBlur={handleCepBlur} className={`mt-1 block w-full px-3 py-2 bg-white border ${cepError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
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
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Empresa</button>
                </div>
            </form>
             <ConfirmationModal
                isOpen={isCopyDataConfirmOpen}
                onClose={handleCloseCopyModal}
                onConfirm={handleConfirmCopyData}
                title="Usar Dados da Organização"
                message="A organização matriz selecionada possui dados de endereço e CNPJ. Deseja usar os mesmos dados para esta empresa?"
            />
        </>
    );
};

const LegalOrganizationsView: React.FC<LegalOrganizationsViewProps> = ({
    currentUser,
    legalOrganizations, setLegalOrganizations,
    organizations, setOrganizations,
    departments, setDepartments,
    executives, setExecutives,
    secretaries, setSecretaries,
    setEvents, setContacts, setExpenses, setTasks,
    setDocuments, setUsers
}) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingLegalOrg, setEditingLegalOrg] = useState<Partial<LegalOrganization> | null>(null);
    const [legalOrgToDelete, setLegalOrgToDelete] = useState<LegalOrganization | null>(null);

    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Partial<Organization> | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Organization | null>(null);
    
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;

    const visibleLegalOrgs = useMemo(() => {
        if (isAdminForLegalOrg) {
            return legalOrganizations.filter(lo => lo.id === currentUser.legalOrganizationId);
        }
        return legalOrganizations;
    }, [legalOrganizations, currentUser, isAdminForLegalOrg]);


    const handleAdd = () => {
        setEditingLegalOrg({});
        setModalOpen(true);
    };

    const handleEdit = (legalOrg: LegalOrganization) => {
        setEditingLegalOrg(legalOrg);
        setModalOpen(true);
    };

    const handleDelete = (legalOrg: LegalOrganization) => {
        setLegalOrgToDelete(legalOrg);
    };

    const confirmDelete = () => {
        if (!legalOrgToDelete) return;

        const legalOrgId = legalOrgToDelete.id;
        const organizationsToDelete = organizations.filter(o => o.legalOrganizationId === legalOrgId);
        const organizationIdsToDelete = organizationsToDelete.map(o => o.id);
        const executivesToDelete = executives.filter(e => organizationIdsToDelete.includes(e.organizationId || ''));
        const executiveIdsToDelete = executivesToDelete.map(e => e.id);

        setLegalOrganizations(prev => prev.filter(lo => lo.id !== legalOrgId));
        setOrganizations(prev => prev.filter(o => o.legalOrganizationId !== legalOrgId));
        setDepartments(prev => prev.filter(d => !organizationIdsToDelete.includes(d.organizationId)));
        setExecutives(prev => prev.filter(e => !organizationIdsToDelete.includes(e.organizationId || '')));
        setEvents(prev => prev.filter(item => !executiveIdsToDelete.includes(item.executiveId)));
        setContacts(prev => prev.filter(item => !executiveIdsToDelete.includes(item.executiveId)));
        setExpenses(prev => prev.filter(item => !executiveIdsToDelete.includes(item.executiveId)));
        setTasks(prev => prev.filter(item => !executiveIdsToDelete.includes(item.executiveId)));
        setDocuments(prev => prev.filter(item => !executiveIdsToDelete.includes(item.executiveId)));
        setSecretaries(secs => secs.map(sec => ({
            ...sec,
            executiveIds: sec.executiveIds.filter(execId => !executiveIdsToDelete.includes(execId))
        })));
        setUsers(users => users.filter(u => {
            if (u.legalOrganizationId === legalOrgId) return false;
            if (u.organizationId && organizationIdsToDelete.includes(u.organizationId)) return false;
            if (u.executiveId && executiveIdsToDelete.includes(u.executiveId)) return false;
            return true;
        }));
        setLegalOrgToDelete(null);
    };

    const handleSave = (legalOrg: LegalOrganization) => {
        if (editingLegalOrg && editingLegalOrg.id) {
            setLegalOrganizations(prev => prev.map(lo => lo.id === legalOrg.id ? legalOrg : lo));
            setUsers(users => users.map(u => u.legalOrganizationId === legalOrg.id ? { ...u, fullName: `Admin ${legalOrg.name}` } : u));
        } else {
            setLegalOrganizations(prev => [...prev, legalOrg]);
            setUsers(users => [...users, {
                id: `user_admin_legal_${legalOrg.id}`,
                fullName: `Admin ${legalOrg.name}`,
                role: 'admin',
                legalOrganizationId: legalOrg.id,
            }]);
        }
        setModalOpen(false);
        setEditingLegalOrg(null);
    };

    const handleEditCompany = (company: Organization) => {
        setEditingCompany(company);
        setCompanyModalOpen(true);
    };

    const handleDeleteCompany = (company: Organization) => {
        setCompanyToDelete(company);
    };

    const handleSaveCompany = (company: Organization) => {
        setOrganizations(orgs => orgs.map(o => o.id === company.id ? company : o));
        setUsers(users => users.map(u => {
            if (u.organizationId === company.id) {
                return { ...u, fullName: `Admin ${company.name}` };
            }
            return u;
        }));
        setCompanyModalOpen(false);
        setEditingCompany(null);
    };

    const confirmDeleteCompany = () => {
        if (!companyToDelete) return;

        const orgId = companyToDelete.id;
        const executivesToDelete = executives.filter(e => e.organizationId === orgId);
        const executivesToDeleteIds = executivesToDelete.map(e => e.id);

        setOrganizations(orgs => orgs.filter(o => o.id !== orgId));
        setDepartments(depts => depts.filter(d => d.organizationId !== orgId));
        setExecutives(execs => execs.filter(e => e.organizationId !== orgId));
        setEvents(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setContacts(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setExpenses(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setTasks(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setDocuments(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setSecretaries(secs => secs.map(sec => ({
            ...sec,
            executiveIds: sec.executiveIds.filter(execId => !executivesToDeleteIds.includes(execId))
        })));
        setUsers(users => users.filter(u => {
            if (u.organizationId === orgId) return false;
            if (u.executiveId && executivesToDeleteIds.includes(u.executiveId)) return false;
            return true;
        }));
        setCompanyToDelete(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Organizações</h2>
                    <p className="text-slate-500 mt-1">Adicione, edite e visualize as organizações matriz (pessoas jurídicas).</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    disabled={isAdminForLegalOrg}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    <PlusIcon />
                    Nova Organização
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleLegalOrgs.map(lo => {
                    const childOrgs = organizations.filter(o => o.legalOrganizationId === lo.id);
                    const canManageCompanies = currentUser.role === 'master' || (currentUser.role === 'admin' && currentUser.legalOrganizationId === lo.id);
                    return (
                        <div key={lo.id} className="bg-white rounded-xl shadow-md flex flex-col">
                            <header className="flex items-center justify-between p-4 border-b border-slate-200">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{lo.name}</h3>
                                    {lo.cnpj && <p className="text-sm text-slate-500">CNPJ: {lo.cnpj}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(lo)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" aria-label="Editar organização">
                                        <EditIcon />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(lo)} 
                                        disabled={isAdminForLegalOrg}
                                        className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" 
                                        aria-label="Excluir organização"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </header>
                            <div className="p-4 flex-1">
                                {(lo.street || lo.city) && (
                                    <div className="mb-4 text-sm text-slate-600 border-b border-slate-200 pb-4">
                                        <h4 className="text-sm font-semibold text-slate-600 mb-2">Endereço</h4>
                                        <address className="not-italic">
                                            {lo.street}{lo.number && `, ${lo.number}`}<br />
                                            {lo.neighborhood && `${lo.neighborhood} - `}{lo.city}/{lo.state}<br />
                                            {lo.zipCode}
                                        </address>
                                    </div>
                                )}
                                <h4 className="text-sm font-semibold text-slate-600 mb-2">Empresas Vinculadas</h4>
                                {childOrgs.length > 0 ? (
                                    <ul className="space-y-2">
                                        {childOrgs.map(org => (
                                            <li key={org.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                                <p className="text-slate-700">{org.name}</p>
                                                {canManageCompanies && (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleEditCompany(org)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Editar empresa"><EditIcon /></button>
                                                        <button onClick={() => handleDeleteCompany(org)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Excluir empresa"><DeleteIcon /></button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma empresa vinculada.</p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {visibleLegalOrgs.length === 0 && (
                    <div className="lg:col-span-2 text-center p-6 bg-white rounded-xl shadow-md">
                        <p className="text-slate-500">Nenhuma organização cadastrada.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title={editingLegalOrg?.id ? 'Editar Organização' : 'Nova Organização'} onClose={() => {setModalOpen(false); setEditingLegalOrg(null)}}>
                    <LegalOrganizationForm
                        legalOrganization={editingLegalOrg || {}}
                        onSave={handleSave}
                        onCancel={() => { setModalOpen(false); setEditingLegalOrg(null); }}
                    />
                </Modal>
            )}

            {legalOrgToDelete && (
                <ConfirmationModal
                    isOpen={!!legalOrgToDelete}
                    onClose={() => setLegalOrgToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a organização ${legalOrgToDelete.name}? TODAS as empresas, departamentos, executivos e dados associados serão permanentemente removidos.`}
                />
            )}
            
            {isCompanyModalOpen && (
                <Modal title="Editar Empresa" onClose={() => {setCompanyModalOpen(false); setEditingCompany(null)}}>
                    <OrganizationForm
                        organization={editingCompany || {}}
                        onSave={handleSaveCompany}
                        onCancel={() => { setCompanyModalOpen(false); setEditingCompany(null); }}
                        legalOrganizations={legalOrganizations}
                        currentUser={currentUser}
                    />
                </Modal>
            )}

            {companyToDelete && (
                <ConfirmationModal
                    isOpen={!!companyToDelete}
                    onClose={() => setCompanyToDelete(null)}
                    onConfirm={confirmDeleteCompany}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a empresa ${companyToDelete.name}? TODOS os seus dados (departamentos, executivos, atividades, etc) e usuários associados serão permanentemente removidos.`}
                />
            )}
        </div>
    );
};

export default LegalOrganizationsView;