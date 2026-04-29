import React, { useCallback, useEffect, useState } from 'react';
import type { LegalOrganization, Organization, User } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import InviteUserForm from './InviteUserForm';
import { EditIcon } from './Icons';
import {
  deactivateManagedUser,
  listManagedUsers,
  patchManagedUser,
  type ManagedUserRow,
} from '../services/userManagementService';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from './ui/DataTable';
import AppSearchInput from './ui/AppSearchInput';
import AppLabel from './ui/AppLabel';
import AppSelect from './ui/AppSelect';
import ToolbarPanel from './ui/ToolbarPanel';
import Pagination from './Pagination';

const roleLabel = (role: string): string => {
  const map: Record<string, string> = {
    master: 'Master',
    admin_legal_organization: 'Administrador da organização',
    admin_company: 'Administrador da empresa',
    executive: 'Executivo',
    secretary: 'Secretária',
  };
  return map[role] || role;
};

function resolveUserAssociations(
  u: ManagedUserRow,
  legalOrganizations: LegalOrganization[],
  organizations: Organization[],
): { legalName: string; companyName: string; title: string } {
  const org =
    u.organizationId != null
      ? organizations.find((o) => String(o.id) === String(u.organizationId))
      : undefined;
  const legalDirect =
    u.legalOrganizationId != null
      ? legalOrganizations.find((lo) => String(lo.id) === String(u.legalOrganizationId))
      : undefined;
  const legalFromOrg =
    org?.legalOrganizationId != null
      ? legalOrganizations.find((lo) => String(lo.id) === String(org.legalOrganizationId))
      : undefined;
  const legalName = legalDirect?.name ?? legalFromOrg?.name ?? '—';
  const companyName = org?.name ?? '—';
  const title = `Organização jurídica: ${legalName}\nEmpresa: ${companyName}`;
  return { legalName, companyName, title };
}

export interface UserManagementViewProps {
  currentUser: User;
  organizations: Organization[];
  legalOrganizations: LegalOrganization[];
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  organizations,
  legalOrganizations,
}) => {
  const [qInput, setQInput] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [rows, setRows] = useState<ManagedUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editRow, setEditRow] = useState<ManagedUserRow | null>(null);
  const [deactivateRow, setDeactivateRow] = useState<ManagedUserRow | null>(null);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = window.setTimeout(() => setQApplied(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [qApplied]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * pageSize;
      const { items, total: totalCount } = await listManagedUsers({
        q: qApplied || undefined,
        skip,
        limit: pageSize,
      });
      setRows(items);
      setTotal(totalCount);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [qApplied, currentPage, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [total, pageSize, currentPage]);

  const openEdit = (u: ManagedUserRow) => {
    setEditRow(u);
    setEditName(u.fullName);
    setEditEmail(u.email);
    setEditPhone(u.phone ?? '');
    setEditActive(u.isActive);
  };

  const submitEdit = async () => {
    if (!editRow) return;
    setEditSaving(true);
    setError(null);
    try {
      const updated = await patchManagedUser(editRow.id, {
        fullName: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() === '' ? null : editPhone.trim(),
        isActive: editActive,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditRow(null);
      setFlash('Usuário atualizado.');
      window.setTimeout(() => setFlash(null), 4000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Falha ao salvar.');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateRow) return;
    try {
      const updated = await deactivateManagedUser(deactivateRow.id);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDeactivateRow(null);
      setFlash('Usuário inativado.');
      window.setTimeout(() => setFlash(null), 4000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Não foi possível inativar.');
      throw e;
    }
  };

  const selfId = Number(currentUser.id);

  return (
    <div className="space-y-6 animate-fade-in w-full min-w-0">
      <div className="flex flex-wrap justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={() => void refresh()}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium"
        >
          Atualizar
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
        >
          Convidar usuário
        </button>
      </div>

      {flash && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{flash}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      <ToolbarPanel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <AppSearchInput
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            aria-label="Buscar usuários"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Carregando…' : `${total} registro(s)`}
          </p>
          <div className="flex items-center gap-2">
            <AppLabel htmlFor="limit-users" className="mb-0 inline text-slate-600">
              Por página
            </AppLabel>
            <AppSelect
              id="limit-users"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-auto min-w-[5rem]"
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </AppSelect>
          </div>
        </div>
      </ToolbarPanel>

      <DataTable innerClassName="overflow-x-auto">
        <DataTableHead>
          <tr>
            <DataTableTh>Nome</DataTableTh>
            <DataTableTh className="hidden md:table-cell">E-mail</DataTableTh>
            <DataTableTh className="hidden lg:table-cell">Telefone</DataTableTh>
            <DataTableTh className="min-w-[12rem]">Organização / Empresa</DataTableTh>
            <DataTableTh>Papel</DataTableTh>
            <DataTableTh>Status</DataTableTh>
            <DataTableTh className="hidden sm:table-cell">Perfil</DataTableTh>
            <DataTableTh className="w-32">Ações</DataTableTh>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {loading ? (
            <DataTableEmptyRow colSpan={8}>Carregando…</DataTableEmptyRow>
          ) : rows.length === 0 ? (
            <DataTableEmptyRow colSpan={8}>Nenhum usuário encontrado.</DataTableEmptyRow>
          ) : (
            rows.map((u) => {
              const { legalName, companyName, title } = resolveUserAssociations(
                u,
                legalOrganizations,
                organizations,
              );
              return (
                <DataTableRow key={u.id}>
                  <DataTableTd className="font-medium text-slate-800">{u.fullName}</DataTableTd>
                  <DataTableTd className="hidden md:table-cell text-slate-600">{u.email}</DataTableTd>
                  <DataTableTd className="hidden lg:table-cell text-slate-600">{u.phone || '—'}</DataTableTd>
                  <DataTableTd className="text-xs text-slate-600 align-top" title={title}>
                    <div className="max-w-[18rem] space-y-1">
                      <div className="leading-snug">
                        <span className="font-medium text-slate-400">Org. jurídica:</span>{' '}
                        <span className="break-words">{legalName}</span>
                      </div>
                      <div className="leading-snug">
                        <span className="font-medium text-slate-400">Empresa:</span>{' '}
                        <span className="break-words">{companyName}</span>
                      </div>
                    </div>
                  </DataTableTd>
                  <DataTableTd className="text-slate-600">{roleLabel(u.role)}</DataTableTd>
                  <DataTableTd>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </DataTableTd>
                  <DataTableTd className="hidden sm:table-cell text-slate-600">
                    {u.needsProfileCompletion ? <span className="text-amber-700">Pendente</span> : '—'}
                  </DataTableTd>
                  <DataTableTd>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      {u.isActive && u.id !== selfId && (
                        <button
                          type="button"
                          onClick={() => setDeactivateRow(u)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Inativar
                        </button>
                      )}
                    </div>
                  </DataTableTd>
                </DataTableRow>
              );
            })
          )}
        </DataTableBody>
      </DataTable>

      {!loading && total > 0 && (
        <Pagination currentPage={currentPage} totalItems={total} itemsPerPage={pageSize} onPageChange={setCurrentPage} />
      )}

      {inviteOpen && (
        <Modal title="Convidar usuário" onClose={() => setInviteOpen(false)}>
          <div className="p-1 w-full min-w-0">
            <p className="text-sm text-slate-500 mb-4">
              O convidado receberá um e-mail para definir a senha. Executivos e secretárias completam o perfil no primeiro acesso.
            </p>
            <InviteUserForm
              currentUser={currentUser}
              organizations={organizations}
              legalOrganizations={legalOrganizations}
              onSuccess={(msg) => {
                setInviteOpen(false);
                setFlash(msg);
                window.setTimeout(() => setFlash(null), 5000);
                void refresh();
              }}
            />
          </div>
        </Modal>
      )}

      {editRow &&
        (() => {
          const assoc = resolveUserAssociations(editRow, legalOrganizations, organizations);
          return (
            <Modal title="Alterar usuário" onClose={() => !editSaving && setEditRow(null)}>
              <div className="space-y-4 w-full min-w-0 p-1">
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1"
                  title={assoc.title}
                >
                  <div>
                    <span className="font-medium text-slate-500">Organização jurídica:</span> {assoc.legalName}
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Empresa:</span> {assoc.companyName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => {
                      if (editRow.id === selfId && !e.target.checked) return;
                      setEditActive(e.target.checked);
                    }}
                  />
                  Conta ativa
                </label>
                {editRow.id === selfId && (
                  <p className="text-xs text-slate-500">Não é possível inativar a própria conta por aqui.</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditRow(null)}
                    disabled={editSaving}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitEdit()}
                    disabled={editSaving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editSaving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

      <ConfirmationModal
        isOpen={!!deactivateRow}
        onClose={() => setDeactivateRow(null)}
        onConfirm={() => confirmDeactivate()}
        title="Inativar usuário"
        message={
          deactivateRow
            ? (() => {
                const a = resolveUserAssociations(deactivateRow, legalOrganizations, organizations);
                return `Confirma a inativação de ${deactivateRow.fullName} (${deactivateRow.email})?\n\nOrganização jurídica: ${a.legalName}\nEmpresa: ${a.companyName}\n\nO acesso ao sistema será bloqueado.`;
              })()
            : ''
        }
      />
    </div>
  );
};

export default UserManagementView;
