import React, { useState, useMemo, useRef } from 'react';
import { Organization, Department, Executive, User, Secretary, Event, Contact, Expense, Task, Document, LegalOrganization, OrganizationCreate, OrganizationUpdate, DepartmentCreate, DepartmentUpdate } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';
import { apiService } from '../services/apiService';

// --- Helper Functions ---
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

const maskCEP = (value: string) => {
    if (!value) return "";
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};


interface OrganizationsViewProps {
  currentUser: User;
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
  legalOrganizations: LegalOrganization[];
  onRefresh: () => Promise<void>; // Atualizado para Promise para suportar await
}

const OrganizationForm: React.FC<{
    organization: Partial<Organization>, 
    onSave: (organization: OrganizationCreate | OrganizationUpdate) => void, 
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

    const [isCopyDataConfirmOpen, setCopyDataConfirmOpen] = useState(false);
    const [dataToCopy, setDataToCopy] = useState<Partial<LegalOrganization> | null>(null);
    const copyConfirmedRef = useRef(false);

    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;
    
    const [legalOrganizationId, setLegalOrganizationId] = useState(
        isAdminForLegalOrg ? currentUser.legalOrganizationId : organization.legalOrganizationId || ''
    );

    const visibleLegalOrgs = useMemo(() => {
        if (isAdminForLegalOrg) {
            return legalOrganizations.filter(lo => String(lo.id) === String(currentUser.legalOrganizationId));
        }
        return legalOrganizations;
    }, [legalOrganizations, currentUser, isAdminForLegalOrg]);

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
            if (cepClean.length > 0) {
                 setCepError('CEP incompleto ou inválido.');
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
        } finally {
            setIsCepLoading(false);
        }
    };
    
    const handleCompanyNameBlur = () => {
        if (!name || !legalOrganizationId || cnpj || zipCode) {
            return;
        }
    
        const selectedLegalOrg = legalOrganizations.find(lo => String(lo.id) === String(legalOrganizationId));
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
        if (!name || !legalOrganizationId) return;
        if (cnpj && !validateCNPJ(cnpj)) {
            handleCnpjBlur();
            cnpjInputRef.current?.focus();
            return;
        };
        
        const data: any = {
            name,
            legalOrganizationId,
            cnpj, street, number, neighborhood, city, state, zipCode,
        };
        if (organization.id) {
            data.id = organization.id;
        }

        onSave(data);
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
                    <select 
                        id="legalOrganizationId" 
                        value={legalOrganizationId} 
                        onChange={e => setLegalOrganizationId(e.target.value)} 
                        required 
                        disabled={isAdminForLegalOrg || isOrgAdmin}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>Selecione uma organização</option>
                        {visibleLegalOrgs.map(lo => <option key={lo.id} value={lo.id}>{lo.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome da Empresa</label>
                    <input 
                        type="text" 
                        id="name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        onBlur={handleCompanyNameBlur}
                        required 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                    <div>
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

const DepartmentForm: React.FC<{ department: Partial<Department>, onSave: (department: Department) => void, onCancel: () => void }> = ({ department, onSave, onCancel }) => {
    const [name, setName] = useState(department.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !department.organizationId) return;
        onSave({
            id: department.id || `dept_${new Date().getTime()}`,
            name,
            organizationId: department.organizationId,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-slate-700">Nome do Departamento</label>
                <input type="text" id="dept-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Departamento</button>
            </div>
        </form>
    );
};


const OrganizationsView: React.FC<OrganizationsViewProps> = ({ 
    currentUser,
    organizations, setOrganizations, 
    departments, setDepartments, 
    executives, setExecutives, 
    secretaries, setSecretaries,
    setEvents, setContacts, setExpenses, setTasks,
    setDocuments, setUsers, 
    legalOrganizations,
    onRefresh // Recebendo a função de refresh (Promise)
}) => {
    const [isOrgModalOpen, setOrgModalOpen] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Partial<Organization> | null>(null);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Partial<Department> | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;
    
    const visibleOrganizations = useMemo(() => {
        const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
        
        if (isAdminForLegalOrg) {
            return organizations.filter(o => String(o.legalOrganizationId) === String(currentUser.legalOrganizationId));
        }
        if (isOrgAdmin) {
            return organizations.filter(o => String(o.id) === String(currentUser.organizationId));
        }
        return organizations;
    }, [organizations, currentUser, isOrgAdmin]);

    // Organization Handlers
    const handleAddOrganization = () => {
        setEditingOrganization({});
        setApiError(null);
        setOrgModalOpen(true);
    };
    const handleEditOrganization = (organization: Organization) => {
        setEditingOrganization(organization);
        setApiError(null);
        setOrgModalOpen(true);
    };
    const handleDeleteOrganization = (org: Organization) => {
        setOrgToDelete(org);
    };
    
    const confirmDeleteOrganization = async () => {
        if (!orgToDelete) return;
        setIsLoading(true);
        try {
            setApiError(null);
            await apiService.organizations.delete(orgToDelete.id);
            
            // ATUALIZAR TUDO (CRUD REQUER REFRESH NO BACKEND)
            if (onRefresh) {
                await onRefresh();
            }

            setOrgToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir empresa.");
            setOrgToDelete(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveOrganization = async (orgData: OrganizationCreate | OrganizationUpdate) => {
        setIsLoading(true);
        try {
            setApiError(null);

            if ('id' in orgData && orgData.id) {
                // Update
                await apiService.organizations.update(String(orgData.id), orgData);
            } else {
                // Create
                await apiService.organizations.create(orgData as OrganizationCreate);
            }
            
            // ATUALIZAR TUDO (CRUD REQUER REFRESH NO BACKEND)
            if (onRefresh) {
                await onRefresh();
            }

            setOrgModalOpen(false);
            setEditingOrganization(null);
        } catch (error: any) {
            console.error(error);
            setApiError(error.response?.data?.detail || "Erro ao salvar empresa.");
        } finally {
            setIsLoading(false);
        }
    };

    // Department Handlers
    const handleAddDepartment = (organizationId: string) => {
        setEditingDepartment({ organizationId });
        setApiError(null);
        setDeptModalOpen(true);
    };
    const handleEditDepartment = (department: Department) => {
        setEditingDepartment(department);
        setApiError(null);
        setDeptModalOpen(true);
    };
    const handleDeleteDepartment = (dept: Department) => {
        setDeptToDelete(dept);
    };
    const confirmDeleteDepartment = async () => {
        if (!deptToDelete) return;
        setIsLoading(true);
        try {
            setApiError(null);
            await apiService.departments.delete(deptToDelete.id);
            
            // ATUALIZAR TUDO (CRUD REQUER REFRESH NO BACKEND)
            if (onRefresh) {
                await onRefresh();
            }
            
            setDeptToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir departamento.");
            setDeptToDelete(null);
        } finally {
            setIsLoading(false);
        }
    };
    const handleSaveDepartment = async (deptData: DepartmentCreate | DepartmentUpdate) => {
        setIsLoading(true);
        try {
            setApiError(null);
            
            if ('id' in deptData && deptData.id) {
                await apiService.departments.update(String(deptData.id), deptData);
            } else {
                await apiService.departments.create(deptData as DepartmentCreate);
            }

            // ATUALIZAR TUDO (CRUD REQUER REFRESH NO BACKEND)
            if (onRefresh) {
                await onRefresh();
            }

            setDeptModalOpen(false);
            setEditingDepartment(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao salvar departamento.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-6 animate-fade-in relative">
             {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="mt-2 text-indigo-700 font-medium">Atualizando dados...</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Empresas</h2>
                    <p className="text-slate-500 mt-1">Adicione ou edite as empresas e seus respectivos departamentos.</p>
                </div>
                <button 
                    onClick={handleAddOrganization} 
                    disabled={isOrgAdmin}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    <PlusIcon />
                    Nova Empresa
                </button>
            </div>

            {apiError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <p className="font-bold">Erro</p>
                    <p>{apiError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visibleOrganizations.map(org => {
                    const orgDepartments = departments.filter(d => String(d.organizationId) === String(org.id));
                    const legalOrg = legalOrganizations.find(lo => String(lo.id) === String(org.legalOrganizationId));
                    return (
                        <div key={org.id} className="bg-white rounded-xl shadow-md flex flex-col">
                            <header className="flex items-center justify-between p-4 border-b border-slate-200">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{org.name}</h3>
                                    {legalOrg && <p className="text-sm text-slate-500">{legalOrg.name}</p>}
                                    {org.cnpj && <p className="text-sm text-slate-500 mt-1">CNPJ: {org.cnpj}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditOrganization(org)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" aria-label="Editar empresa">
                                        <EditIcon />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteOrganization(org)}
                                        disabled={isOrgAdmin}
                                        className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" aria-label="Excluir empresa"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </header>
                            <div className="p-4 flex-1">
                                {(org.street || org.city) && (
                                    <div className="mb-4 text-sm text-slate-600 border-b border-slate-200 pb-4">
                                        <address className="not-italic">
                                            {org.street}{org.number && `, ${org.number}`}<br />
                                            {org.neighborhood && `${org.neighborhood} - `}{org.city}/{org.state}<br />
                                            {org.zipCode}
                                        </address>
                                    </div>
                                )}
                                <h4 className="text-sm font-semibold text-slate-600 mb-2">Departamentos</h4>
                                {orgDepartments.length > 0 ? (
                                    <ul className="space-y-2">
                                        {orgDepartments.map(dept => (
                                            <li key={dept.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                                <p className="text-slate-700">{dept.name}</p>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditDepartment(dept)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Editar departamento"><EditIcon /></button>
                                                    <button onClick={() => handleDeleteDepartment(dept)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Excluir departamento"><DeleteIcon /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">Nenhum departamento cadastrado.</p>
                                )}
                            </div>
                            <footer className="p-4 border-t border-slate-200">
                                <button onClick={() => handleAddDepartment(org.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition">
                                    <PlusIcon /> Adicionar Departamento
                                </button>
                            </footer>
                        </div>
                    );
                })}

                {visibleOrganizations.length === 0 && (
                    <div className="lg:col-span-2 text-center p-6 bg-white rounded-xl shadow-md">
                        <p className="text-slate-500">Nenhuma empresa cadastrada.</p>
                    </div>
                )}
            </div>

            {isOrgModalOpen && (
                <Modal title={editingOrganization?.id ? 'Editar Empresa' : 'Nova Empresa'} onClose={() => {setOrgModalOpen(false); setEditingOrganization(null)}}>
                    <OrganizationForm 
                        organization={editingOrganization || {}} 
                        onSave={handleSaveOrganization} 
                        onCancel={() => { setOrgModalOpen(false); setEditingOrganization(null); }} 
                        legalOrganizations={legalOrganizations}
                        currentUser={currentUser}
                    />
                </Modal>
            )}

            {isDeptModalOpen && (
                 <Modal title={editingDepartment?.id ? 'Editar Departamento' : 'Novo Departamento'} onClose={() => {setDeptModalOpen(false); setEditingDepartment(null)}}>
                    <DepartmentForm department={editingDepartment || {}} onSave={handleSaveDepartment} onCancel={() => { setDeptModalOpen(false); setEditingDepartment(null); }} />
                </Modal>
            )}

            {orgToDelete && (
                <ConfirmationModal
                    isOpen={!!orgToDelete}
                    onClose={() => setOrgToDelete(null)}
                    onConfirm={confirmDeleteOrganization}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a empresa ${orgToDelete.name}? TODOS os seus dados (departamentos, executivos, atividades, etc) e usuários associados serão permanentemente removidos.`}
                />
            )}
            
            {deptToDelete && (
                 <ConfirmationModal
                    isOpen={!!deptToDelete}
                    onClose={() => setDeptToDelete(null)}
                    onConfirm={confirmDeleteDepartment}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o departamento ${deptToDelete.name}? Os executivos associados serão desvinculados.`}
                />
            )}
        </div>
    );
};

export default OrganizationsView;