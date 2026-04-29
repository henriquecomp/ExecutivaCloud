import React from 'react';
import { Executive, Organization, Department } from '../types';
import { User, Briefcase, Phone, FileText, DollarSign, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  errors: { fullName?: string; workEmail?: string };
  setErrors: React.Dispatch<React.SetStateAction<{ fullName?: string; workEmail?: string }>>;
  apiError: string | null;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  workEmailReadOnly?: boolean;
  /** Executivo alterando o próprio cadastro: não pode mudar empresa/depto/gestor. */
  lockHrFields?: boolean;
}


export const ExecutiveProfileForm: React.FC<ExecutiveProfileFormProps> = ({
  currentExecutive,
  setCurrentExecutive,
  organizations,
  departments,
  executives,
  errors,
  setErrors,
  apiError,
  setApiError,
  openSections,
  toggleSection,
  workEmailReadOnly = false,
  lockHrFields = false,
}) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">

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
                   <label className={`block text-sm font-medium ${errors.fullName ? 'text-red-600' : 'text-gray-700'}`}>
                     Nome Completo *
                   </label>
                   <input
                     type="text"
                     className={`mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                    value={currentExecutive.fullName || ''}
                     onChange={e => {
                      setCurrentExecutive({...currentExecutive, fullName: e.target.value});
                      if (errors.fullName) setErrors({...errors, fullName: undefined});
                       if (apiError) setApiError(null);
                     }}
                   />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                   )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">CPF</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.cpf || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, cpf: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">RG</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.rg || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, rg: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Órgão Emissor do RG</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.rgIssuer || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, rgIssuer: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Data de Expedição do RG</label>
                   <input
                     type="date"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.rgIssueDate || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, rgIssueDate: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                   <input
                     type="date"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.birthDate || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, birthDate: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Nacionalidade</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.nationality || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, nationality: e.target.value})}
                   />
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
                   <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                   <select 
                      className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={currentExecutive.civilStatus || ''}
                      onChange={e => setCurrentExecutive({...currentExecutive, civilStatus: e.target.value})}
                   >
                     <option value="">Selecione</option>
                     <option value="Solteiro(a)">Solteiro(a)</option>
                     <option value="Casado(a)">Casado(a)</option>
                     <option value="Divorciado(a)">Divorciado(a)</option>
                     <option value="Viúvo(a)">Viúvo(a)</option>
                   </select>
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
                <div className="col-span-2">
                   <label className={`block text-sm font-medium ${errors.workEmail ? 'text-red-600' : 'text-gray-700'}`}>
                     Email Corporativo *
                   </label>
                   <input
                     type="email"
                     readOnly={workEmailReadOnly}
                     className={`mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      errors.workEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                     } ${workEmailReadOnly ? 'bg-gray-100' : ''}`}
                    value={currentExecutive.workEmail || ''}
                     onChange={e => {
                      if (workEmailReadOnly) return;
                      setCurrentExecutive({...currentExecutive, workEmail: e.target.value});
                      if (errors.workEmail) setErrors({...errors, workEmail: undefined});
                       if (apiError) setApiError(null);
                     }}
                   />
                  {errors.workEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.workEmail}</p>
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
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     rows={2}
                     value={currentExecutive.street || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, street: e.target.value})}
                   />
                </div>
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
                   <label className="block text-sm font-medium text-gray-700">Cargo (Job Title)</label>
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.jobTitle || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, jobTitle: e.target.value})}
                   />
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
                      disabled={lockHrFields}
                      className={`mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${lockHrFields ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
                   {lockHrFields && (
                     <p className="mt-1 text-xs text-gray-500">Definido pela empresa; não pode ser alterado aqui.</p>
                   )}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Departamento</label>
                   <select 
                      disabled={lockHrFields}
                      className={`mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${lockHrFields ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
                   <label className="block text-sm font-medium text-gray-700">Gestor direto</label>
                   <select 
                      disabled={lockHrFields}
                      className={`mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${lockHrFields ? 'cursor-not-allowed bg-gray-100' : ''}`}
                      value={currentExecutive.reportsToExecutiveId || ''}
                      onChange={e => setCurrentExecutive({...currentExecutive, reportsToExecutiveId: e.target.value || undefined})}
                   >
                     <option value="">Selecione</option>
                     {executives
                        .filter(e => e.id !== currentExecutive.id)
                        .filter(e => !currentExecutive.organizationId || e.organizationId === currentExecutive.organizationId)
                        .map(exec => (
                       <option key={exec.id} value={exec.id}>{exec.fullName}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Data de Contratação</label>
                   <input
                     type="date"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.hireDate || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, hireDate: e.target.value})}
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
                   <input
                     type="text"
                     className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     value={currentExecutive.emergencyContactRelation || ''}
                     onChange={e => setCurrentExecutive({...currentExecutive, emergencyContactRelation: e.target.value})}
                   />
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
              title="Dados Financeiros e Remuneração"
              icon={<DollarSign size={18} />}
              isOpen={openSections.finance}
              onToggle={() => toggleSection('finance')}
            >
               <div className="space-y-4">
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
               </div>
            </CollapseSection>

    </div>
  );
};
