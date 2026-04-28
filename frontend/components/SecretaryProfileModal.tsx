import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { SecretaryForm } from './SecretariesView';
import { departmentService } from '../services/departmentService';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { secretaryService } from '../services/secretaryService';
import { fetchMe, mapApiUserToAppUser, updateMeProfile } from '../services/authService';
import type { Department, Executive, Organization, Secretary, User } from '../types';

const MENU_LABEL = 'Meus dados Cadastrais';

export interface SecretaryProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated?: (user: User) => void;
}

const SecretaryProfileModal: React.FC<SecretaryProfileModalProps> = ({
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

  const [secretary, setSecretary] = useState<Partial<Secretary> | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || currentUser.role !== 'secretary' || !currentUser.secretaryId) return;
    let cancelled = false;
    setError(null);
    setAccError(null);
    setAccOk(null);
    void (async () => {
      try {
        const [me, sec, orgs, depts, execs] = await Promise.all([
          fetchMe(),
          secretaryService.getOne(currentUser.secretaryId),
          organizationService.getAll(),
          departmentService.getAll(),
          executiveService.getAll(0, 2000),
        ]);
        if (cancelled) return;
        setAccFullName(me.fullName);
        setAccEmail(me.email);
        setAccPhone(me.phone != null ? String(me.phone) : '');
        setSecretary(sec);
        setOrganizations(orgs);
        setDepartments(depts);
        setExecutives(execs);
      } catch {
        if (!cancelled) setError('Não foi possível carregar seus dados.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser.role, currentUser.secretaryId]);

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

  if (!isOpen || currentUser.role !== 'secretary' || !currentUser.secretaryId) {
    return null;
  }

  return (
    <Modal isOpen={true} title={MENU_LABEL} onClose={onClose} panelClassName="max-w-4xl">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</p>}
      {!secretary ? (
        <p className="text-slate-600 text-sm py-8 text-center">Carregando…</p>
      ) : (
        <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-6">
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
            <SecretaryForm
              secretary={secretary}
              organizations={organizations}
              departments={departments}
              executives={executives}
              currentUser={currentUser}
              profileCompletion={false}
              allowSelfExecutiveSelection
              submitButtonLabel="Salvar cadastro profissional"
              onCancel={onClose}
              onSave={async (payload) => {
                try {
                  await secretaryService.update(String(secretary.id), payload as Partial<Secretary>);
                  onClose();
                } catch (e: unknown) {
                  const ax = e as { response?: { data?: { detail?: string } } };
                  setError(
                    typeof ax.response?.data?.detail === 'string'
                      ? ax.response.data.detail
                      : 'Não foi possível salvar.',
                  );
                }
              }}
            />
          </section>
        </div>
      )}
    </Modal>
  );
};

export default SecretaryProfileModal;
