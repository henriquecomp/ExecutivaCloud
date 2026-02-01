import React, { useState, useMemo, useEffect } from 'react';
import { 
    Executive, 
    Organization, 
    Department, 
    Secretary,
    User
} from '../types';
import { apiService } from '../services/apiService';
import { 
    SearchIcon, 
    PlusIcon, 
    EditIcon, 
    DeleteIcon, 
    UserIcon, 
    BuildingIcon,
    ShieldIcon 
} from './Icons';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';

// --- Helper Functions para Máscaras ---
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

interface ExecutivesViewProps {
    currentUser: User;
    executives: Executive[];
    allExecutives: Executive[]; // Lista completa para referência cruzada
    setExecutives: React.Dispatch<React.SetStateAction<Executive[]>>;
    organizations: Organization[];
    departments: Department[];
    secretaries: Secretary[];
    setSecretaries: React.Dispatch<React.SetStateAction<Secretary[]>>;
    setEvents: any;
    setContacts: any;
    setExpenses: any;
    setTasks: any;
    setDocuments: any;
    setUsers: any;
}

// --- Componente de Formulário (Interno) ---
interface ExecutiveFormProps {
    executive?: Executive;
    organizations: Organization[];
    departments: Department[];
    otherExecutives: Executive[];
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

const ExecutiveForm: React.FC<ExecutiveFormProps> = ({ 
    executive, 
    organizations, 
    departments, 
    otherExecutives,
    onSave, 
    onCancel 
}) => {
    const [formData, setFormData] = useState<Partial<Executive>>({
        fullName: executive?.fullName || '',
        // Bloco 1: Identificação
        cpf: executive?.cpf || '',
        rg: executive?.rg || '',
        rgIssuer: executive?.rgIssuer || '',
        rgIssueDate: executive?.rgIssueDate || '',
        birthDate: executive?.birthDate || '',
        nationality: executive?.nationality || '',
        placeOfBirth: executive?.placeOfBirth || '',
        civilStatus: executive?.civilStatus || '',
        // Bloco 2: Contato
        workEmail: executive?.workEmail || '',
        workPhone: executive?.workPhone || '',
        extension: executive?.extension || '',
        personalEmail: executive?.personalEmail || '',
        personalPhone: executive?.personalPhone || '',
        address: executive?.address || '',
        linkedinProfileUrl: executive?.linkedinProfileUrl || '',
        // Bloco 3: Corporativo
        jobTitle: executive?.jobTitle || '',
        organizationId: executive?.organizationId || '',
        departmentId: executive?.departmentId || '',
        costCenter: executive?.costCenter || '',
        reportsToExecutiveId: executive?.reportsToExecutiveId || '',
        hireDate: executive?.hireDate || '',
        // Bloco 4: Perfil
        bio: executive?.bio || '',
        education: executive?.education || '',
        languages: executive?.languages || '',
        // Bloco 5: Emergência
        emergencyContactName: executive?.emergencyContactName || '',
        emergencyContactPhone: executive?.emergencyContactPhone || '',
        emergencyContactRelation: executive?.emergencyContactRelation || '',
    });

    const [activeTab, setActiveTab] = useState('pessoal');
    const [loading, setLoading] = useState(false);

    const filteredDepartments = useMemo(() => {
        if (!formData.organizationId) return [];
        return departments.filter(d => d.organizationId === formData.organizationId);
    }, [formData.organizationId, departments]);

    const handleChange = (field: keyof Executive, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar executivo. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'pessoal', label: 'Dados Pessoais' },
        { id: 'contato', label: 'Contato' },
        { id: 'corporativo', label: 'Corporativo' },
        { id: 'perfil', label: 'Perfil & Outros' },
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[70vh]">
            {/* Abas */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo das Abas com Scroll */}
            <div className="flex-1 overflow-y-auto px-2 space-y-4">
                {activeTab === 'pessoal' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                            <input required type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CPF</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.cpf} onChange={e => handleChange('cpf', maskCPF(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                                <input type="date" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.birthDate} onChange={e => handleChange('birthDate', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">RG</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.rg} onChange={e => handleChange('rg', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                                <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.civilStatus} onChange={e => handleChange('civilStatus', e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="Solteiro(a)">Solteiro(a)</option>
                                    <option value="Casado(a)">Casado(a)</option>
                                    <option value="Divorciado(a)">Divorciado(a)</option>
                                    <option value="Viúvo(a)">Viúvo(a)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contato' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Corporativo</label>
                                <input type="email" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.workEmail} onChange={e => handleChange('workEmail', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone Corporativo</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.workPhone} onChange={e => handleChange('workPhone', maskPhone(e.target.value))} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                            <input type="url" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                value={formData.linkedinProfileUrl} onChange={e => handleChange('linkedinProfileUrl', e.target.value)} />
                        </div>
                    </div>
                )}

                {activeTab === 'corporativo' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.jobTitle} onChange={e => handleChange('jobTitle', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Organização</label>
                                <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.organizationId}
                                    onChange={e => {
                                        handleChange('organizationId', e.target.value);
                                        handleChange('departmentId', '');
                                    }}>
                                    <option value="">Selecione...</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Departamento</label>
                                <select className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.departmentId}
                                    onChange={e => handleChange('departmentId', e.target.value)}
                                    disabled={!formData.organizationId}>
                                    <option value="">Selecione...</option>
                                    {filteredDepartments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Data de Admissão</label>
                                <input type="date" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.hireDate} onChange={e => handleChange('hireDate', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'perfil' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio / Resumo</label>
                            <textarea rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                value={formData.bio} onChange={e => handleChange('bio', e.target.value)} />
                        </div>
                        <h4 className="font-medium text-gray-900 border-t pt-4 mt-2">Contato de Emergência</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.emergencyContactName} onChange={e => handleChange('emergencyContactName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.emergencyContactPhone} onChange={e => handleChange('emergencyContactPhone', maskPhone(e.target.value))} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rodapé do Modal */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

// --- Componente Principal ---
const ExecutivesView: React.FC<ExecutivesViewProps> = ({ 
    executives, 
    organizations, 
    departments,
    allExecutives,
    setExecutives // Usado para atualizar o estado local se necessário após refetch
}) => {
    // Estado local para controle da UI
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    // Estados de Modais
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [executiveToEdit, setExecutiveToEdit] = useState<Executive | undefined>(undefined);
    const [executiveToDelete, setExecutiveToDelete] = useState<Executive | null>(null);

    // Refresh data manual para garantir sincronia (opcional se App.tsx já gerencia)
    const refreshData = async () => {
        try {
            const data = await (apiService as any).executives.getAll();
            setExecutives(data);
        } catch (e) { console.error(e); }
    };

    const filteredExecutives = useMemo(() => {
        return executives.filter(exec => 
            exec.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exec.workEmail?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [executives, searchTerm]);

    const paginatedExecutives = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExecutives.slice(start, start + itemsPerPage);
    }, [filteredExecutives, currentPage]);

    const handleSave = async (data: any) => {
        try {
            if (executiveToEdit) {
                await (apiService as any).executives.update(executiveToEdit.id, data);
            } else {
                await (apiService as any).executives.create(data);
            }
            setIsModalOpen(false);
            setExecutiveToEdit(undefined);
            refreshData(); // Atualiza a lista
        } catch (error) {
            console.error("Erro ao salvar:", error);
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!executiveToDelete) return;
        try {
            await (apiService as any).executives.delete(executiveToDelete.id);
            setExecutiveToDelete(null);
            refreshData();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir executivo.");
        }
    };

    const openNewModal = () => {
        setExecutiveToEdit(undefined);
        setIsModalOpen(true);
    };

    const openEditModal = (exec: Executive) => {
        setExecutiveToEdit(exec);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Executivos</h1>
                    <p className="text-gray-500">Gerencie o cadastro completo dos executivos.</p>
                </div>
                <button 
                    onClick={openNewModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" /> Novo Executivo
                </button>
            </div>

            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedExecutives.map(exec => (
                    <div key={exec.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                {exec.fullName.charAt(0)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEditModal(exec)} className="p-1 text-gray-400 hover:text-blue-600">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setExecutiveToDelete(exec)} className="p-1 text-gray-400 hover:text-red-600">
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-gray-800 truncate" title={exec.fullName}>{exec.fullName}</h3>
                        <p className="text-sm text-blue-600 font-medium truncate">{exec.jobTitle || 'Sem cargo'}</p>
                        <div className="mt-4 space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <BuildingIcon className="w-4 h-4 shrink-0" /> 
                                <span className="truncate">{organizations.find(o => o.id === exec.organizationId)?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldIcon className="w-4 h-4 shrink-0" /> 
                                <span className="truncate">{exec.workEmail || 'Sem email'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination 
                currentPage={currentPage} 
                totalPages={Math.ceil(filteredExecutives.length / itemsPerPage)} 
                onPageChange={setCurrentPage} 
            />

            {/* CORREÇÃO APLICADA AQUI: Renderização Condicional do Modal */}
            {isModalOpen && (
                <Modal
                    onClose={() => setIsModalOpen(false)}
                    title={executiveToEdit ? "Editar Executivo" : "Novo Executivo"}
                >
                    <ExecutiveForm
                        executive={executiveToEdit}
                        organizations={organizations}
                        departments={departments}
                        otherExecutives={allExecutives.filter(e => e.id !== executiveToEdit?.id)}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!executiveToDelete}
                onClose={() => setExecutiveToDelete(null)}
                onConfirm={handleDelete}
                title="Excluir Executivo"
                message={`Tem certeza que deseja excluir ${executiveToDelete?.fullName}?`}
            />
        </div>
    );
};

export default ExecutivesView;