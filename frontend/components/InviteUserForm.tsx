import React, { useMemo, useState } from 'react';
import { inviteUser } from '../services/authService';
import type { Executive, LegalOrganization, Organization, User } from '../types';

export interface InviteUserFormProps {
  currentUser: User;
  organizations: Organization[];
  /** Para o master: cascata organização jurídica → empresa. */
  legalOrganizations?: LegalOrganization[];
  /** Executivos da plataforma (filtrados por empresa ao convidar secretária). */
  executives?: Executive[];
  /** Chamado após convite enviado com sucesso (mensagem do servidor). */
  onSuccess?: (message: string) => void;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({
  currentUser,
  organizations,
  legalOrganizations = [],
  executives = [],
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [invitedRole, setInvitedRole] = useState<'admin_company' | 'executive' | 'secretary'>('executive');
  const [legalOrganizationId, setLegalOrganizationId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secretaryExecutiveIds, setSecretaryExecutiveIds] = useState<number[]>([]);

  const isMaster = currentUser.role === 'master';

  const selectableOrgs = useMemo(() => {
    if (isMaster) return [];
    if (currentUser.role === 'admin' && currentUser.legalOrganizationId) {
      return organizations.filter((o) => o.legalOrganizationId === currentUser.legalOrganizationId);
    }
    if (currentUser.role === 'admin' && currentUser.organizationId) {
      return organizations.filter((o) => o.id === currentUser.organizationId);
    }
    return [];
  }, [currentUser, organizations, isMaster]);

  const masterCompanies = useMemo(() => {
    if (!isMaster || !legalOrganizationId) return [];
    return organizations.filter((o) => String(o.legalOrganizationId) === String(legalOrganizationId));
  }, [isMaster, legalOrganizationId, organizations]);

  React.useEffect(() => {
    if (isMaster) return;
    if (selectableOrgs.length === 1 && !organizationId) {
      setOrganizationId(selectableOrgs[0].id);
    }
  }, [selectableOrgs, organizationId, isMaster]);

  React.useEffect(() => {
    if (!isMaster) return;
    setOrganizationId('');
  }, [legalOrganizationId, isMaster]);

  React.useEffect(() => {
    if (!isMaster) return;
    if (masterCompanies.length === 1) {
      setOrganizationId(masterCompanies[0].id);
    }
  }, [isMaster, masterCompanies]);

  const singleCompanyAdmin = currentUser.systemRole === 'admin_company';
  const orgRequired =
    invitedRole === 'admin_company' || invitedRole === 'executive' || invitedRole === 'secretary';
  const needsOrgPicker = !singleCompanyAdmin && orgRequired;

  const resolvedOrganizationId = useMemo(() => {
    let org: string | undefined = organizationId;
    if (currentUser.systemRole === 'admin_company' && currentUser.organizationId) {
      org = currentUser.organizationId;
    }
    return org != null && String(org).trim() !== '' ? String(org) : undefined;
  }, [currentUser.role, currentUser.organizationId, currentUser.legalOrganizationId, organizationId]);

  const executivesForInviteCompany = useMemo(() => {
    if (!resolvedOrganizationId) return [];
    return executives.filter((e) => e.organizationId === resolvedOrganizationId);
  }, [executives, resolvedOrganizationId]);

  React.useEffect(() => {
    if (invitedRole !== 'secretary') setSecretaryExecutiveIds([]);
  }, [invitedRole]);

  React.useEffect(() => {
    setSecretaryExecutiveIds((prev) =>
      prev.filter((id) => executivesForInviteCompany.some((e) => Number(e.id) === id)),
    );
  }, [executivesForInviteCompany]);

  const toggleInviteExecutive = (execNumericId: number) => {
    setSecretaryExecutiveIds((prev) =>
      prev.includes(execNumericId) ? prev.filter((x) => x !== execNumericId) : [...prev, execNumericId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!fullName.trim()) {
      setError('Informe o nome completo.');
      return;
    }
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setError('E-mail e confirmação não coincidem.');
      return;
    }
    let org: string | undefined = organizationId;
    if (currentUser.systemRole === 'admin_company' && currentUser.organizationId) {
      org = currentUser.organizationId;
    }
    if (isMaster && orgRequired && !legalOrganizationId) {
      setError('Selecione a organização jurídica.');
      return;
    }
    if (orgRequired && !org) {
      setError('Selecione a empresa.');
      return;
    }
    if (invitedRole === 'secretary' && secretaryExecutiveIds.length < 1) {
      setError('Selecione ao menos um executivo da empresa para a secretária.');
      return;
    }
    setLoading(true);
    try {
      const res = await inviteUser({
        fullName: fullName.trim(),
        email: email.trim(),
        emailConfirm: emailConfirm.trim(),
        invitedRole,
        organizationId: org != null && org !== '' ? org : undefined,
        ...(invitedRole === 'secretary' ? { secretaryExecutiveIds: secretaryExecutiveIds } : {}),
      });
      if (onSuccess) {
        onSuccess(res.message);
      } else {
        setMessage(res.message);
      }
      setFullName('');
      setEmail('');
      setEmailConfirm('');
      setLegalOrganizationId('');
      setOrganizationId('');
      setSecretaryExecutiveIds([]);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Falha ao enviar convite.');
    } finally {
      setLoading(false);
    }
  };

  const sortedLegal = useMemo(
    () => [...legalOrganizations].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [legalOrganizations],
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (login)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar e-mail</label>
        <input
          type="email"
          value={emailConfirm}
          onChange={(e) => setEmailConfirm(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Papel</label>
        <select
          value={invitedRole}
          onChange={(e) => setInvitedRole(e.target.value as typeof invitedRole)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="admin_company">Administrador da empresa</option>
          <option value="executive">Executivo</option>
          <option value="secretary">Secretária</option>
        </select>
      </div>
      {needsOrgPicker && isMaster && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organização jurídica</label>
            <select
              value={legalOrganizationId}
              onChange={(e) => setLegalOrganizationId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required={orgRequired}
            >
              <option value="">Selecione a organização…</option>
              {sortedLegal.map((lo) => (
                <option key={lo.id} value={lo.id}>
                  {lo.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required={orgRequired}
              disabled={!legalOrganizationId}
            >
              <option value="">{legalOrganizationId ? 'Selecione a empresa…' : 'Primeiro escolha a organização'}</option>
              {[...masterCompanies]
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}
      {needsOrgPicker && !isMaster && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required={orgRequired}
            disabled={selectableOrgs.length <= 1 && !!organizationId}
          >
            <option value="">Selecione…</option>
            {selectableOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {invitedRole === 'secretary' && resolvedOrganizationId && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Executivos atendidos</label>
          <p className="text-xs text-slate-500 mb-2">
            Obrigatório: selecione ao menos um executivo da empresa escolhido acima.
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-300 p-3">
            {executivesForInviteCompany.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum executivo cadastrado nesta empresa.</p>
            ) : (
              executivesForInviteCompany.map((ex) => {
                const nid = Number(ex.id);
                return (
                  <div key={ex.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`invite-exec-${ex.id}`}
                      checked={secretaryExecutiveIds.includes(nid)}
                      onChange={() => toggleInviteExecutive(nid)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`invite-exec-${ex.id}`} className="text-sm text-slate-700 cursor-pointer">
                      {ex.fullName}
                      {ex.jobTitle ? ` — ${ex.jobTitle}` : ''}
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Enviando…' : 'Enviar convite'}
      </button>
    </form>
  );
};

export default InviteUserForm;
