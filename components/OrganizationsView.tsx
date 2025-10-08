import React, { useState } from 'react';
import { Organization, Department, Executive, User, Secretary, Event, Contact, Expense, Task, Document } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { EditIcon, DeleteIcon, PlusIcon } from './Icons';

interface OrganizationsViewProps {
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

const OrganizationForm: React.FC<{ organization: Partial<Organization>, onSave: (organization: Organization) => void, onCancel: () => void }> = ({ organization, onSave, onCancel }) => {
    const [name, setName] = useState(organization.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({
            id: organization.id || `org_${new Date().getTime()}`,
            name,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome da Organização</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Salvar Organização</button>
            </div>
        </form>
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
    organizations, setOrganizations, 
    departments, setDepartments, 
    executives, setExecutives, 
    secretaries, setSecretaries,
    setEvents, setContacts, setExpenses, setTasks,
    setDocuments, setUsers 
}) => {
    const [isOrgModalOpen, setOrgModalOpen] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Partial<Organization> | null>(null);
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Partial<Department> | null>(null);

    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

    // Organization Handlers
    const handleAddOrganization = () => {
        setEditingOrganization({});
        setOrgModalOpen(true);
    };
    const handleEditOrganization = (organization: Organization) => {
        setEditingOrganization(organization);
        setOrgModalOpen(true);
    };
    const handleDeleteOrganization = (org: Organization) => {
        setOrgToDelete(org);
    };
    const confirmDeleteOrganization = () => {
        if (!orgToDelete) return;

        const orgId = orgToDelete.id;

        // 1. Find all executives belonging to this organization to cascade their deletion
        const executivesToDelete = executives.filter(e => e.organizationId === orgId);
        const executivesToDeleteIds = executivesToDelete.map(e => e.id);

        // 2. Delete the organization
        setOrganizations(orgs => orgs.filter(o => o.id !== orgId));

        // 3. Delete all departments of the organization
        setDepartments(depts => depts.filter(d => d.organizationId !== orgId));

        // 4. Delete all related executives
        setExecutives(execs => execs.filter(e => e.organizationId !== orgId));

        // 5. Delete all data related to the deleted executives
        setEvents(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setContacts(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setExpenses(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setTasks(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));
        setDocuments(prev => prev.filter(item => !executivesToDeleteIds.includes(item.executiveId)));

        // 6. Unlink deleted executives from any secretaries
        setSecretaries(secs => secs.map(sec => ({
            ...sec,
            executiveIds: sec.executiveIds.filter(execId => !executivesToDeleteIds.includes(execId))
        })));

        // 7. Delete all users (admin for the org, and users for all deleted executives)
        setUsers(users => users.filter(u => {
            if (u.organizationId === orgId) return false; // Remove org admin
            if (u.executiveId && executivesToDeleteIds.includes(u.executiveId)) return false; // Remove executive users
            return true;
        }));

        setOrgToDelete(null);
    };
    const handleSaveOrganization = (organization: Organization) => {
        if (editingOrganization && editingOrganization.id) {
            setOrganizations(orgs => orgs.map(o => o.id === organization.id ? organization : o));
            setUsers(users => users.map(u => u.organizationId === organization.id ? { ...u, fullName: `Admin ${organization.name}` } : u));
        } else {
            setOrganizations(orgs => [...orgs, organization]);
            setUsers(users => [...users, {
                id: `user_admin_${organization.id}`,
                fullName: `Admin ${organization.name}`,
                role: 'admin',
                organizationId: organization.id
            }]);
        }
        setOrgModalOpen(false);
        setEditingOrganization(null);
    };

    // Department Handlers
    const handleAddDepartment = (organizationId: string) => {
        setEditingDepartment({ organizationId });
        setDeptModalOpen(true);
    };
    const handleEditDepartment = (department: Department) => {
        setEditingDepartment(department);
        setDeptModalOpen(true);
    };
    const handleDeleteDepartment = (dept: Department) => {
        setDeptToDelete(dept);
    };
    const confirmDeleteDepartment = () => {
        if (!deptToDelete) return;
        const id = deptToDelete.id;
        setDepartments(depts => depts.filter(d => d.id !== id));
        setExecutives(execs => execs.map(e => e.departmentId === id ? { ...e, departmentId: undefined } : e));
        setDeptToDelete(null);
    };
    const handleSaveDepartment = (department: Department) => {
        setDepartments(depts => {
            if (editingDepartment && editingDepartment.id) {
                return depts.map(d => d.id === department.id ? department : d);
            }
            return [...depts, department];
        });
        setDeptModalOpen(false);
        setEditingDepartment(null);
    };


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gerenciar Organizações</h2>
                    <p className="text-slate-500 mt-1">Adicione ou edite as empresas e seus respectivos departamentos.</p>
                </div>
                <button onClick={handleAddOrganization} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition duration-150">
                    <PlusIcon />
                    Nova Organização
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {organizations.map(org => {
                    const orgDepartments = departments.filter(d => d.organizationId === org.id);
                    return (
                        <div key={org.id} className="bg-white rounded-xl shadow-md flex flex-col">
                            <header className="flex items-center justify-between p-4 border-b border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800">{org.name}</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditOrganization(org)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition" aria-label="Editar organização">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => handleDeleteOrganization(org)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition" aria-label="Excluir organização">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </header>
                            <div className="p-4 flex-1">
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

                {organizations.length === 0 && (
                    <div className="lg:col-span-2 text-center p-6 bg-white rounded-xl shadow-md">
                        <p className="text-slate-500">Nenhuma organização cadastrada.</p>
                    </div>
                )}
            </div>

            {isOrgModalOpen && (
                <Modal title={editingOrganization?.id ? 'Editar Organização' : 'Nova Organização'} onClose={() => {setOrgModalOpen(false); setEditingOrganization(null)}}>
                    <OrganizationForm organization={editingOrganization || {}} onSave={handleSaveOrganization} onCancel={() => { setOrgModalOpen(false); setEditingOrganization(null); }} />
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
                    message={`Tem certeza que deseja excluir a organização ${orgToDelete.name}? TODOS os seus dados (departamentos, executivos, atividades, etc) e usuários associados serão permanentemente removidos.`}
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