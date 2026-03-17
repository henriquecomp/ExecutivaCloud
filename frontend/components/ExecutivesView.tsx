import React, { useState, useEffect } from 'react';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { departmentService } from '../services/departmentService';
import { Executive, Organization, Department } from '../types';
import { Plus, Edit2, Trash2, Search, User, Briefcase, Phone, FileText, DollarSign, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';

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

const ExecutivesView: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dados para Selects
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentExecutive, setCurrentExecutive] = useState<Partial<Executive>>({});
  const [executiveToDelete, setExecutiveToDelete] = useState<string | null>(null);

  // Validação (Erros)
  const [errors, setErrors] = useState<{ fullName?: string; workEmail?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Controle de Seções Colapsáveis do Modal
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    professional: true,
    profile: false,
    emergency: false,
    finance: false,
  });

  const normalizeExecutivePayload = (executive: Partial<Executive>): Record<string, any> => {
    const cleanText = (value?: string) => {
      if (value == null) return undefined;
      const trimmed = value.trim();
      // When user clears an existing value, send null to persist removal.
      return trimmed === '' ? null : trimmed;
    };

    return {
      ...executive,
      fullName: cleanText(executive.fullName),
      workEmail: cleanText(executive.workEmail),
      cpf: cleanText(executive.cpf),
      rg: cleanText(executive.rg),
      rgIssuer: cleanText(executive.rgIssuer),
      rgIssueDate: cleanText(executive.rgIssueDate),
      birthDate: cleanText(executive.birthDate),
      nationality: cleanText(executive.nationality),
      placeOfBirth: cleanText(executive.placeOfBirth),
      motherName: cleanText(executive.motherName),
      fatherName: cleanText(executive.fatherName),
      civilStatus: cleanText(executive.civilStatus),
      workPhone: cleanText(executive.workPhone),
      extension: cleanText(executive.extension),
      personalEmail: cleanText(executive.personalEmail),
      personalPhone: cleanText(executive.personalPhone),
      street: cleanText(executive.street),
      linkedinProfileUrl: cleanText(executive.linkedinProfileUrl),
      jobTitle: cleanText(executive.jobTitle),
      costCenter: cleanText(executive.costCenter),
      employeeId: cleanText(executive.employeeId),
      hireDate: cleanText(executive.hireDate),
      workLocation: cleanText(executive.workLocation),
      photoUrl: cleanText(executive.photoUrl),
      bio: cleanText(executive.bio),
      education: cleanText(executive.education),
      languages: cleanText(executive.languages),
      emergencyContactName: cleanText(executive.emergencyContactName),
      emergencyContactPhone: cleanText(executive.emergencyContactPhone),
      emergencyContactRelation: cleanText(executive.emergencyContactRelation),
      dependentsInfo: cleanText(executive.dependentsInfo),
      bankInfo: cleanText(executive.bankInfo),
      compensationInfo: cleanText(executive.compensationInfo),
      systemAccessLevels: cleanText(executive.systemAccessLevels),
      organizationId: cleanText(executive.organizationId),
      departmentId: cleanText(executive.departmentId),
      reportsToExecutiveId: cleanText(executive.reportsToExecutiveId),
    };
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [execData, orgData, deptData] = await Promise.all([
        executiveService.getAll(0, 1000),
        organizationService.getAll(),
        departmentService.getAll(),
      ]);
      setExecutives(execData);
      setOrganizations(orgData);
      setDepartments(deptData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      alert('Erro ao carregar executivos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setApiError(null); // Limpar erro da API ao tentar salvar novamente

    // Validação de Frontend
    const newErrors: { fullName?: string; workEmail?: string } = {};
    if (!currentExecutive.fullName || currentExecutive.fullName.trim() === '') {
      newErrors.fullName = "O Nome Completo é obrigatório.";
    }
    if (!currentExecutive.workEmail || currentExecutive.workEmail.trim() === '') {
      newErrors.workEmail = "O Email Corporativo é obrigatório.";
    }

    // Se houver erros no Frontend, interrompe e mostra na tela
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Abre automaticamente as seções que contêm erros
      setOpenSections(prev => ({
        ...prev,
        personal: newErrors.fullName ? true : prev.personal,
        contact: newErrors.workEmail ? true : prev.contact
      }));
      return;
    }

    // Requisição Backend
    try {
      const payload = normalizeExecutivePayload(currentExecutive);
      if (currentExecutive.id) {
        await executiveService.update(currentExecutive.id, payload);
      } else {
        await executiveService.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar executivo:', error);
      // Capturar mensagem do backend ("detail") ou erro genérico
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao salvar executivo no servidor. Verifique os dados.';
      setApiError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (executiveToDelete) {
      try {
        await executiveService.delete(executiveToDelete);
        setIsDeleteModalOpen(false);
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir executivo.');
      }
    }
  };

  const openEditModal = (executive: Executive) => {
    setCurrentExecutive({ ...executive });
    setErrors({}); 
    setApiError(null); 
    setOpenSections({
      personal: true,
      contact: true,
      professional: true,
      profile: false,
      emergency: false,
      finance: false,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentExecutive({});
    setErrors({}); 
    setApiError(null); 
    setOpenSections({
      personal: true,
      contact: true,
      professional: true,
      profile: false,
      emergency: false,
      finance: false,
    });
    setIsModalOpen(true);
  };

  const filteredExecutives = executives.filter(ex => {
    const name = ex.fullName ? ex.fullName.toLowerCase() : '';
    const email = ex.workEmail ? ex.workEmail.toLowerCase() : '';
    const term = searchTerm.toLowerCase();

    return name.includes(term) || email.includes(term);
  });
  const paginatedExecutives = filteredExecutives.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredExecutives.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredExecutives.length, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Executivos</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Executivo
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <tr>
                <th className="p-4 border-b">Nome</th>
                <th className="p-4 border-b">Cargo / Depto</th>
                <th className="p-4 border-b">Email Corporativo</th>
                <th className="p-4 border-b">Celular</th>
                <th className="p-4 border-b text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : filteredExecutives.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum executivo encontrado.</td>
                </tr>
              ) : (
                paginatedExecutives.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-4 font-medium">{ex.fullName}</td>
                    <td className="p-4">
                      <div className="font-medium">{ex.jobTitle || '-'}</div>
                      <div className="text-xs text-gray-500">
                        {departments.find((d) => d.id === ex.departmentId)?.name || ''}
                        {ex.departmentId && ex.organizationId ? ' - ' : ''}
                        {organizations.find((o) => o.id === ex.organizationId)?.name || ''}
                      </div>
                    </td>
                    <td className="p-4">{ex.workEmail}</td>
                    <td className="p-4">{ex.workPhone || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(ex)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { setExecutiveToDelete(ex.id); setIsDeleteModalOpen(true); }}
                          className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination 
            currentPage={currentPage} 
            totalItems={filteredExecutives.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage} 
          />
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentExecutive.id ? "Editar Executivo" : "Novo Executivo"}
      >
        <div className="flex flex-col h-[75vh]">
          
          {/* Conteúdo do Formulário Corrido com Scroll */}
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
                     className={`mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      errors.workEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                     }`}
                    value={currentExecutive.workEmail || ''}
                     onChange={e => {
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
                   <label className="block text-sm font-medium text-gray-700">Organização</label>
                   <select 
                      className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                   <label className="block text-sm font-medium text-gray-700">Gestor Direto</label>
                   <select 
                      className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Executivo"
        message="Tem certeza que deseja excluir este executivo? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default ExecutivesView;