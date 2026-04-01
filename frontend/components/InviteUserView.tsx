import React, { useMemo, useState } from 'react';
import { inviteUser } from '../services/authService';
import type { Organization, User } from '../types';

export interface InviteUserViewProps {
  currentUser: User;
  organizations: Organization[];
}

const InviteUserView: React.FC<InviteUserViewProps> = ({ currentUser, organizations }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [invitedRole, setInvitedRole] = useState<'admin_company' | 'executive' | 'secretary'>('executive');
  const [organizationId, setOrganizationId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectableOrgs = useMemo(() => {
    if (currentUser.role === 'master') return organizations;
    if (currentUser.role === 'admin' && currentUser.legalOrganizationId) {
      return organizations.filter((o) => o.legalOrganizationId === currentUser.legalOrganizationId);
    }
    if (currentUser.role === 'admin' && currentUser.organizationId) {
      return organizations.filter((o) => o.id === currentUser.organizationId);
    }
    return [];
  }, [currentUser, organizations]);

  React.useEffect(() => {
    if (selectableOrgs.length === 1 && !organizationId) {
      setOrganizationId(selectableOrgs[0].id);
    }
  }, [selectableOrgs, organizationId]);

  const singleCompanyAdmin =
    currentUser.role === 'admin' && !!currentUser.organizationId && !currentUser.legalOrganizationId;
  const orgRequired =
    invitedRole === 'admin_company' || invitedRole === 'executive' || invitedRole === 'secretary';
  const needsOrgPicker = !singleCompanyAdmin && orgRequired;

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
    if (currentUser.role === 'admin' && currentUser.organizationId && !currentUser.legalOrganizationId) {
      org = currentUser.organizationId;
    }
    if (orgRequired && !org) {
      setError('Selecione a empresa.');
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
      });
      setMessage(res.message);
      setFullName('');
      setEmail('');
      setEmailConfirm('');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Falha ao enviar convite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Convidar usuário</h2>
        <p className="text-slate-500 mt-1 text-sm">
          O convidado receberá um e-mail para definir a senha. Executivos e secretárias completam o perfil no primeiro acesso.
        </p>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
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
        {needsOrgPicker && (
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
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar convite'}
        </button>
      </form>
    </div>
  );
};

export default InviteUserView;
