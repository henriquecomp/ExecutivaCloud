import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutView, LegalOrganization, Organization, User } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import InviteUserForm from './InviteUserForm';
import { EditIcon, LockClosedIcon, NoSymbolIcon, PlusIcon, PrinterIcon } from './Icons';
import { downloadCsv, todayStamp } from '../utils/csvDownload';
import { typeMgmtEditIconBtn } from './ui/typeManagementStyles';
import {
  deactivateManagedUser,
  listManagedUsers,
  patchManagedUser,
  resendFirstAccessEmail,
  sendManagedUserPasswordReset,
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
  layout: LayoutView;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  organizations,
  legalOrganizations,
  layout,
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
  const [editOrgId, setEditOrgId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mailBusy, setMailBusy] = useState<{ userId: number; kind: 'first' | 'reset' } | null>(
    null,
  );

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

  const canReassignCompany =
    currentUser.role === 'master' ||
    (currentUser.role === 'admin_legal_organization' && !!currentUser.legalOrganizationId);

  const companyOptions = useMemo(() => {
    if (currentUser.role === 'master') {
      return [...organizations].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    }
    if (currentUser.role === 'admin_legal_organization' && currentUser.legalOrganizationId) {
      return organizations
        .filter((o) => o.legalOrganizationId === currentUser.legalOrganizationId)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    }
    return [];
  }, [currentUser.role, currentUser.legalOrganizationId, organizations]);

  const openEdit = (u: ManagedUserRow) => {
    setEditRow(u);
    setEditName(u.fullName);
    setEditEmail(u.email);
    setEditPhone(u.phone ?? '');
    setEditOrgId(u.organizationId != null ? String(u.organizationId) : '');
    setEditActive(u.isActive);
  };

  const submitEdit = async () => {
    if (!editRow) return;
    const isExecOrSec = editRow.role === 'executive' || editRow.role === 'secretary';
    const showOrgField = canReassignCompany && isExecOrSec;
    if (showOrgField && !editOrgId.trim()) {
      setError('Selecione a empresa (alocação do executivo ou da secretária).');
      return;
    }
    setEditSaving(true);
    setError(null);
    try {
      const initialOrg = editRow.organizationId ?? null;
      const nextOrg = showOrgField ? Number(editOrgId) : null;
      const orgChanged = showOrgField && nextOrg !== initialOrg;

      const updated = await patchManagedUser(editRow.id, {
        fullName: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() === '' ? null : editPhone.trim(),
        isActive: editActive,
        ...(orgChanged && nextOrg != null && !Number.isNaN(nextOrg) ? { organizationId: nextOrg } : {}),
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

  const runResendFirstAccess = async (u: ManagedUserRow) => {
    setMailBusy({ userId: u.id, kind: 'first' });
    setError(null);
    try {
      const msg = await resendFirstAccessEmail(u.id);
      setFlash(msg);
      window.setTimeout(() => setFlash(null), 5000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(
        typeof ax.response?.data?.detail === 'string'
          ? ax.response.data.detail
          : 'Não foi possível reenviar o e-mail.',
      );
    } finally {
      setMailBusy(null);
    }
  };

  const runSendPasswordReset = async (u: ManagedUserRow) => {
    setMailBusy({ userId: u.id, kind: 'reset' });
    setError(null);
    try {
      const msg = await sendManagedUserPasswordReset(u.id);
      setFlash(msg);
      window.setTimeout(() => setFlash(null), 5000);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(
        typeof ax.response?.data?.detail === 'string'
          ? ax.response.data.detail
          : 'Não foi possível enviar o e-mail de redefinição.',
      );
    } finally {
      setMailBusy(null);
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AppSelect
          id="limit-users"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-auto min-w-[5rem]"
          disabled={loading}
          aria-label="Itens por página"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </AppSelect>
        <button
          type="button"
          onClick={() => {
            const csvRows = rows.map(u => {
              const a = resolveUserAssociations(u, legalOrganizations, organizations);
              return {
                Nome: u.fullName ?? '',
                'E-mail': u.email ?? '',
                Telefone: u.phone ?? '',
                Organização: a.legalName ?? '',
                Empresa: a.companyName ?? '',
                Papel: u.role ?? '',
                Status: u.isActive ? 'Ativo' : 'Inativo',
              };
            });
            downloadCsv(['Nome', 'E-mail', 'Telefone', 'Organização', 'Empresa', 'Papel', 'Status'], csvRows, `usuarios_${todayStamp()}.csv`);
          }}
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform duration-150"
          title="Exportar resultados para CSV"
          aria-label="Exportar resultados para CSV"
        >
          <PrinterIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition"
          title="Convidar usuário"
          aria-label="Convidar usuário"
        >
          <PlusIcon />
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
        <p className="text-sm text-slate-500 shrink-0">
          {loading ? 'Carregando…' : `${total} registro(s)`}
        </p>
      </ToolbarPanel>

      {layout === 'table' && (
        <DataTable innerClassName="overflow-x-auto">
          <DataTableHead>
            <tr>
              <DataTableTh>Nome</DataTableTh>
              <DataTableTh className="hidden md:table-cell">E-mail</DataTableTh>
              <DataTableTh className="hidden lg:table-cell">Telefone</DataTableTh>
              <DataTableTh className="min-w-[12rem]">Organização / Empresa</DataTableTh>
              <DataTableTh>Papel</DataTableTh>
              <DataTableTh>Status</DataTableTh>
              <DataTableTh className="min-w-[10rem] whitespace-nowrap text-right">Ações</DataTableTh>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableEmptyRow colSpan={7}>Carregando…</DataTableEmptyRow>
            ) : rows.length === 0 ? (
              <DataTableEmptyRow colSpan={7}>Nenhum usuário encontrado.</DataTableEmptyRow>
            ) : (
              rows.map((u) => {
                const { legalName, companyName, title } = resolveUserAssociations(
                  u,
                  legalOrganizations,
                  organizations,
                );
                const resendBusy = mailBusy?.userId === u.id && mailBusy.kind === 'first';
                const resetBusy = mailBusy?.userId === u.id && mailBusy.kind === 'reset';
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
                    <DataTableTd className="align-middle whitespace-nowrap text-right">
                      <div className="inline-flex flex-row flex-nowrap items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className={typeMgmtEditIconBtn}
                          title="Editar"
                          aria-label="Editar"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        {u.isActive && u.id !== selfId && u.needsProfileCompletion && (
                          <button
                            type="button"
                            onClick={() => void runResendFirstAccess(u)}
                            disabled={!!mailBusy}
                            aria-busy={resendBusy}
                            className={`rounded-md p-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-50 ${
                              resendBusy ? 'animate-pulse' : ''
                            }`}
                            title={
                              resendBusy
                                ? 'Enviando e-mail…'
                                : 'Reenviar e-mail com link para definir a senha de primeiro acesso (convite pendente).'
                            }
                            aria-label={
                              resendBusy
                                ? 'Enviando e-mail de primeiro acesso'
                                : 'Reenviar e-mail com link para definir a senha de primeiro acesso'
                            }
                          >
                            <LockClosedIcon className="h-5 w-5" />
                          </button>
                        )}
                        {u.isActive && u.id !== selfId && !u.needsProfileCompletion && (
                          <button
                            type="button"
                            onClick={() => void runSendPasswordReset(u)}
                            disabled={!!mailBusy}
                            aria-busy={resetBusy}
                            className={`rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 ${
                              resetBusy ? 'animate-pulse' : ''
                            }`}
                            title={
                              resetBusy
                                ? 'Enviando e-mail…'
                                : 'Enviar e-mail com link seguro para o usuário definir uma nova senha.'
                            }
                            aria-label={
                              resetBusy
                                ? 'Enviando e-mail de redefinição de senha'
                                : 'Enviar e-mail com link para redefinir senha'
                            }
                          >
                            <LockClosedIcon className="h-5 w-5" />
                          </button>
                        )}
                        {u.isActive && u.id !== selfId && (
                          <button
                            type="button"
                            onClick={() => setDeactivateRow(u)}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                            title="Inativar conta — bloqueia o acesso ao sistema."
                            aria-label="Inativar usuário"
                          >
                            <NoSymbolIcon className="h-5 w-5" />
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
      )}

      {layout === 'card' && (
        loading ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <p className="text-slate-500">Carregando…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <p className="text-slate-500">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((u) => {
              const { legalName, companyName } = resolveUserAssociations(u, legalOrganizations, organizations);
              const resendBusy = mailBusy?.userId === u.id && mailBusy.kind === 'first';
              const resetBusy = mailBusy?.userId === u.id && mailBusy.kind === 'reset';
              return (
                <div key={u.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">{u.fullName}</h3>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {roleLabel(u.role)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{legalName} / {companyName}</p>
                  <div className="flex items-center gap-0.5 pt-2 border-t border-slate-100 mt-auto">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className={typeMgmtEditIconBtn}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    {u.isActive && u.id !== selfId && u.needsProfileCompletion && (
                      <button
                        type="button"
                        onClick={() => void runResendFirstAccess(u)}
                        disabled={!!mailBusy}
                        aria-busy={resendBusy}
                        className={`rounded-md p-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-50 ${
                          resendBusy ? 'animate-pulse' : ''
                        }`}
                        title={
                          resendBusy
                            ? 'Enviando e-mail…'
                            : 'Reenviar e-mail com link para definir a senha de primeiro acesso (convite pendente).'
                        }
                        aria-label={
                          resendBusy
                            ? 'Enviando e-mail de primeiro acesso'
                            : 'Reenviar e-mail com link para definir a senha de primeiro acesso'
                        }
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                    )}
                    {u.isActive && u.id !== selfId && !u.needsProfileCompletion && (
                      <button
                        type="button"
                        onClick={() => void runSendPasswordReset(u)}
                        disabled={!!mailBusy}
                        aria-busy={resetBusy}
                        className={`rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 ${
                          resetBusy ? 'animate-pulse' : ''
                        }`}
                        title={
                          resetBusy
                            ? 'Enviando e-mail…'
                            : 'Enviar e-mail com link seguro para o usuário definir uma nova senha.'
                        }
                        aria-label={
                          resetBusy
                            ? 'Enviando e-mail de redefinição de senha'
                            : 'Enviar e-mail com link para redefinir senha'
                        }
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                    )}
                    {u.isActive && u.id !== selfId && (
                      <button
                        type="button"
                        onClick={() => setDeactivateRow(u)}
                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        title="Inativar conta — bloqueia o acesso ao sistema."
                        aria-label="Inativar usuário"
                      >
                        <NoSymbolIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {layout === 'list' && (
        loading ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <p className="text-slate-500">Carregando…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <p className="text-slate-500">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md divide-y divide-slate-200">
            {rows.map((u) => {
              const resendBusy = mailBusy?.userId === u.id && mailBusy.kind === 'first';
              const resetBusy = mailBusy?.userId === u.id && mailBusy.kind === 'reset';
              return (
                <div key={u.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{u.fullName}</h3>
                    <p className="text-sm text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {roleLabel(u.role)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className={typeMgmtEditIconBtn}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    {u.isActive && u.id !== selfId && u.needsProfileCompletion && (
                      <button
                        type="button"
                        onClick={() => void runResendFirstAccess(u)}
                        disabled={!!mailBusy}
                        aria-busy={resendBusy}
                        className={`rounded-md p-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-50 ${
                          resendBusy ? 'animate-pulse' : ''
                        }`}
                        title={
                          resendBusy
                            ? 'Enviando e-mail…'
                            : 'Reenviar e-mail com link para definir a senha de primeiro acesso (convite pendente).'
                        }
                        aria-label={
                          resendBusy
                            ? 'Enviando e-mail de primeiro acesso'
                            : 'Reenviar e-mail com link para definir a senha de primeiro acesso'
                        }
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                    )}
                    {u.isActive && u.id !== selfId && !u.needsProfileCompletion && (
                      <button
                        type="button"
                        onClick={() => void runSendPasswordReset(u)}
                        disabled={!!mailBusy}
                        aria-busy={resetBusy}
                        className={`rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50 ${
                          resetBusy ? 'animate-pulse' : ''
                        }`}
                        title={
                          resetBusy
                            ? 'Enviando e-mail…'
                            : 'Enviar e-mail com link seguro para o usuário definir uma nova senha.'
                        }
                        aria-label={
                          resetBusy
                            ? 'Enviando e-mail de redefinição de senha'
                            : 'Enviar e-mail com link para redefinir senha'
                        }
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                    )}
                    {u.isActive && u.id !== selfId && (
                      <button
                        type="button"
                        onClick={() => setDeactivateRow(u)}
                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        title="Inativar conta — bloqueia o acesso ao sistema."
                        aria-label="Inativar usuário"
                      >
                        <NoSymbolIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

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
                {canReassignCompany &&
                  (editRow.role === 'executive' || editRow.role === 'secretary') &&
                  companyOptions.length > 0 && (
                    <div>
                      <AppLabel htmlFor="edit-user-org" className="mb-1">
                        Empresa (alocação)
                      </AppLabel>
                      <AppSelect
                        id="edit-user-org"
                        value={editOrgId}
                        onChange={(e) => setEditOrgId(e.target.value)}
                        className="w-full mt-1"
                      >
                        <option value="">Selecione a empresa…</option>
                        {companyOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </AppSelect>
                      <p className="mt-1 text-xs text-slate-500">
                        Altera a empresa em que o cadastro de executivo ou secretária está vinculado nesta organização
                        jurídica.
                      </p>
                    </div>
                  )}
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
