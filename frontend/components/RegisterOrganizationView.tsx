import React, { useState } from 'react';
import { LogoIcon } from './Icons';
import { registerOrganization, RegisterOrganizationPayload } from '../services/authService';
import axios from 'axios';
import { validateCNPJ, validateCEP, maskCNPJ, maskCEP } from '../utils/brValidators';
import { FREE_TEXT_MAX, CNPJ_MASK_MAX, CEP_MASK_MAX, UF_MAX, EMAIL_MAX } from '../utils/fieldLimits';

interface RegisterOrganizationViewProps {
  onSuccess: (message: string) => void;
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
    legalComplement: '',
    adminName: '',
    adminEmail: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof RegisterOrganizationPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldError) setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (!form.legalCnpj?.trim() || !validateCNPJ(form.legalCnpj)) {
      setFieldError('Informe um CNPJ válido.');
      return;
    }
    if (!form.legalZipCode?.trim() || !validateCEP(form.legalZipCode)) {
      setFieldError('Informe um CEP válido (8 dígitos).');
      return;
    }
    if (
      !form.legalStreet?.trim() ||
      !form.legalNumber?.trim() ||
      !form.legalNeighborhood?.trim() ||
      !form.legalCity?.trim() ||
      !form.legalState?.trim()
    ) {
      setFieldError('Preencha o endereço completo (logradouro, número, bairro, cidade e UF).');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterOrganizationPayload = {
        ...form,
        legalCnpj: form.legalCnpj.trim(),
        legalStreet: form.legalStreet.trim(),
        legalNumber: form.legalNumber.trim(),
        legalNeighborhood: form.legalNeighborhood.trim(),
        legalCity: form.legalCity.trim(),
        legalState: form.legalState.trim().slice(0, 2).toUpperCase(),
        legalZipCode: form.legalZipCode.trim(),
        legalComplement: form.legalComplement?.trim() || undefined,
      };
      const data = await registerOrganization(payload);
      onSuccess(data.message);
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
          Crie a organização jurídica e o usuário administrador. O primeiro acesso será liberado por link enviado no e-mail informado.
        </p>
      </div>

      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || fieldError) && (
            <div className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2 border border-red-200" role="alert">
              {fieldError || error}
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">Organização jurídica</legend>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Razão social *</label>
              <input
                required
                minLength={2}
                maxLength={FREE_TEXT_MAX}
                value={form.legalName}
                onChange={(e) => update('legalName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ *</label>
                <input
                  required
                  maxLength={CNPJ_MASK_MAX}
                  value={form.legalCnpj || ''}
                  onChange={(e) => update('legalCnpj', maskCNPJ(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CEP *</label>
                <input
                  required
                  maxLength={CEP_MASK_MAX}
                  value={form.legalZipCode || ''}
                  onChange={(e) => update('legalZipCode', maskCEP(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro *</label>
                <input
                  required
                  maxLength={FREE_TEXT_MAX}
                  value={form.legalStreet || ''}
                  onChange={(e) => update('legalStreet', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Número *</label>
                <input
                  required
                  maxLength={FREE_TEXT_MAX}
                  value={form.legalNumber || ''}
                  onChange={(e) => update('legalNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
              <input
                maxLength={FREE_TEXT_MAX}
                value={form.legalComplement || ''}
                onChange={(e) => update('legalComplement', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bairro *</label>
              <input
                required
                maxLength={FREE_TEXT_MAX}
                value={form.legalNeighborhood || ''}
                onChange={(e) => update('legalNeighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cidade *</label>
                <input
                  required
                  maxLength={FREE_TEXT_MAX}
                  value={form.legalCity || ''}
                  onChange={(e) => update('legalCity', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UF *</label>
                <input
                  required
                  maxLength={UF_MAX}
                  value={form.legalState || ''}
                  onChange={(e) => update('legalState', e.target.value.toUpperCase())}
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
                maxLength={FREE_TEXT_MAX}
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
                maxLength={EMAIL_MAX}
                autoComplete="email"
                value={form.adminEmail}
                onChange={(e) => update('adminEmail', e.target.value)}
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
              {loading ? 'Cadastrando…' : 'Criar organização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterOrganizationView;
