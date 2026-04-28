import React, { useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import { ExecutiveProfileForm } from './ExecutiveProfileForm';
import { departmentService } from '../services/departmentService';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { fetchMe, mapApiUserToAppUser, updateMeProfile } from '../services/authService';
import { normalizeExecutivePayload } from '../utils/executivePayload';
import type { Department, Executive, Organization, User } from '../types';

const MENU_LABEL = 'Meus dados Cadastrais';

export interface ExecutiveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated?: (user: User) => void;
}

const ExecutiveProfileModal: React.FC<ExecutiveProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [accFullName, setAccFullName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accSaving, setAccSaving] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);
  const [accOk, setAccOk] = useState<string | null>(null);

  const [currentExecutive, setCurrentExecutive] = useState<Partial<Executive>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; workEmail?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    professional: true,
    profile: false,
    emergency: false,
    finance: false,
  });

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  useEffect(() => {
    if (!isOpen || currentUser.role !== 'executive' || !currentUser.executiveId) return;
    let cancelled = false;
    setLoading(true);
    setApiError(null);
    setAccError(null);
    setAccOk(null);
    void (async () => {
      try {
        const [me, ex, orgs, depts, execs] = await Promise.all([
          fetchMe(),
          executiveService.getById(currentUser.executiveId),
          organizationService.getAll(),
          departmentService.getAll(),
          executiveService.getAll(0, 2000),
        ]);
        if (cancelled) return;
        setAccFullName(me.fullName);
        setAccEmail(me.email);
        setAccPhone(me.phone != null ? String(me.phone) : '');
        setCurrentExecutive(ex);
        setOrganizations(orgs);
        setDepartments(depts);
        setExecutives(execs);
      } catch {
        if (!cancelled) setApiError('Não foi possível carregar seus dados.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser.role, currentUser.executiveId]);

  const handleSaveAccount = async () => {
    setAccError(null);
    setAccOk(null);
    if (!accFullName.trim()) {
      setAccError('Informe o nome completo.');
      return;
    }
    if (!accEmail.trim()) {
      setAccError('Informe o e-mail.');
      return;
    }
    setAccSaving(true);
    try {
      const me = await updateMeProfile({
        fullName: accFullName.trim(),
        email: accEmail.trim(),
        phone: accPhone.trim() === '' ? null : accPhone.trim(),
      });
      onUserUpdated?.(mapApiUserToAppUser(me));
      setAccOk('Dados da conta atualizados.');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setAccError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Não foi possível salvar.');
    } finally {
      setAccSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setApiError(null);
    const newErrors: { fullName?: string; workEmail?: string } = {};
    if (!currentExecutive.fullName?.trim()) newErrors.fullName = 'O nome completo é obrigatório.';
    if (!currentExecutive.workEmail?.trim()) newErrors.workEmail = 'O e-mail corporativo é obrigatório.';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    if (!currentExecutive.id) {
      setApiError('Registro de executivo inválido.');
      return;
    }
    setSaving(true);
    try {
      const payload = normalizeExecutivePayload(currentExecutive) as Partial<Executive>;
      await executiveService.update(String(currentExecutive.id), payload);
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } };
      const d = ax.response?.data?.detail;
      const msg =
        typeof d === 'string'
          ? d
          : Array.isArray(d)
            ? d.map((x) => x.msg).filter(Boolean).join(' ')
            : 'Erro ao salvar perfil.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || currentUser.role !== 'executive' || !currentUser.executiveId) {
    return null;
  }

  return (
    <Modal isOpen={true} title={MENU_LABEL} onClose={onClose} panelClassName="max-w-4xl">
      {loading ? (
        <p className="text-slate-600 text-sm py-8 text-center">Carregando…</p>
      ) : (
        <div className="flex flex-col max-h-[78vh]">
          <div className="overflow-y-auto flex-1 pr-1 space-y-6">
            <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Conta (login)</h3>
              <p className="text-xs text-slate-500">Nome, e-mail e telefone usados para entrar no sistema.</p>
              {accOk && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{accOk}</p>}
              {accError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{accError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={accFullName}
                    onChange={(e) => setAccFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">E-mail (login)</label>
                  <input
                    type="email"
                    value={accEmail}
                    onChange={(e) => setAccEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={accPhone}
                    onChange={(e) => setAccPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSaveAccount()}
                  disabled={accSaving}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {accSaving ? 'Salvando…' : 'Salvar dados da conta'}
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Cadastro profissional</h3>
              <ExecutiveProfileForm
                currentExecutive={currentExecutive}
                setCurrentExecutive={setCurrentExecutive}
                organizations={organizations}
                departments={departments}
                executives={executives}
                errors={errors}
                setErrors={setErrors}
                apiError={apiError}
                setApiError={setApiError}
                openSections={openSections}
                toggleSection={toggleSection}
                workEmailReadOnly={false}
              />
            </section>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || accSaving}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={saving || accSaving}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar cadastro profissional'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExecutiveProfileModal;
