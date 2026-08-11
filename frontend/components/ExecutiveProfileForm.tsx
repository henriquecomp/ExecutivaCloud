import React, { useCallback } from 'react';
import { EMAIL_MAX, FREE_TEXT_MAX, CEP_MASK_MAX } from '../utils/fieldLimits';
import { Executive, Organization, Department } from '../types';
import { User, Briefcase, Phone, FileText, DollarSign, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCepAutoLookup } from '../hooks/useCepAutoLookup';
import { maskCEP, maskCPF, maskPhone } from '../utils/brValidators';
import { BRAZILIAN_BANKS } from '../utils/brazilianBanks';
import type { ExecutiveProfileFieldErrors } from '../utils/executiveProfileValidation';
import { relationSelectOptions } from '../utils/emergencyContactRelationOptions';
import AppDateInput from './ui/AppDateInput';

const READONLY_ADDRESS_CLASS =
  'mt-1 block w-full px-3 py-2 border border-slate-200 rounded-md shadow-sm sm:text-sm bg-slate-50 text-slate-700 cursor-not-allowed';

// Subcomponente de Colapso
const CollapseSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium text-gray-700">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export interface ExecutiveProfileFormProps {
  currentExecutive: Partial<Executive>;
  setCurrentExecutive: React.Dispatch<React.SetStateAction<Partial<Executive>>>;
  organizations: Organization[];
  departments: Department[];
  executives: Executive[];
  errors?: { fullName?: string; workEmail?: string };
  setErrors?: React.Dispatch<React.SetStateAction<{ fullName?: string; workEmail?: string }>>;
  fieldErrors?: ExecutiveProfileFieldErrors;
  setFieldErrors?: React.Dispatch<React.SetStateAction<ExecutiveProfileFieldErrors>>;
  apiError: string | null;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  workEmailReadOnly?: boolean;
  profileCompletion?: boolean;
  loginEmail?: string;
  /** Trava só a empresa (organização). Departamento e gestor direto permanecem editáveis. */
  lockOrganization?: boolean;
  bankCode?: string;
  bankAgency?: string;
  bankAccount?: string;
  onBankCodeChange?: (v: string) => void;
  onBankAgencyChange?: (v: string) => void;
  onBankAccountChange?: (v: string) => void;
}


export const ExecutiveProfileForm: React.FC<ExecutiveProfileFormProps> = ({
  currentExecutive,
  setCurrentExecutive,
  organizations,
  departments,
  executives,
  errors = {},
  setErrors = () => {},
  fieldErrors = {},
  setFieldErrors = () => {},
  apiError,
  setApiError,
  openSections,
  toggleSection,
  workEmailReadOnly = false,
  profileCompletion = false,
  loginEmail,
  lockOrganization = false,
  bankCode = '',
  bankAgency = '',
  bankAccount = '',
  onBankCodeChange,
  onBankAgencyChange,
  onBankAccountChange,
}) => {
  const fullNameError = profileCompletion ? fieldErrors.fullName : errors.fullName;
  const workEmailError = profileCompletion ? undefined : errors.workEmail;

  const clearCepAddress = useCallback(() => {
    setCurrentExecutive((prev) => ({
      ...prev,
      street: '',
      neighborhood: '',
      city: '',
      state: '',
    }));
  }, [setCurrentExecutive]);

  const applyCepAddress = useCallback(
    (addr: { street: string; neighborhood: string; city: string; state: string }) => {
      setCurrentExecutive((prev) => ({
        ...prev,
        street: addr.street,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
      }));
    },
    [setCurrentExecutive],
  );

  const { handleCepInputChange, handleCepBlur: lookupCepBlur, isCepLoading, cepError, setCepError } =
    useCepAutoLookup({
      onAddress: applyCepAddress,
      onClearAddress: clearCepAddress,
    });

  const req = (label: string) => (profileCompletion ? `${label} *` : label);

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
      {isCepLoading && profileCompletion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-700 font-semibold">Buscando CEP...</p>
          </div>
        </div>
      )}

            {/* Alerta de Erro do Backend */}
            {apiError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Erro ao salvar os dados</h3>
                  <p className="text-sm mt-1">{apiError}</p>
                </div>
              </div>
            )}

            {/* --- Bloco 1: Identificação Pessoal --- */}
            <CollapseSection
              title="Identificação Pessoal"
              icon={<User size={18} />}
              isOpen={openSections.personal}
              onToggle={() => toggleSection('personal')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className={`block text-sm font-medium ${fullNameError ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Nome Completo')}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      fullNameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                    value={currentExecutive.fullName || ''}
                     onChange={e => {
                      setCurrentExecutive({...currentExecutive, fullName: e.target.value});
                      if (profileCompletion) setFieldErrors({...fieldErrors, fullName: undefined});
                      else if (errors.fullName) setErrors({...errors, fullName: undefined});
                       if (apiError) setApiError(null);
                     }}
                   />
                  {fullNameError && (
                    <p className="mt-1 text-sm text-red-600">{fullNameError}</p>
                   )}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.cpf ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('CPF')}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.cpf ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.cpf || ''}
                     onChange={e => {
                       setCurrentExecutive({...currentExecutive, cpf: maskCPF(e.target.value)});
                       if (fieldErrors.cpf) setFieldErrors({...fieldErrors, cpf: undefined});
                     }}
                   />
                   {fieldErrors.cpf && <p className="mt-1 text-sm text-red-600">{fieldErrors.cpf}</p>}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.rg ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('RG')}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.rg ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.rg || ''}
                     onChange={e => {
                       setCurrentExecutive({...currentExecutive, rg: e.target.value});
                       if (fieldErrors.rg) setFieldErrors({...fieldErrors, rg: undefined});
                     }}
                   />
                   {fieldErrors.rg && <p className="mt-1 text-sm text-red-600">{fieldErrors.rg}</p>}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.rgIssuer ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Órgão Emissor do RG')}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.rgIssuer ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.rgIssuer || ''}
                     onChange={e => {
                       setCurrentExecutive({...currentExecutive, rgIssuer: e.target.value});
                       if (fieldErrors.rgIssuer) setFieldErrors({...fieldErrors, rgIssuer: undefined});
                     }}
                   />
                   {fieldErrors.rgIssuer && <p className="mt-1 text-sm text-red-600">{fieldErrors.rgIssuer}</p>}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.rgIssueDate ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Data de Expedição do RG')}
                   </label>
                   <AppDateInput
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.rgIssueDate ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.rgIssueDate || ''}
                     onChange={(iso) => {
                       setCurrentExecutive({...currentExecutive, rgIssueDate: iso || undefined});
                       if (fieldErrors.rgIssueDate) setFieldErrors({...fieldErrors, rgIssueDate: undefined});
                     }}
                   />
                   {fieldErrors.rgIssueDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.rgIssueDate}</p>}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.birthDate ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Data de Nascimento')}
                   </label>
                   <AppDateInput
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.birthDate ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.birthDate || ''}
                     onChange={(iso) => {
                       setCurrentExecutive({...currentExecutive, birthDate: iso || undefined});
                       if (fieldErrors.birthDate) setFieldErrors({...fieldErrors, birthDate: undefined});
                     }}
                   />
                   {fieldErrors.birthDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDate}</p>}
                </div>
                <div>
                   <label className={`block text-sm font-medium ${fieldErrors.nationality ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Nacionalidade')}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.nationality ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.nationality || ''}
                     onChange={e => {
                       setCurrentExecutive({...currentExecutive, nationality: e.target.value});
                       if (fieldErrors.nationality) setFieldErrors({...fieldErrors, nationality: undefined});
                     }}
                   />
                   {fieldErrors.nationality && <p className="mt-1 text-sm text-red-600">{fieldErrors.nationality}</p>}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Naturalidade</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.placeOfBirth || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, placeOfBirth: e.target.value})}
                   />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className={`block text-sm font-medium ${fieldErrors.civilStatus ? 'text-red-600' : 'text-gray-700'}`}>
                     {req('Estado Civil')}
                   </label>
                   <select 
                      className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                        fieldErrors.civilStatus ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      value={currentExecutive.civilStatus || ''}
                      onChange={e => {
                        setCurrentExecutive({...currentExecutive, civilStatus: e.target.value});
                        if (fieldErrors.civilStatus) setFieldErrors({...fieldErrors, civilStatus: undefined});
                      }}
                   >
                     <option value="">Selecione</option>
                     <option value="Solteiro(a)">Solteiro(a)</option>
                     <option value="Casado(a)">Casado(a)</option>
                     <option value="Divorciado(a)">Divorciado(a)</option>
                     <option value="Viúvo(a)">Viúvo(a)</option>
                   </select>
                   {fieldErrors.civilStatus && <p className="mt-1 text-sm text-red-600">{fieldErrors.civilStatus}</p>}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Nome da Mãe</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.motherName || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, motherName: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Nome do Pai</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.fatherName || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, fatherName: e.target.value})}
                   />
                </div>
              </div>
            </CollapseSection>

            {/* --- Bloco 2: Contato --- */}
            <CollapseSection
              title="Informações de Contato"
              icon={<Phone size={18} />}
              isOpen={openSections.contact}
              onToggle={() => toggleSection('contact')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileCompletion ? (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">E-mail de login (corporativo)</label>
                      <input
                        type="email"
                        readOnly
                        className="mt-1 w-full p-2 border border-gray-300 rounded bg-gray-100"
                        value={loginEmail || currentExecutive.workEmail || ''}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-sm font-medium ${fieldErrors.personalEmail ? 'text-red-600' : 'text-gray-700'}`}>
                        E-mail adicional (opcional)
                      </label>
                      <input
                        type="email"
                        maxLength={EMAIL_MAX}
                        className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={currentExecutive.personalEmail || ''}
                        onChange={(e) => {
                          setCurrentExecutive({ ...currentExecutive, personalEmail: e.target.value });
                          if (fieldErrors.personalEmail) setFieldErrors({ ...fieldErrors, personalEmail: undefined });
                        }}
                      />
                      {fieldErrors.personalEmail && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.personalEmail}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${fieldErrors.workPhone ? 'text-red-600' : 'text-gray-700'}`}>
                        {req('Telefone corporativo')}
                      </label>
                      <input
                        type="tel"
                        className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                          fieldErrors.workPhone ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        value={currentExecutive.workPhone || ''}
                        onChange={(e) => {
                          setCurrentExecutive({ ...currentExecutive, workPhone: maskPhone(e.target.value) });
                          if (fieldErrors.workPhone) setFieldErrors({ ...fieldErrors, workPhone: undefined });
                        }}
                      />
                      {fieldErrors.workPhone && <p className="mt-1 text-sm text-red-600">{fieldErrors.workPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone pessoal (opcional)</label>
                      <input
                        type="tel"
                        className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={currentExecutive.personalPhone || ''}
                        onChange={(e) =>
                          setCurrentExecutive({ ...currentExecutive, personalPhone: maskPhone(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${fieldErrors.zipCode || cepError ? 'text-red-600' : 'text-gray-700'}`}>
                        {req('CEP')}
                      </label>
                      <input
                        type="text"
                        maxLength={CEP_MASK_MAX}
                        className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                          fieldErrors.zipCode || cepError ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        value={currentExecutive.zipCode || ''}
                        onChange={(e) => {
                          handleCepInputChange(e.target.value, (masked) =>
                            setCurrentExecutive((prev) => ({ ...prev, zipCode: masked })),
                          );
                          if (fieldErrors.zipCode) setFieldErrors({ ...fieldErrors, zipCode: undefined });
                          if (cepError) setCepError('');
                        }}
                        onBlur={() => {
                          lookupCepBlur(currentExecutive.zipCode || '');
                          const digits = (currentExecutive.zipCode || '').replace(/\D/g, '');
                          if (digits.length > 0 && digits.length !== 8) setCepError('CEP incompleto ou inválido.');
                        }}
                      />
                      {(fieldErrors.zipCode || cepError) && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.zipCode || cepError}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-sm font-medium ${fieldErrors.street ? 'text-red-600' : 'text-gray-700'}`}>
                        {req('Logradouro')}
                      </label>
                      <input type="text" readOnly tabIndex={-1} className={READONLY_ADDRESS_CLASS} value={currentExecutive.street || ''} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${fieldErrors.number ? 'text-red-600' : 'text-gray-700'}`}>
                        {req('Número')}
                      </label>
                      <input
                        type="text"
                        className="mt-1 w-full p-2 border border-gray-300 rounded"
                        value={currentExecutive.number || ''}
                        onChange={(e) => {
                          setCurrentExecutive({ ...currentExecutive, number: e.target.value });
                          if (fieldErrors.number) setFieldErrors({ ...fieldErrors, number: undefined });
                        }}
                      />
                      {fieldErrors.number && <p className="mt-1 text-sm text-red-600">{fieldErrors.number}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Complemento</label>
                      <input
                        type="text"
                        className="mt-1 w-full p-2 border border-gray-300 rounded"
                        value={currentExecutive.complement || ''}
                        onChange={(e) => setCurrentExecutive({ ...currentExecutive, complement: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{req('Bairro')}</label>
                      <input type="text" readOnly tabIndex={-1} className={READONLY_ADDRESS_CLASS} value={currentExecutive.neighborhood || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{req('Cidade')}</label>
                      <input type="text" readOnly tabIndex={-1} className={READONLY_ADDRESS_CLASS} value={currentExecutive.city || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{req('UF')}</label>
                      <input type="text" readOnly tabIndex={-1} className={READONLY_ADDRESS_CLASS} value={currentExecutive.state || ''} />
                    </div>
                  </>
                ) : (
                  <>
                <div className="col-span-2">
                   <label className={`block text-sm font-medium ${workEmailError ? 'text-red-600' : 'text-gray-700'}`}>
                     Email Corporativo *
                   </label>
                   <input
                     type="email"
                     maxLength={EMAIL_MAX}
                     readOnly={workEmailReadOnly}
                     className={`mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      workEmailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                     } ${workEmailReadOnly ? 'bg-gray-100' : ''}`}
                    value={currentExecutive.workEmail || ''}
                     onChange={e => {
                      if (workEmailReadOnly) return;
                      setCurrentExecutive({...currentExecutive, workEmail: e.target.value});
                      if (errors.workEmail) setErrors({...errors, workEmail: undefined});
                       if (apiError) setApiError(null);
                     }}
                   />
                  {workEmailError && (
                    <p className="mt-1 text-sm text-red-600">{workEmailError}</p>
                   )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Telefone Corporativo</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.workPhone || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, workPhone: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Ramal</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.extension || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, extension: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Email Pessoal</label>
                   <input
                     type="email"
                     maxLength={EMAIL_MAX}
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.personalEmail || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, personalEmail: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Telefone Pessoal</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.personalPhone || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, personalPhone: e.target.value})}
                   />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700">Endereço (Rua/Núm/Comp)</label>
                   <textarea
                     maxLength={FREE_TEXT_MAX}
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={2}
                     value={currentExecutive.street || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, street: e.target.value})}
                   />
                </div>
                  </>
                )}
                 <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.linkedinProfileUrl || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, linkedinProfileUrl: e.target.value})}
                   />
                </div>
              </div>
            </CollapseSection>

            {/* --- Bloco 3: Profissional --- */}
            <CollapseSection
              title="Dados Profissionais"
              icon={<Briefcase size={18} />}
              isOpen={openSections.professional}
              onToggle={() => toggleSection('professional')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className={`block text-sm font-medium ${fieldErrors.jobTitle ? 'text-red-600' : 'text-gray-700'}`}>
                     {profileCompletion ? req('Cargo') : 'Cargo (Job Title)'}
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:ring-2 focus:outline-none ${
                       fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                     value={currentExecutive.jobTitle || ''}
                     onChange={e => {
                       setCurrentExecutive({...currentExecutive, jobTitle: e.target.value});
                       if (fieldErrors.jobTitle) setFieldErrors({...fieldErrors, jobTitle: undefined});
                     }}
                   />
                   {fieldErrors.jobTitle && <p className="mt-1 text-sm text-red-600">{fieldErrors.jobTitle}</p>}
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Centro de Custo</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.costCenter || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, costCenter: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.employeeId || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, employeeId: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Empresa (organização)</label>
                   <select 
                      disabled={lockOrganization}
                      className={`mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${lockOrganization ? 'cursor-not-allowed bg-gray-100' : ''}`}
                      value={currentExecutive.organizationId || ''}
                      onChange={e => setCurrentExecutive({
                        ...currentExecutive,
                        organizationId: e.target.value || undefined,
                        departmentId: undefined,
                        reportsToExecutiveId: undefined,
                      })}
                   >
                     <option value="">Selecione</option>
                     {organizations.map(org => (
                       <option key={org.id} value={org.id}>{org.name}</option>
                     ))}
                   </select>
                   {lockOrganization && (
                     <p className="mt-1 text-xs text-gray-500">Definido pela empresa; não pode ser alterado aqui.</p>
                   )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Departamento</label>
                   <select
                      className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={currentExecutive.departmentId || ''}
                      onChange={e => setCurrentExecutive({...currentExecutive, departmentId: e.target.value || undefined})}
                   >
                     <option value="">Selecione</option>
                     {departments
                        .filter(d => !currentExecutive.organizationId || d.organizationId === currentExecutive.organizationId)
                        .map(dept => (
                       <option key={dept.id} value={dept.id}>{dept.name}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">
                     Gestor direto <span className="font-normal text-gray-400">(opcional)</span>
                   </label>
                   <select
                      className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={currentExecutive.reportsToExecutiveId || ''}
                      onChange={e => setCurrentExecutive({...currentExecutive, reportsToExecutiveId: e.target.value || undefined})}
                   >
                     <option value="">Nenhum</option>
                     {executives
                        .filter((e) => String(e.id) !== String(currentExecutive.id ?? ''))
                        .filter((e) => {
                          const orgId = currentExecutive.organizationId;
                          if (!orgId) return false;
                          return String(e.organizationId ?? '') === String(orgId);
                        })
                        .slice()
                        .sort((a, b) =>
                          (a.fullName || '').localeCompare(b.fullName || '', 'pt-BR'),
                        )
                        .map((exec) => (
                       <option key={exec.id} value={exec.id}>{exec.fullName}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Data de Contratação</label>
                   <AppDateInput
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.hireDate || ''}
                     onChange={(iso) => setCurrentExecutive({...currentExecutive, hireDate: iso || undefined})}
                   />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Local de Trabalho</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.workLocation || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, workLocation: e.target.value})}
                   />
                </div>
              </div>
            </CollapseSection>

            {/* --- Bloco 4: Perfil --- */}
            <CollapseSection
              title="Perfil e Biografia"
              icon={<FileText size={18} />}
              isOpen={openSections.profile}
              onToggle={() => toggleSection('profile')}
            >
               <div className="space-y-4">
                  <div>
                   <label className="block text-sm font-medium text-gray-700">URL da Foto</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.photoUrl || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, photoUrl: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Bio / Resumo Profissional</label>
                   <textarea
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={4}
                     value={currentExecutive.bio || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, bio: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Educação / Formação</label>
                   <textarea
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={3}
                     value={currentExecutive.education || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, education: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Idiomas</label>
                   <input
                     type="text"
                     placeholder="Ex: Inglês, Espanhol"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.languages || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, languages: e.target.value})}
                   />
                </div>
               </div>
            </CollapseSection>

            {/* --- Bloco 5: Emergência --- */}
            <CollapseSection
              title="Contato de Emergência"
              icon={<AlertCircle size={18} />}
              isOpen={openSections.emergency}
              onToggle={() => toggleSection('emergency')}
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Nome Contato de Emergência</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.emergencyContactName || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, emergencyContactName: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Telefone Emergência</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.emergencyContactPhone || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, emergencyContactPhone: e.target.value})}
                   />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium text-gray-700">Relação (Parentesco)</label>
                   <select
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.emergencyContactRelation || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, emergencyContactRelation: e.target.value})}
                   >
                     <option value="">Selecione...</option>
                     {relationSelectOptions(currentExecutive.emergencyContactRelation).map((opt) => (
                       <option key={opt} value={opt}>{opt}</option>
                     ))}
                   </select>
                </div>
                 <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700">Informações de Dependentes</label>
                   <textarea
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={2}
                     value={currentExecutive.dependentsInfo || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, dependentsInfo: e.target.value})}
                   />
                </div>
               </div>
            </CollapseSection>

            {/* --- Bloco 6: Financeiro --- */}
            <CollapseSection
              title={profileCompletion ? 'Dados bancários' : 'Dados Financeiros e Remuneração'}
              icon={<DollarSign size={18} />}
              isOpen={openSections.finance}
              onToggle={() => toggleSection('finance')}
            >
               <div className="space-y-4">
                 {profileCompletion ? (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className={`block text-sm font-medium ${fieldErrors.bankCode ? 'text-red-600' : 'text-gray-700'}`}>
                         {req('Banco')}
                       </label>
                       <select
                         className="mt-1 w-full p-2 border border-gray-300 rounded"
                         value={bankCode}
                         onChange={(e) => {
                           onBankCodeChange?.(e.target.value);
                           if (fieldErrors.bankCode) setFieldErrors({ ...fieldErrors, bankCode: undefined });
                         }}
                       >
                         <option value="">Selecione…</option>
                         {BRAZILIAN_BANKS.map((b) => (
                           <option key={b.code} value={b.code}>
                             {b.code} — {b.name}
                           </option>
                         ))}
                       </select>
                       {fieldErrors.bankCode && <p className="mt-1 text-sm text-red-600">{fieldErrors.bankCode}</p>}
                     </div>
                     <div>
                       <label className={`block text-sm font-medium ${fieldErrors.bankAgency ? 'text-red-600' : 'text-gray-700'}`}>
                         {req('Agência')}
                       </label>
                       <input
                         type="text"
                         className="mt-1 w-full p-2 border border-gray-300 rounded"
                         value={bankAgency}
                         onChange={(e) => {
                           onBankAgencyChange?.(e.target.value);
                           if (fieldErrors.bankAgency) setFieldErrors({ ...fieldErrors, bankAgency: undefined });
                         }}
                       />
                       {fieldErrors.bankAgency && <p className="mt-1 text-sm text-red-600">{fieldErrors.bankAgency}</p>}
                     </div>
                     <div>
                       <label className={`block text-sm font-medium ${fieldErrors.bankAccount ? 'text-red-600' : 'text-gray-700'}`}>
                         {req('Conta')}
                       </label>
                       <input
                         type="text"
                         className="mt-1 w-full p-2 border border-gray-300 rounded"
                         value={bankAccount}
                         onChange={(e) => {
                           onBankAccountChange?.(e.target.value);
                           if (fieldErrors.bankAccount) setFieldErrors({ ...fieldErrors, bankAccount: undefined });
                         }}
                       />
                       {fieldErrors.bankAccount && <p className="mt-1 text-sm text-red-600">{fieldErrors.bankAccount}</p>}
                     </div>
                   </div>
                 ) : (
                   <>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Dados Bancários</label>
                   <textarea
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={3}
                     placeholder="Banco, Agência, Conta..."
                     value={currentExecutive.bankInfo || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, bankInfo: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Informações de Remuneração</label>
                   <textarea
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={3}
                     value={currentExecutive.compensationInfo || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, compensationInfo: e.target.value})}
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Níveis de Acesso no Sistema</label>
                  <textarea
                    className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={2}
                    value={currentExecutive.systemAccessLevels || ''}
                    onChange={e => setCurrentExecutive({...currentExecutive, systemAccessLevels: e.target.value})}
                  />
               </div>
                   </>
                 )}
               </div>
            </CollapseSection>

    </div>
  );
};
