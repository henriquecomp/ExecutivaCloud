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

  useEffect(() => {
    const t = window.setTimeout(() => setQApplied(qInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const limit = 200;
      let skip = 0;
      const acc: ManagedUserRow[] = [];
      let totalCount = 0;
      for (;;) {
        const { items, total } = await listManagedUsers({
          q: qApplied || undefined,
          skip,
          limit,
        });
        totalCount = total;
        acc.push(...items);
        if (acc.length >= total || items.length === 0) {
          break;
        }
        skip += items.length;
      }
      setRows(acc);
      setTotal(totalCount);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [qApplied]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Usuários</h2>
          {currentUser.role === 'master' ? (
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Como administrador geral do sistema, você vê todos os usuários de todas as organizações jurídicas, empresas, executivos e
              secretárias. Convite, alteração e inativação podem ser feitos em qualquer conta (exceto inativar a própria sessão aqui).
              Apenas o papel master tem esta visão global.
            </p>
          ) : (
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Consulta, convite, alteração e inativação apenas no seu escopo: sua empresa ou sua organização jurídica. A listagem de todo o
              sistema é exclusiva do administrador geral (master).
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
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
      </div>

      {flash && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{flash}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="block text-sm text-slate-600 flex-1 min-w-0">
            <span className="font-medium text-slate-700">Buscar</span>
            <input
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Nome ou e-mail…"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <p className="text-sm text-slate-500 self-end">
            {loading ? 'Carregando…' : `${total} registro(s)`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-slate-200 text-slate-500">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3 hidden md:table-cell">E-mail</th>
                <th className="p-3 hidden lg:table-cell">Telefone</th>
                <th className="p-3 min-w-[12rem]">Organização / Empresa</th>
                <th className="p-3">Papel</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden sm:table-cell">Perfil</th>
                <th className="p-3 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const { legalName, companyName, title } = resolveUserAssociations(
                  u,
                  legalOrganizations,
                  organizations,
                );
                return (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{u.fullName}</td>
                  <td className="p-3 hidden md:table-cell text-slate-600">{u.email}</td>
                  <td className="p-3 hidden lg:table-cell text-slate-600">{u.phone || '—'}</td>
                  <td className="p-3 text-xs text-slate-600 align-top" title={title}>
                    <div className="space-y-1 max-w-[18rem]">
                      <div className="leading-snug">
                        <span className="text-slate-400 font-medium">Org. jurídica:</span>{' '}
                        <span className="break-words">{legalName}</span>
                      </div>
                      <div className="leading-snug">
                        <span className="text-slate-400 font-medium">Empresa:</span>{' '}
                        <span className="break-words">{companyName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{roleLabel(u.role)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-slate-600">
                    {u.needsProfileCompletion ? <span className="text-amber-700">Pendente</span> : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      {u.isActive && u.id !== selfId && (
                        <button
                          type="button"
                          onClick={() => setDeactivateRow(u)}
                          className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Inativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <p className="text-center p-8 text-slate-500">Nenhum usuário encontrado.</p>
          )}
        </div>
      </div>

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
