import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Secretary, Executive, User, Organization, Department } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon, ChevronDownIcon, ExclamationTriangleIcon } from './Icons';

// --- Helper Functions ---
/**
 * Validates a Brazilian CPF number.
 * @param {string} cpf - The CPF string to validate.
 * @returns {boolean} - True if the CPF is valid, false otherwise.
 */
function validateCPF(cpf: string): boolean {
    const cpfClean = cpf.replace(/[^\d]+/g, '');
    if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(10, 11))) return false;
    return true;
}

/**
 * Applies a CPF mask (###.###.###-##) to a string.
 * @param {string} value - The input string.
 * @returns {string} - The masked string.
 */
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

/**
 * Applies a phone mask (+55 (XX) XXXXX-XXXX) to a string.
 * @param {string} value - The input string.
 * @returns {string} - The masked string.
 */
const maskPhone = (value: string): string => {
    if (!value) return "";
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})?(\d{2})?(\d{4,5})?(\d{4})?/, (match, p1, p2, p3, p4) => {
            let result = '';
            if (p1) result = `+${p1}`;
            if (p2) result += ` (${p2})`;
            if (p3) result += ` ${p3}`;
            if (p4) result += `-${p4}`;
            return result;
        })
        .substring(0, 19);
};

const civilStatusOptions = ['Solteiro(a)', 'Casado(a)', 'Separado(a)', 'Divorciado(a)', 'Viúvo(a)'];


interface SecretariesViewProps {
  secretaries: Secretary[];
  setSecretaries: React.Dispatch<React.SetStateAction<Secretary[]>>;
  executives: Executive[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  organizations: Organization[];
  departments: Department[];
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border border-slate-200 rounded-md">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-t-md"
            aria-expanded={isOpen}
        >
            <h3 className="font-semibold text-slate-700">{title}</h3>
            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="p-4 space-y-4 border-t border-slate-200">{children}</div>}
    </div>
);

const SensitiveDataWarning: React.FC<{ message?: string }> = ({ message }) => (
    <div className="p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-md">
        <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm">
                <strong className="font-semibold">Atenção:</strong> {message || 'As informações nesta seção são confidenciais. Manuseie com cuidado e em conformidade com a LGPD.'}
            </p>
        </div>
    </div>
);

const SecretaryForm: React.FC<{
    secretary: Partial<Secretary>, 
    onSave: (secretary: Secretary) => void, 
    onCancel: () => void, 
    organizations: Organization[],
    departments: Department[],
    executives: Executive[],
    currentUser: User;
}> = ({ secretary, onSave, onCancel, organizations, departments, executives, currentUser }) => {
    const [openSections, setOpenSections] = useState<string[]>(['principal', 'org']);
    const toggleSection = (section: string) => setOpenSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);

    const [fullName, setFullName] = useState(secretary.fullName || '');
    const [jobTitle, setJobTitle] = useState(secretary.jobTitle || '');
    const [photoUrl, setPhotoUrl] = useState(secretary.photoUrl || '');
    const [cpf, setCpf] = useState(secretary.cpf || '');
    const [cpfError, setCpfError] = useState('');
    const [rg, setRg] = useState(secretary.rg || '');
    const [rgIssuer, setRgIssuer] = useState(secretary.rgIssuer || '');
    const [rgIssueDate, setRgIssueDate] = useState(secretary.rgIssueDate || '');
    const [birthDate, setBirthDate] = useState(secretary.birthDate || '');
    const [nationality, setNationality] = useState(secretary.nationality || '');
    const [placeOfBirth, setPlaceOfBirth] = useState(secretary.placeOfBirth || '');
    const [motherName, setMotherName] = useState(secretary.motherName || '');
    const [fatherName, setFatherName] = useState(secretary.fatherName || '');
    const [civilStatus, setCivilStatus] = useState(secretary.civilStatus || '');
    const [workEmail, setWorkEmail] = useState(secretary.workEmail || '');
    const [workPhone, setWorkPhone] = useState(secretary.workPhone || '');
    const [extension, setExtension] = useState(secretary.extension || '');
    const [personalEmail, setPersonalEmail] = useState(secretary.personalEmail || '');
    const [personalPhone, setPersonalPhone] = useState(secretary.personalPhone || '');
    const [address, setAddress] = useState(secretary.address || '');
    const [linkedinProfileUrl, setLinkedinProfileUrl] = useState(secretary.linkedinProfileUrl || '');
    const [organizationId, setOrganizationId] = useState(secretary.organizationId || '');
    const [departmentId, setDepartmentId] = useState(secretary.departmentId || '');
    const [costCenter, setCostCenter] = useState(secretary.costCenter || '');
    const [employeeId, setEmployeeId] = useState(secretary.employeeId || '');
    const [reportsToExecutiveId, setReportsToExecutiveId] = useState(secretary.reportsToExecutiveId || '');
    const [hireDate, setHireDate] = useState(secretary.hireDate || '');
    const [workLocation, setWorkLocation] = useState(secretary.workLocation || '');
    const [systemAccessLevels, setSystemAccessLevels] = useState(secretary.systemAccessLevels || '');
    const [bio, setBio] = useState(secretary.bio || '');
    const [education, setEducation] = useState(secretary.education || '');
    const [languages, setLanguages] = useState(secretary.languages || '');
    const [emergencyContactName, setEmergencyContactName] = useState(secretary.emergencyContactName || '');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(secretary.emergencyContactPhone || '');
    const [emergencyContactRelation, setEmergencyContactRelation] = useState(secretary.emergencyContactRelation || '');
    const [dependentsInfo, setDependentsInfo] = useState(secretary.dependentsInfo || '');
    const [bankInfo, setBankInfo] = useState(secretary.bankInfo || '');
    const [compensationInfo, setCompensationInfo] = useState(secretary.compensationInfo || '');
    const [selectedExecutiveIds, setSelectedExecutiveIds] = useState<string[]>(secretary.executiveIds || []);
    
    // Errors and Refs
    const cpfInputRef = useRef<HTMLInputElement>(null);
    const birthDateRef = useRef<HTMLInputElement>(null);
    const rgIssueDateRef = useRef<HTMLInputElement>(null);
    const hireDateRef = useRef<HTMLInputElement>(null);
    const [birthDateError, setBirthDateError] = useState('');
    const [rgIssueDateError, setRgIssueDateError] = useState('');
    const [hireDateError, setHireDateError] = useState('');

    const isSecretaryUser = currentUser.role === 'secretary';
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;

    const visibleOrganizations = useMemo(() => {
        if (isAdminForLegalOrg) return organizations.filter(o => o.legalOrganizationId === currentUser.legalOrganizationId);
        if (isOrgAdmin) return organizations.filter(o => o.id === currentUser.organizationId);
        return organizations;
    }, [organizations, currentUser, isAdminForLegalOrg, isOrgAdmin]);

    const filteredDepartments = useMemo(() => {
        if (!organizationId) return [];
        return departments.filter(d => d.organizationId === organizationId);
    }, [organizationId, departments]);

    const availableManagers = useMemo(() => {
        if (!organizationId) return [];
        return executives.filter(e => e.organizationId === organizationId);
    }, [executives, organizationId]);
    
    const adminScopedExecutives = useMemo(() => {
        if (isSecretaryUser) {
            return executives.filter(exec => (secretary.executiveIds || []).includes(exec.id));
        }
        if (isAdminForLegalOrg) {
            const orgIds = organizations.filter(o => o.legalOrganizationId === currentUser.legalOrganizationId).map(o => o.id);
            return executives.filter(e => e.organizationId && orgIds.includes(e.organizationId));
        }
        if (isOrgAdmin) {
            return executives.filter(e => e.organizationId === currentUser.organizationId);
        }
        return executives;
    }, [executives, organizations, currentUser, secretary.executiveIds, isSecretaryUser, isAdminForLegalOrg, isOrgAdmin]);

    const assignableExecutives = useMemo(() => {
        if (isSecretaryUser) {
            return adminScopedExecutives;
        }
        if (organizationId) {
            return adminScopedExecutives.filter(exec => exec.organizationId === organizationId);
        }
        return [];
    }, [adminScopedExecutives, organizationId, isSecretaryUser]);

    useEffect(() => {
        const assignableIds = new Set(assignableExecutives.map(e => e.id));
        setSelectedExecutiveIds(prevIds => prevIds.filter(id => assignableIds.has(id)));
    }, [assignableExecutives]);

    useEffect(() => {
        if (organizationId && !visibleOrganizations.some(o => o.id === organizationId)) setOrganizationId('');
    }, [organizationId, visibleOrganizations]);
    
    useEffect(() => {
        if (departmentId && !filteredDepartments.some(d => d.id === departmentId)) setDepartmentId('');
    }, [departmentId, filteredDepartments]);

    useEffect(() => {
        if (reportsToExecutiveId && !availableManagers.some(m => m.id === reportsToExecutiveId)) setReportsToExecutiveId('');
    }, [organizationId, availableManagers, reportsToExecutiveId]);

    const handleExecutiveToggle = (execId: string) => {
        setSelectedExecutiveIds(prev => prev.includes(execId) ? prev.filter(id => id !== execId) : [...prev, execId]);
    };

    const getExecutiveDetails = (exec: Executive) => {
        const org = organizations.find(o => o.id === exec.organizationId);
        return `${org?.name || 'Sem Empresa'} - ${exec.fullName} (${exec.jobTitle || 'Sem Cargo'})`;
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (cpfError) setCpfError('');
        setCpf(maskCPF(e.target.value));
    };

    const handleCpfBlur = () => {
        if (cpf && !validateCPF(cpf)) {
            setCpfError('CPF inválido. Verifique o número e tente novamente.');
            cpfInputRef.current?.focus();
        } else {
            setCpfError('');
        }
    };
    
    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, errorSetter: React.Dispatch<React.SetStateAction<string>>) => {
        const { value, validity } = e.target;
        if (value && !validity.valid) {
            errorSetter('Data inválida. Verifique o dia, mês e ano.');
            setter('');
            e.target.value = '';
            e.target.focus();
        } else {
            errorSetter('');
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (birthDateError || rgIssueDateError || hireDateError) {
            return;
        }
        if (cpf && !validateCPF(cpf)) {
            handleCpfBlur();
            return;
        }
        if (!fullName) return;
        onSave({
            id: secretary.id || `sec_${new Date().getTime()}`,
            executiveIds: selectedExecutiveIds,
            fullName, jobTitle, photoUrl, cpf, rg, rgIssuer, rgIssueDate,
            birthDate, nationality, placeOfBirth, motherName, fatherName, civilStatus,
            workEmail, workPhone, extension, personalEmail, personalPhone, address,
            linkedinProfileUrl, organizationId, departmentId, costCenter, employeeId,
            reportsToExecutiveId, hireDate, workLocation, systemAccessLevels, bio,
            education, languages, emergencyContactName, emergencyContactPhone,
            emergencyContactRelation, dependentsInfo, bankInfo, compensationInfo,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <CollapsibleSection title="Informações Principais" isOpen={openSections.includes('principal')} onToggle={() => toggleSection('principal')}>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700">Cargo/Título</label>
                        <input type="text" id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="photoUrl" className="block text-sm font-medium text-slate-700">URL da Foto</label>
                        <input type="url" id="photoUrl" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Identificação Pessoal (Confidencial)" isOpen={openSections.includes('identificacao')} onToggle={() => toggleSection('identificacao')}>
                <SensitiveDataWarning />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">Data de Nascimento</label>
                        <input ref={birthDateRef} type="date" id="birthDate" value={birthDate} onChange={e => setBirthDate(e.target.value)} onBlur={e => handleDateBlur(e, setBirthDate, setBirthDateError)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        {birthDateError && <p className="mt-1 text-xs text-red-600">{birthDateError}</p>}
                    </div>
                    <div>
                        <label htmlFor="civilStatus" className="block text-sm font-medium text-slate-700">Estado Civil</label>
                        <select id="civilStatus" value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Selecione...</option>
                            {civilStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">CPF</label>
                        <input
                            ref={cpfInputRef}
                            type="text"
                            id="cpf"
                            value={cpf}
                            onChange={handleCpfChange}
                            onBlur={handleCpfBlur}
                            className={`mt-1 block w-full px-3 py-2 bg-white border ${cpfError ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {cpfError && <p className="mt-1 text-xs text-red-600">{cpfError}</p>}
                    </div>
                    <div>
                        <label htmlFor="rg" className="block text-sm font-medium text-slate-700">RG</label>
                        <input type="text" id="rg" value={rg} onChange={e => setRg(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Detalhes Organizacionais" isOpen={openSections.includes('org')} onToggle={() => toggleSection('org')}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="organizationId" className="block text-sm font-medium text-slate-700">Empresa</label>
                        <select id="organizationId" value={organizationId} onChange={e => {setOrganizationId(e.target.value); setDepartmentId('');}} disabled={isSecretaryUser} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed">
                            <option value="">Selecione uma Empresa</option>
                            {visibleOrganizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700">Departamento</label>
                        <select id="departmentId" value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={isSecretaryUser || !organizationId || filteredDepartments.length === 0} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:cursor-not-allowed">
                            <option value="">Sem Departamento</option>
                            {filteredDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reportsToExecutiveId" className="block text-sm font-medium text-slate-700">Gestor Direto</label>
                        <select id="reportsToExecutiveId" value={reportsToExecutiveId} onChange={e => setReportsToExecutiveId(e.target.value)} disabled={isSecretaryUser || !organizationId} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:cursor-not-allowed">
                            <option value="">Ninguém (nível mais alto)</option>
                            {availableManagers.map(e => (<option key={e.id} value={e.id}>{e.fullName}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">Data de Admissão</label>
                        <input ref={hireDateRef} type="date" id="hireDate" value={hireDate} onChange={e => setHireDate(e.target.value)} onBlur={e => handleDateBlur(e, setHireDate, setHireDateError)} disabled={isSecretaryUser} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" />
                        {hireDateError && <p className="mt-1 text-xs text-red-600">{hireDateError}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Executivos Atendidos</label>
                    <div className={`mt-2 p-3 border rounded-md max-h-60 overflow-y-auto space-y-2 ${isSecretaryUser ? 'bg-slate-50' : 'border-slate-300'}`}>
                        {assignableExecutives.length > 0 ? assignableExecutives.map(exec => (
                            <div key={exec.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`exec-${exec.id}`}
                                    checked={selectedExecutiveIds.includes(exec.id)}
                                    onChange={() => handleExecutiveToggle(exec.id)}
                                    disabled={isSecretaryUser}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:text-slate-400"
                                />
                                <label htmlFor={`exec-${exec.id}`} className={`ml-3 block text-sm ${isSecretaryUser ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {getExecutiveDetails(exec)}
                                </label>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">
                                {isSecretaryUser
                                    ? 'Nenhum executivo para exibir.'
                                    : organizationId
                                        ? 'Nenhum executivo encontrado para esta empresa.'
                                        : 'Selecione uma empresa para listar os executivos.'
                                }
                            </p>
                        )}
                    </div>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Informações de Contato" isOpen={openSections.includes('contato')} onToggle={() => toggleSection('contato')}>
                <fieldset className="border border-slate-200 p-3 rounded-md">
                    <legend className="text-sm font-medium text-slate-600 px-1">Contato Corporativo</legend>
                    <div className="space-y-4 pt-2">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="workEmail" className="block text-sm font-medium text-slate-700">E-mail</label>
                                <input type="email" id="workEmail" value={workEmail} onChange={e => setWorkEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="workPhone" className="block text-sm font-medium text-slate-700">Telefone</label>
                                <input type="tel" id="workPhone" value={workPhone} onChange={e => setWorkPhone(maskPhone(e.target.value))} placeholder="+55 (XX) XXXXX-XXXX" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                         </div>
                    </div>
                </fieldset>
                 <fieldset className="border border-slate-200 p-3 rounded-md">
                    <legend className="text-sm font-medium text-slate-600 px-1">Contato Pessoal & Social</legend>
                     <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="personalEmail" className="block text-sm font-medium text-slate-700">E-mail Pessoal</label>
                                <input type="email" id="personalEmail" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="personalPhone" className="block text-sm font-medium text-slate-700">Telefone Pessoal</label>
                                <input type="tel" id="personalPhone" value={personalPhone} onChange={e => setPersonalPhone(maskPhone(e.target.value))} placeholder="+55 (XX) XXXXX-XXXX" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Endereço Residencial</label>
                            <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Rua, Número, Bairro, Cidade, UF, CEP" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                        </div>
                     </div>
                </fieldset>
            </CollapsibleSection>

            <CollapsibleSection title="Dependentes e Emergência (Confidencial)" isOpen={openSections.includes('emergencia')} onToggle={() => toggleSection('emergencia')}>
                <SensitiveDataWarning />
                <fieldset className="border border-slate-200 p-3 rounded-md">
                    <legend className="text-sm font-medium text-slate-600 px-1">Contato de Emergência</legend>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-slate-700">Nome do Contato</label>
                                <input type="text" id="emergencyContactName" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-slate-700">Telefone</label>
                                <input type="tel" id="emergencyContactPhone" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(maskPhone(e.target.value))} placeholder="+55 (XX) XXXXX-XXXX" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                    </div>
                </fieldset>
            </CollapsibleSection>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Secretária</button>
            </div>
        </form>
    );
};

const SecretariesView: React.FC<SecretariesViewProps> = ({ secretaries, setSecretaries, executives, setUsers, currentUser, organizations, departments }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSecretary, setEditingSecretary] = useState<Partial<Secretary> | null>(null);
    const [secretaryToDelete, setSecretaryToDelete] = useState<Secretary | null>(null);

    const isSecretaryUser = currentUser.role === 'secretary';
    const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
    const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;

    const adminScopedExecutiveIds = useMemo(() => {
        if (isAdminForLegalOrg) {
            const orgIds = organizations.filter(o => o.legalOrganizationId === currentUser.legalOrganizationId).map(o => o.id);
            return executives.filter(e => e.organizationId && orgIds.includes(e.organizationId)).map(e => e.id);
        }
        if (isOrgAdmin) {
            return executives.filter(e => e.organizationId === currentUser.organizationId).map(e => e.id);
        }
        return [];
    }, [isAdminForLegalOrg, isOrgAdmin, organizations, executives, currentUser]);

    const visibleSecretaries = useMemo(() => {
        if (isSecretaryUser) return secretaries.filter(s => s.id === currentUser.secretaryId);
        if (isAdminForLegalOrg || isOrgAdmin) {
            return secretaries.filter(s => s.executiveIds.some(execId => adminScopedExecutiveIds.includes(execId)));
        }
        return secretaries;
    }, [secretaries, currentUser, isSecretaryUser, isAdminForLegalOrg, isOrgAdmin, adminScopedExecutiveIds]);

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
                    <h2 className="text-3xl font-bold text-slate-800">{isSecretaryUser ? 'Meu Perfil' : 'Gerenciar Secretárias'}</h2>
                    <p className="text-slate-500 mt-1">{isSecretaryUser ? 'Visualize e edite suas informações.' : 'Adicione e associe secretárias aos executivos.'}</p>
                </div>
                <button 
                    onClick={handleAddSecretary} 
                    disabled={isSecretaryUser}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
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
                                <th className="p-3 hidden md:table-cell">Cargo</th>
                                <th className="p-3 hidden lg:table-cell">E-mail</th>
                                <th className="p-3">Executivos Atendidos</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleSecretaries.map(sec => (
                                <tr key={sec.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{sec.fullName}</td>
                                    <td className="p-3 hidden md:table-cell text-slate-600">{sec.jobTitle || '-'}</td>
                                    <td className="p-3 hidden lg:table-cell text-slate-600">{sec.workEmail || '-'}</td>
                                    <td className="p-3 text-slate-600 text-sm">{getExecutiveNames(sec.executiveIds) || '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleEditSecretary(sec)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar secretária">
                                                <EditIcon />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSecretary(sec)} 
                                                disabled={isSecretaryUser}
                                                className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" 
                                                aria-label="Excluir secretária"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visibleSecretaries.length === 0 && <p className="text-center p-6 text-slate-500">Nenhuma secretária cadastrada.</p>}
                </div>
            </div>

            {isModalOpen && (
                <Modal title={editingSecretary?.id ? 'Editar Perfil' : 'Nova Secretária'} onClose={() => setModalOpen(false)}>
                    <SecretaryForm
                        secretary={editingSecretary || {}} 
                        onSave={handleSaveSecretary} 
                        onCancel={() => { setModalOpen(false); setEditingSecretary(null); }}
                        executives={executives}
                        currentUser={currentUser}
                        organizations={organizations}
                        departments={departments}
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