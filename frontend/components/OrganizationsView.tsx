import React, { useState, useMemo, useEffect } from 'react';
import { Organization, Department, Executive, User, Secretary, Event, Contact, Expense, Task, Document, LegalOrganization, OrganizationCreate, OrganizationUpdate, DepartmentCreate, DepartmentUpdate, LayoutView } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon, PrinterIcon } from './Icons';
import { downloadCsv, todayStamp } from '../utils/csvDownload';
import AppSearchInput from './ui/AppSearchInput';
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from './ui/DataTable';
import { organizationService } from '@/services/organizationService';
import { departmentService } from '@/services/departmentService';
import AppButton from './ui/AppButton';
import AppSelect from './ui/AppSelect';
import ToolbarPanel from './ui/ToolbarPanel';
import Pagination from './Pagination';
import { isCompanyAdmin, isLegalOrgAdmin } from '../utils/tenantScope';
import OrganizationCompanyForm from './OrganizationCompanyForm';

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
  legalOrganizations: LegalOrganization[];
  onRefresh: () => Promise<void>;
  layout: LayoutView;
}

const DepartmentForm: React.FC<{ 
    department: Partial<Department>, 
    onSave: (department: DepartmentCreate | DepartmentUpdate) => void, 
    onCancel: () => void 
}> = ({ department, onSave, onCancel }) => {
    const [name, setName] = useState(department.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !department.organizationId) return;

        const data: any = {
            name: name.slice(0, FREE_TEXT_MAX),
            organizationId: department.organizationId,
        };
        
        if (department.id) {
            data.id = department.id;
        }

        onSave(data);
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
    setDocuments,
    legalOrganizations,
    onRefresh,
    layout,
}) => {
    const [isOrgModalOpen, setOrgModalOpen] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Partial<Organization> | null>(null);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Partial<Department> | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

    const isOrgAdmin = isCompanyAdmin(currentUser);
    
    const visibleOrganizations = useMemo(() => {
        const isAdminForLegalOrg = isLegalOrgAdmin(currentUser);
        
        if (isAdminForLegalOrg) {
            return organizations.filter(o => String(o.legalOrganizationId) === String(currentUser.legalOrganizationId));
        }
        if (isOrgAdmin) {
            return organizations.filter(o => String(o.id) === String(currentUser.organizationId));
        }
        return organizations;
    }, [organizations, currentUser, isOrgAdmin]);

    const [searchTerm, setSearchTerm] = useState('');
    const [orgPageLimit, setOrgPageLimit] = useState(6);
    const [orgCurrentPage, setOrgCurrentPage] = useState(1);

    const filteredOrganizations = useMemo(() => {
        if (!searchTerm.trim()) return visibleOrganizations;
        const term = searchTerm.toLowerCase();
        return visibleOrganizations.filter(o =>
            o.name.toLowerCase().includes(term) ||
            (o.cnpj && o.cnpj.toLowerCase().includes(term))
        );
    }, [visibleOrganizations, searchTerm]);

    const paginatedOrganizations = useMemo(() => {
        const start = (orgCurrentPage - 1) * orgPageLimit;
        return filteredOrganizations.slice(start, start + orgPageLimit);
    }, [filteredOrganizations, orgCurrentPage, orgPageLimit]);

    useEffect(() => {
        setOrgCurrentPage(1);
    }, [organizations, orgPageLimit, searchTerm, currentUser.role, currentUser.legalOrganizationId, currentUser.organizationId]);

    // Handlers ajustados para prevenir propagação e submits acidentais
    const handleAddOrganization = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingOrganization({});
        setApiError(null);
        setOrgModalOpen(true);
    };
    
    const handleEditOrganization = (e: React.MouseEvent, organization: Organization) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingOrganization(organization);
        setApiError(null);
        setOrgModalOpen(true);
    };
    
    const handleDeleteOrganization = (e: React.MouseEvent, org: Organization) => {
        e.preventDefault();
        e.stopPropagation();
        setApiError(null);
        setOrgToDelete(org);
    };
    
    const confirmDeleteOrganization = async () => {
        if (!orgToDelete) return;
        setIsLoading(true);
        try {
            setApiError(null);
            await organizationService.delete(orgToDelete.id);
            if (onRefresh) {
                await onRefresh();
            }
            setOrgToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir empresa.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveOrganization = async (orgData: OrganizationCreate | OrganizationUpdate) => {
        setIsLoading(true);
        try {
            setApiError(null);
            if ('id' in orgData && orgData.id) {
                await organizationService.update(String(orgData.id), orgData);
            } else {
                await organizationService.create(orgData as OrganizationCreate);
            }
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

    const handleAddDepartment = (e: React.MouseEvent, organizationId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingDepartment({ organizationId });
        setApiError(null);
        setDeptModalOpen(true);
    };
    
    const handleEditDepartment = (e: React.MouseEvent, department: Department) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingDepartment(department);
        setApiError(null);
        setDeptModalOpen(true);
    };
    
    const handleDeleteDepartment = (e: React.MouseEvent, dept: Department) => {
        e.preventDefault();
        e.stopPropagation();
        setApiError(null);
        setDeptToDelete(dept);
    };
    
    const confirmDeleteDepartment = async () => {
        if (!deptToDelete) return;
        setIsLoading(true);
        try {
            setApiError(null);
            await departmentService.delete(deptToDelete.id);
            if (onRefresh) {
                await onRefresh();
            }
            setDeptToDelete(null);
        } catch (error: any) {
            setApiError(error.response?.data?.detail || "Erro ao excluir departamento.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveDepartment = async (deptData: DepartmentCreate | DepartmentUpdate) => {
        setIsLoading(true);
        try {
            setApiError(null);
            if ('id' in deptData && deptData.id) {
                await departmentService.update(String(deptData.id), deptData);
            } else {
                await departmentService.create(deptData as DepartmentCreate);
            }
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

            <div className="flex flex-wrap items-center justify-end gap-2">
                <AppSelect
                    id="limit-orgs"
                    value={orgPageLimit}
                    onChange={(e) => setOrgPageLimit(Number(e.target.value))}
                    className="w-auto min-w-[5rem]"
                    aria-label="Itens por página"
                >
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                </AppSelect>
                <AppButton
                    type="button"
                    variant="ghost"
                    className="!p-2"
                    title="Exportar resultados para CSV"
                    aria-label="Exportar resultados para CSV"
                    onClick={() => {
                        const rows = filteredOrganizations.map(o => ({
                            Nome: o.name,
                            CNPJ: o.cnpj ?? '',
                            'Organização Legal': legalOrganizations.find(lo => String(lo.id) === String(o.legalOrganizationId))?.name ?? '',
                            Cidade: o.city ?? '',
                            Estado: o.state ?? '',
                        }));
                        downloadCsv(['Nome', 'CNPJ', 'Organização Legal', 'Cidade', 'Estado'], rows, `empresas_${todayStamp()}.csv`);
                    }}
                >
                    <PrinterIcon />
                </AppButton>
                <AppButton
                    onClick={handleAddOrganization}
                    disabled={isOrgAdmin}
                    className="!p-2"
                    title="Nova empresa"
                    aria-label="Nova empresa"
                >
                    <PlusIcon />
                </AppButton>
            </div>
            <ToolbarPanel>
                <AppSearchInput
                    placeholder="Buscar por nome ou CNPJ…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar empresas"
                />
            </ToolbarPanel>

            {(layout === 'card' || layout === 'list') && (
              <div className={layout === 'card' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                {paginatedOrganizations.map(org => {
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
                                    <button type="button" onClick={(e) => handleEditOrganization(e, org)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" aria-label="Editar empresa"><EditIcon /></button>
                                    <button type="button" onClick={(e) => handleDeleteOrganization(e, org)} disabled={isOrgAdmin} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" aria-label="Excluir empresa"><DeleteIcon /></button>
                                </div>
                            </header>
                            <div className="p-4 flex-1">
                                {(org.street || org.city) && layout === 'card' && (
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
                                                    <button type="button" onClick={(e) => handleEditDepartment(e, dept)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Editar departamento"><EditIcon /></button>
                                                    <button type="button" onClick={(e) => handleDeleteDepartment(e, dept)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Excluir departamento"><DeleteIcon /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">Nenhum departamento cadastrado.</p>
                                )}
                            </div>
                            <footer className="p-4 border-t border-slate-200">
                                <button type="button" onClick={(e) => handleAddDepartment(e, org.id)} className="flex w-full items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200" title="Adicionar departamento" aria-label="Adicionar departamento"><PlusIcon /></button>
                            </footer>
                        </div>
                    );
                })}
                {filteredOrganizations.length === 0 && (
                    <div className="lg:col-span-2 text-center p-6 bg-white rounded-xl shadow-md"><p className="text-slate-500">Nenhuma empresa cadastrada.</p></div>
                )}
              </div>
            )}
            {layout === 'table' && (
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableTh>Nome</DataTableTh>
                    <DataTableTh className="hidden md:table-cell">CNPJ</DataTableTh>
                    <DataTableTh className="hidden lg:table-cell">Organização Legal</DataTableTh>
                    <DataTableTh className="hidden lg:table-cell">Cidade / Estado</DataTableTh>
                    <DataTableTh className="hidden lg:table-cell">Departamentos</DataTableTh>
                    <DataTableTh className="min-w-[6rem] whitespace-nowrap text-right">Ações</DataTableTh>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredOrganizations.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-6 text-slate-500">Nenhuma empresa cadastrada.</td></tr>
                  ) : paginatedOrganizations.map(org => {
                    const legalOrg = legalOrganizations.find(lo => String(lo.id) === String(org.legalOrganizationId));
                    const orgDepts = departments.filter(d => String(d.organizationId) === String(org.id));
                    return (
                      <DataTableRow key={org.id}>
                        <DataTableTd className="font-medium text-slate-800">{org.name}</DataTableTd>
                        <DataTableTd className="hidden md:table-cell text-slate-600">{org.cnpj || '-'}</DataTableTd>
                        <DataTableTd className="hidden lg:table-cell text-slate-600">{legalOrg?.name || '-'}</DataTableTd>
                        <DataTableTd className="hidden lg:table-cell text-slate-600">{[org.city, org.state].filter(Boolean).join(' / ') || '-'}</DataTableTd>
                        <DataTableTd className="hidden lg:table-cell text-slate-600">{orgDepts.map(d => d.name).join(', ') || '-'}</DataTableTd>
                        <DataTableTd className="text-right">
                          <div className="inline-flex flex-row flex-nowrap items-center justify-end gap-0.5">
                            <button type="button" onClick={(e) => handleAddDepartment(e, org.id)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" title="Adicionar departamento" aria-label="Adicionar departamento"><PlusIcon /></button>
                            <button type="button" onClick={(e) => handleEditOrganization(e, org)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" aria-label="Editar empresa"><EditIcon /></button>
                            <button type="button" onClick={(e) => handleDeleteOrganization(e, org)} disabled={isOrgAdmin} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition disabled:text-slate-300 disabled:hover:text-slate-300 disabled:cursor-not-allowed" aria-label="Excluir empresa"><DeleteIcon /></button>
                          </div>
                        </DataTableTd>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            )}

            {filteredOrganizations.length > 0 && (
                <Pagination currentPage={orgCurrentPage} totalItems={filteredOrganizations.length} itemsPerPage={orgPageLimit} onPageChange={setOrgCurrentPage} />
            )}

            {/* AQUI ESTÁ A CORREÇÃO PRINCIPAL: Passando isOpen explicitamente e removendo o && */}
            <Modal 
                isOpen={isOrgModalOpen}
                title={editingOrganization?.id ? 'Editar empresa' : 'Nova empresa'} 
                onClose={() => {setOrgModalOpen(false); setEditingOrganization(null)}}
            >
                {apiError && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded" role="alert">
                        <p className="font-bold">Atenção</p>
                        <p>{apiError}</p>
                    </div>
                )}
                <OrganizationCompanyForm 
                    organization={editingOrganization || {}} 
                    onSave={handleSaveOrganization} 
                    onCancel={() => { setOrgModalOpen(false); setEditingOrganization(null); }} 
                    legalOrganizations={legalOrganizations}
                    currentUser={currentUser}
                />
            </Modal>

            {/* AQUI ESTÁ A CORREÇÃO PRINCIPAL: Passando isOpen explicitamente e removendo o && */}
            <Modal 
                isOpen={isDeptModalOpen}
                title={editingDepartment?.id ? 'Editar departamento' : 'Novo departamento'} 
                onClose={() => {setDeptModalOpen(false); setEditingDepartment(null)}}
            >
                {apiError && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded" role="alert">
                        <p className="font-bold">Atenção</p>
                        <p>{apiError}</p>
                    </div>
                )}
                <DepartmentForm 
                    department={editingDepartment || {}} 
                    onSave={handleSaveDepartment} 
                    onCancel={() => { setDeptModalOpen(false); setEditingDepartment(null); }} 
                />
            </Modal>

            {/* ConfirmationModal também usa isOpen internamente, e no seu código original ele é baseado na variável orgToDelete/deptToDelete. Está correto. */}
            <ConfirmationModal
                isOpen={!!orgToDelete}
                onClose={() => setOrgToDelete(null)}
                onConfirm={confirmDeleteOrganization}
                title="Confirmar Exclusão"
                message={apiError ? `ERRO: ${apiError}` : `Tem certeza que deseja excluir a empresa ${orgToDelete?.name}? TODOS os seus dados (departamentos, executivos, atividades, etc) e usuários associados serão permanentemente removidos.`}
            />
            
            <ConfirmationModal
                isOpen={!!deptToDelete}
                onClose={() => setDeptToDelete(null)}
                onConfirm={confirmDeleteDepartment}
                title="Confirmar Exclusão"
                message={apiError ? `ERRO: ${apiError}` : `Tem certeza que deseja excluir o departamento ${deptToDelete?.name}? Os executivos associados serão desvinculados.`}
            />
        </div>
    );
};

export default OrganizationsView;