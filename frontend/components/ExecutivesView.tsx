import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Executive, Organization, Department, Event, Contact, Expense, Task, User, Secretary, Document } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon, EmailIcon, PhoneIcon, ChevronDownIcon, ExclamationTriangleIcon } from './Icons';

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


interface ExecutivesViewProps {
  currentUser: User;
  executives: Executive[]; // This is visibleExecutives
  allExecutives: Executive[]; // This is the full list
  setExecutives: React.Dispatch<React.SetStateAction<Executive[]>>;
  organizations: Organization[];
  departments: Department[];
  secretaries: Secretary[];
  setSecretaries: React.Dispatch<React.SetStateAction<Secretary[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
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


const ExecutiveForm: React.FC<{ 
    executive: Partial<Executive>, 
    onSave: (executive: Executive) => void, 
    onCancel: () => void, 
    organizations: Organization[], 
    departments: Department[], 
    executives: Executive[],
    currentUser: User;
}> = ({ executive, onSave, onCancel, organizations, departments, executives, currentUser }) => {
    // Component State
    const [openSections, setOpenSections] = useState<string[]>(['principal', 'org']);
    const toggleSection = (section: string) => {
        setOpenSections(prev => 
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    // Form Fields State
    const [fullName, setFullName] = useState(executive.fullName || '');
    const [jobTitle, setJobTitle] = useState(executive.jobTitle || '');
    const [photoUrl, setPhotoUrl] = useState(executive.photoUrl || '');

    // Bloco 1
    const [cpf, setCpf] = useState(executive.cpf || '');
    const [cpfError, setCpfError] = useState('');
    const [rg, setRg] = useState(executive.rg || '');
    const [rgIssuer, setRgIssuer] = useState(executive.rgIssuer || '');
    const [rgIssueDate, setRgIssueDate] = useState(executive.rgIssueDate || '');
    const [birthDate, setBirthDate] = useState(executive.birthDate || '');
    const [nationality, setNationality] = useState(executive.nationality || '');
    const [placeOfBirth, setPlaceOfBirth] = useState(executive.placeOfBirth || '');
    const [motherName, setMotherName] = useState(executive.motherName || '');
    const [fatherName, setFatherName] = useState(executive.fatherName || '');
    const [civilStatus, setCivilStatus] = useState(executive.civilStatus || '');

    // Bloco 2
    const [workEmail, setWorkEmail] = useState(executive.workEmail || '');
    const [workPhone, setWorkPhone] = useState(executive.workPhone || '');
    const [extension, setExtension] = useState(executive.extension || '');
    const [personalEmail, setPersonalEmail] = useState(executive.personalEmail || '');
    const [personalPhone, setPersonalPhone] = useState(executive.personalPhone || '');
    const [address, setAddress] = useState(executive.address || '');
    const [linkedinProfileUrl, setLinkedinProfileUrl] = useState(executive.linkedinProfileUrl || '');

    // Bloco 3
    const [organizationId, setOrganizationId] = useState(executive.organizationId || '');
    const [departmentId, setDepartmentId] = useState(executive.departmentId || '');
    const [costCenter, setCostCenter] = useState(executive.costCenter || '');
    const [employeeId, setEmployeeId] = useState(executive.employeeId || '');
    const [reportsToExecutiveId, setReportsToExecutiveId] = useState(executive.reportsToExecutiveId || '');
    const [hireDate, setHireDate] = useState(executive.hireDate || '');
    const [workLocation, setWorkLocation] = useState(executive.workLocation || '');
    const [systemAccessLevels, setSystemAccessLevels] = useState(executive.systemAccessLevels || '');

    // Bloco 4
    const [bio, setBio] = useState(executive.bio || '');
    const [education, setEducation] = useState(executive.education || '');
    const [languages, setLanguages] = useState(executive.languages || '');
    
    // Bloco 5
    const [emergencyContactName, setEmergencyContactName] = useState(executive.emergencyContactName || '');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(executive.emergencyContactPhone || '');
    const [emergencyContactRelation, setEmergencyContactRelation] = useState(executive.emergencyContactRelation || '');
    const [dependentsInfo, setDependentsInfo] = useState(executive.dependentsInfo || '');

    // Bloco 6
    const [bankInfo, setBankInfo] = useState(executive.bankInfo || '');
    const [compensationInfo, setCompensationInfo] = useState(executive.compensationInfo || '');
    
    // Errors and Refs
    const cpfInputRef = useRef<HTMLInputElement>(null);
    const birthDateRef = useRef<HTMLInputElement>(null);
    const rgIssueDateRef = useRef<HTMLInputElement>(null);
    const hireDateRef = useRef<HTMLInputElement>(null);
    const [birthDateError, setBirthDateError] = useState('');
    const [rgIssueDateError, setRgIssueDateError] = useState('');
    const [hireDateError, setHireDateError] = useState('');

    const isSecretaryUser = currentUser.role === 'secretary';

    const visibleOrganizations = useMemo(() => {
        const isAdminForLegalOrg = currentUser.role === 'admin' && !!currentUser.legalOrganizationId;
        const isOrgAdmin = currentUser.role === 'admin' && !!currentUser.organizationId;

        if (isAdminForLegalOrg) {
            return organizations.filter(o => o.legalOrganizationId === currentUser.legalOrganizationId);
        }
        if (isOrgAdmin) {
            return organizations.filter(o => o.id === currentUser.organizationId);
        }
        return organizations;
    }, [organizations, currentUser]);

    const filteredDepartments = useMemo(() => {
        if (!organizationId) return [];
        return departments.filter(d => d.organizationId === organizationId);
    }, [organizationId, departments]);

    const availableManagers = useMemo(() => {
        if (!organizationId) return [];
        return executives.filter(e => 
            e.organizationId === organizationId && e.id !== executive.id
        );
    }, [executives, organizationId, executive.id]);
    
    useEffect(() => {
        const orgIsValid = visibleOrganizations.some(o => o.id === organizationId);
        if (!orgIsValid) {
            setOrganizationId('');
        }
    }, [organizationId, visibleOrganizations]);
    
    useEffect(() => {
        const deptIsValid = filteredDepartments.some(d => d.id === departmentId);
        if (!deptIsValid) {
            setDepartmentId('');
        }
    }, [departmentId, filteredDepartments]);

    useEffect(() => {
        if (reportsToExecutiveId && !availableManagers.some(m => m.id === reportsToExecutiveId)) {
            setReportsToExecutiveId('');
        }
    }, [organizationId, availableManagers, reportsToExecutiveId]);

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
            id: executive.id || `exec_${new Date().getTime()}`,
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
                        <label htmlFor="nationality" className="block text-sm font-medium text-slate-700">Nacionalidade</label>
                        <input type="text" id="nationality" value={nationality} onChange={e => setNationality(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="placeOfBirth" className="block text-sm font-medium text-slate-700">Naturalidade (Cidade/UF)</label>
                        <input type="text" id="placeOfBirth" value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="rgIssuer" className="block text-sm font-medium text-slate-700">Órgão Emissor RG</label>
                        <input type="text" id="rgIssuer" value={rgIssuer} onChange={e => setRgIssuer(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="rgIssueDate" className="block text-sm font-medium text-slate-700">Data de Expedição RG</label>
                        <input ref={rgIssueDateRef} type="date" id="rgIssueDate" value={rgIssueDate} onChange={e => setRgIssueDate(e.target.value)} onBlur={e => handleDateBlur(e, setRgIssueDate, setRgIssueDateError)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        {rgIssueDateError && <p className="mt-1 text-xs text-red-600">{rgIssueDateError}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="motherName" className="block text-sm font-medium text-slate-700">Nome da Mãe</label>
                        <input type="text" id="motherName" value={motherName} onChange={e => setMotherName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="fatherName" className="block text-sm font-medium text-slate-700">Nome do Pai</label>
                        <input type="text" id="fatherName" value={fatherName} onChange={e => setFatherName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Detalhes Organizacionais" isOpen={openSections.includes('org')} onToggle={() => toggleSection('org')}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="organizationId" className="block text-sm font-medium text-slate-700">Empresa</label>
                        <select 
                            id="organizationId" 
                            value={organizationId} 
                            onChange={e => {setOrganizationId(e.target.value); setDepartmentId('');}} 
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Sem Empresa</option>
                            {visibleOrganizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700">Departamento</label>
                        <select 
                            id="departmentId" 
                            value={departmentId} 
                            onChange={e => setDepartmentId(e.target.value)} 
                            disabled={isSecretaryUser || !organizationId || filteredDepartments.length === 0} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Sem Departamento</option>
                            {filteredDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700">Matrícula / ID</label>
                        <input 
                            type="text" 
                            id="employeeId" 
                            value={employeeId} 
                            onChange={e => setEmployeeId(e.target.value)} 
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                        />
                    </div>
                    <div>
                        <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">Data de Admissão</label>
                        <input 
                            ref={hireDateRef}
                            type="date" 
                            id="hireDate" 
                            value={hireDate} 
                            onChange={e => setHireDate(e.target.value)} 
                            onBlur={e => handleDateBlur(e, setHireDate, setHireDateError)}
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                        />
                         {hireDateError && <p className="mt-1 text-xs text-red-600">{hireDateError}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="workLocation" className="block text-sm font-medium text-slate-700">Local de Trabalho</label>
                        <input 
                            type="text" 
                            id="workLocation" 
                            value={workLocation} 
                            onChange={e => setWorkLocation(e.target.value)} 
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                        />
                    </div>
                    <div>
                        <label htmlFor="reportsToExecutiveId" className="block text-sm font-medium text-slate-700">Gestor Direto</label>
                        <select 
                            id="reportsToExecutiveId" 
                            value={reportsToExecutiveId} 
                            onChange={e => setReportsToExecutiveId(e.target.value)} 
                            disabled={isSecretaryUser || !organizationId}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Ninguém (nível mais alto)</option>
                            {availableManagers.map(e => (
                                <option key={e.id} value={e.id}>{e.fullName}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="costCenter" className="block text-sm font-medium text-slate-700">Centro de Custo</label>
                        <input 
                            type="text" 
                            id="costCenter" 
                            value={costCenter} 
                            onChange={e => setCostCenter(e.target.value)} 
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                        />
                    </div>
                    <div>
                        <label htmlFor="systemAccessLevels" className="block text-sm font-medium text-slate-700">Níveis de Acesso</label>
                        <input 
                            type="text" 
                            id="systemAccessLevels" 
                            value={systemAccessLevels} 
                            onChange={e => setSystemAccessLevels(e.target.value)} 
                            disabled={isSecretaryUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                        />
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
                         <div>
                            <label htmlFor="extension" className="block text-sm font-medium text-slate-700">Ramal</label>
                            <input type="text" id="extension" value={extension} onChange={e => setExtension(e.target.value)} className="mt-1 block w-full max-w-xs px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                        <div>
                            <label htmlFor="linkedinProfileUrl" className="block text-sm font-medium text-slate-700">Perfil do LinkedIn</label>
                            <input type="url" id="linkedinProfileUrl" value={linkedinProfileUrl} onChange={e => setLinkedinProfileUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                     </div>
                </fieldset>
            </CollapsibleSection>

            <CollapsibleSection title="Perfil Público" isOpen={openSections.includes('perfil')} onToggle={() => toggleSection('perfil')}>
                 <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-700">Biografia Curta</label>
                    <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="education" className="block text-sm font-medium text-slate-700">Formação Acadêmica</label>
                        <input type="text" id="education" value={education} onChange={e => setEducation(e.target.value)} placeholder="Ex: MBA em Gestão, USP" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="languages" className="block text-sm font-medium text-slate-700">Idiomas</label>
                        <input type="text" id="languages" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Ex: Português, Inglês" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
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
                        <div>
                            <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-slate-700">Relação/Parentesco</label>
                            <input type="text" id="emergencyContactRelation" value={emergencyContactRelation} onChange={e => setEmergencyContactRelation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                </fieldset>
                <fieldset className="border border-slate-200 p-3 rounded-md">
                    <legend className="text-sm font-medium text-slate-600 px-1">Dependentes</legend>
                    <div className="pt-2">
                        <label htmlFor="dependentsInfo" className="block text-sm font-medium text-slate-700">Informações dos Dependentes</label>
                        <textarea id="dependentsInfo" value={dependentsInfo} onChange={e => setDependentsInfo(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                </fieldset>
            </CollapsibleSection>

             <CollapsibleSection title="Dados Financeiros (Confidencial)" isOpen={openSections.includes('financeiro')} onToggle={() => toggleSection('financeiro')}>
                <SensitiveDataWarning message="As informações financeiras são extremamente sensíveis. Garanta que o acesso é restrito e necessário." />
                <div>
                    <label htmlFor="bankInfo" className="block text-sm font-medium text-slate-700">Dados Bancários para Pagamento</label>
                    <textarea id="bankInfo" value={bankInfo} onChange={e => setBankInfo(e.target.value)} rows={3} placeholder="Banco, agência, conta, etc." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                 <div>
                    <label htmlFor="compensationInfo" className="block text-sm font-medium text-slate-700">Informações de Remuneração</label>
                    <textarea id="compensationInfo" value={compensationInfo} onChange={e => setCompensationInfo(e.target.value)} rows={3} placeholder="Salário, bônus, stock options, etc." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
            </CollapsibleSection>
            
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Executivo</button>
            </div>
        </form>
    );
};

const ExecutivesView: React.FC<ExecutivesViewProps> = ({ currentUser, executives, allExecutives, setExecutives, organizations, departments, secretaries, setSecretaries, setEvents, setContacts, setExpenses, setTasks, setDocuments, setUsers }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingExecutive, setEditingExecutive] = useState<Partial<Executive> | null>(null);
    const [executiveToDelete, setExecutiveToDelete] = useState<Executive | null>(null);

    const isSecretaryUser = currentUser.role === 'secretary';

    const handleAddExecutive = () => {
        setEditingExecutive({});
        setModalOpen(true);
    };

    const handleEditExecutive = (executive: Executive) => {
        setEditingExecutive(executive);
        setModalOpen(true);
    };

    const handleDeleteClick = (executive: Executive) => {
        setExecutiveToDelete(executive);
    };

    const confirmDelete = () => {
        if (executiveToDelete) {
            const id = executiveToDelete.id;
            // Delete the executive
            setExecutives(execs => execs.filter(e => e.id !== id));
            // Delete the user
            setUsers(users => users.filter(u => u.executiveId !== id));
            // Unlink from secretaries
            setSecretaries(secs => secs.map(sec => ({
                ...sec,
                executiveIds: sec.executiveIds.filter(execId => execId !== id)
            })));
            // Cascade delete for all related data
            setEvents(prev => prev.filter(item => item.executiveId !== id));
            setContacts(prev => prev.filter(item => item.executiveId !== id));
            setExpenses(prev => prev.filter(item => item.executiveId !== id));
            setTasks(prev => prev.filter(item => item.executiveId !== id));
            setDocuments(prev => prev.filter(item => item.executiveId !== id));
            setExecutiveToDelete(null);
        }
    };
    
    const handleSaveExecutive = (executive: Executive) => {
        if (editingExecutive && editingExecutive.id) {
            setExecutives(execs => execs.map(e => e.id === executive.id ? executive : e));
            setUsers(users => users.map(u => u.executiveId === executive.id ? { ...u, fullName: executive.fullName } : u));
        } else {
            setExecutives(execs => [...execs, executive]);
            setUsers(users => [...users, {
                id: `user_exec_${executive.id}`,
                fullName: executive.fullName,
                role: 'executive',
                executiveId: executive.id,
            }]);
        }
        setModalOpen(false);
        setEditingExecutive(null);
    };

    const getExecutiveDetails = (exec: Executive) => {
        const org = organizations.find(o => o.id === exec.organizationId);
        const dept = departments.find(d => d.id === exec.departmentId);
        return `${org ? org.name : 'N/A'}${dept ? ` / ${dept.name}` : ''}`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Executivos</h2>
                    <p className="text-slate-500 mt-1">Adicione, edite e visualize os executivos que você gerencia.</p>
                </div>
                <button 
                    onClick={handleAddExecutive} 
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    disabled={isSecretaryUser}
                >
                    <PlusIcon />
                    Novo Executivo
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-slate-200 text-sm text-slate-500">
                            <tr>
                                <th className="p-3">Nome</th>
                                <th className="p-3 hidden md:table-cell">Empresa / Departamento</th>
                                <th className="p-3 hidden lg:table-cell">Contato</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {executives.map(exec => (
                                <tr key={exec.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">
                                        {exec.fullName}
                                        {exec.jobTitle && <p className="font-normal text-sm text-slate-500">{exec.jobTitle}</p>}
                                    </td>
                                    <td className="p-3 hidden md:table-cell text-slate-600">{getExecutiveDetails(exec)}</td>
                                    <td className="p-3 hidden lg:table-cell text-slate-600 text-sm">
                                        {exec.workEmail && <p className="flex items-center gap-2"><EmailIcon className="text-slate-400" /> {exec.workEmail}</p>}
                                        {exec.workPhone && <p className="flex items-center gap-2 mt-1"><PhoneIcon className="text-slate-400" /> {exec.workPhone}</p>}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleEditExecutive(exec)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-200 transition" aria-label="Editar executivo">
                                                <EditIcon />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(exec)} 
                                                className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" 
                                                aria-label="Excluir executivo"
                                                disabled={isSecretaryUser}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {executives.length === 0 && <p className="text-center p-6 text-slate-500">Nenhum executivo cadastrado.</p>}
                </div>
            </div>

            {isModalOpen && (
                <Modal title={editingExecutive?.id ? 'Editar Executivo' : 'Novo Executivo'} onClose={() => setModalOpen(false)}>
                    <ExecutiveForm 
                        executive={editingExecutive || {}} 
                        onSave={handleSaveExecutive} 
                        onCancel={() => { setModalOpen(false); setEditingExecutive(null); }}
                        organizations={organizations}
                        departments={departments}
                        executives={allExecutives}
                        currentUser={currentUser}
                    />
                </Modal>
            )}

            {executiveToDelete && (
                 <ConfirmationModal
                    isOpen={!!executiveToDelete}
                    onClose={() => setExecutiveToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o executivo ${executiveToDelete.fullName}? Todos os seus dados (eventos, contatos, etc), vínculos com secretárias e seu acesso de usuário serão perdidos.`}
                />
            )}
        </div>
    );
};

export default ExecutivesView;