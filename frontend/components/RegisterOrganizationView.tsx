import React, { useState } from 'react';
import { LogoIcon } from './Icons';
import { mapApiUserToAppUser, registerOrganization, RegisterOrganizationPayload } from '../services/authService';
import { User } from '../types';
import axios from 'axios';

interface RegisterOrganizationViewProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const RegisterOrganizationView: React.FC<RegisterOrganizationViewProps> = ({ onSuccess, onBack }) => {
  const [form, setForm] = useState<RegisterOrganizationPayload>({
    legalName: '',
    legalCnpj: '',
    legalStreet: '',
    legalNumber: '',
    legalNeighborhood: '',
    legalCity: '',
    legalState: '',
    legalZipCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof RegisterOrganizationPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: RegisterOrganizationPayload = {
        ...form,
        legalCnpj: form.legalCnpj?.trim() || undefined,
        legalStreet: form.legalStreet?.trim() || undefined,
        legalNumber: form.legalNumber?.trim() || undefined,
        legalNeighborhood: form.legalNeighborhood?.trim() || undefined,
        legalCity: form.legalCity?.trim() || undefined,
        legalState: form.legalState?.trim().slice(0, 2).toUpperCase() || undefined,
        legalZipCode: form.legalZipCode?.trim() || undefined,
      };
      const data = await registerOrganization(payload);
      onSuccess(mapApiUserToAppUser(data.user));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail != null) {
        const d = err.response.data.detail;
        const msg = Array.isArray(d)
          ? d.map((x: { msg?: string }) => x?.msg).filter(Boolean).join(' ')
          : typeof d === 'string'
            ? d
            : '';
        setError(msg || 'Não foi possível concluir o cadastro.');
      } else {
        setError('Não foi possível concluir o cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 antialiased py-10">
      <div className="text-center mb-6">
        <div className="inline-block bg-slate-800 p-3 rounded-full mb-3">
          <LogoIcon className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Cadastro de organização</h1>
        <p className="text-slate-500 mt-1 text-sm max-w-md mx-auto">
          Crie a organização jurídica e o usuário administrador da organização. O acesso ao sistema é por e-mail e senha.
        </p>
      </div>

      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">Organização jurídica</legend>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Razão social *</label>
              <input
                required
                minLength={2}
                value={form.legalName}
                onChange={(e) => update('legalName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ</label>
                <input
                  value={form.legalCnpj || ''}
                  onChange={(e) => update('legalCnpj', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                <input
                  value={form.legalZipCode || ''}
                  onChange={(e) => update('legalZipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro</label>
                <input
                  value={form.legalStreet || ''}
                  onChange={(e) => update('legalStreet', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                <input
                  value={form.legalNumber || ''}
                  onChange={(e) => update('legalNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
              <input
                value={form.legalNeighborhood || ''}
                onChange={(e) => update('legalNeighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                <input
                  value={form.legalCity || ''}
                  onChange={(e) => update('legalCity', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UF</label>
                <input
                  maxLength={2}
                  value={form.legalState || ''}
                  onChange={(e) => update('legalState', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm uppercase"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 pt-2 border-t border-slate-200">
            <legend className="text-sm font-semibold text-slate-800">Administrador da organização</legend>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
              <input
                required
                minLength={2}
                value={form.adminName}
                onChange={(e) => update('adminName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mail (login) *</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.adminEmail}
                onChange={(e) => update('adminEmail', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Senha * (mín. 6 caracteres)</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.adminPassword}
                onChange={(e) => update('adminPassword', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-2.5 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar ao login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400"
            >
              {loading ? 'Cadastrando…' : 'Criar organização e entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterOrganizationView;
