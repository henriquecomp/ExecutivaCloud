import React, { useCallback, useEffect, useState } from 'react';
import { completeExecutiveProfile, mapApiUserToAppUser } from '../services/authService';
import { departmentService } from '../services/departmentService';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { normalizeExecutivePayload } from '../utils/executivePayload';
import {
  composeBankInfo,
  validateExecutiveProfileCompletion,
  type ExecutiveProfileFieldErrors,
} from '../utils/executiveProfileValidation';
import { ExecutiveProfileForm } from './ExecutiveProfileForm';
import type { Department, Executive, Organization, User } from '../types';

interface CompleteExecutiveProfileViewProps {
  currentUser: User;
  onDone: (user: User) => void;
}

const CompleteExecutiveProfileView: React.FC<CompleteExecutiveProfileViewProps> = ({
  currentUser,
  onDone,
}) => {
  const [currentExecutive, setCurrentExecutive] = useState<Partial<Executive>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ExecutiveProfileFieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState('');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    contact: true,
    professional: true,
    profile: false,
    emergency: false,
    finance: true,
  });

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser.executiveId) {
        setLoading(false);
        return;
      }
      try {
        const ex = await executiveService.getById(currentUser.executiveId);
        if (cancelled) return;
        const resolvedOrgId = currentUser.organizationId ?? ex.organizationId;
        const [orgList, depts, execs] = await Promise.all([
          resolvedOrgId
            ? organizationService.getOne(resolvedOrgId).then((o) => [o])
            : organizationService.getAll(),
          resolvedOrgId ? departmentService.getByOrg(resolvedOrgId) : departmentService.getAll(),
          executiveService.getAll(0, 2000),
        ]);
        if (!cancelled) {
          setCurrentExecutive({
            ...ex,
            workEmail: currentUser.email,
            organizationId: ex.organizationId ?? resolvedOrgId,
          });
          setOrganizations(orgList);
          setDepartments(depts);
          setExecutives(execs);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setApiError('Não foi possível carregar seus dados.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.executiveId, currentUser.email, currentUser.organizationId]);

  const handleSave = async () => {
    setApiError(null);
    const validation = validateExecutiveProfileCompletion(currentExecutive, {
      code: bankCode,
      agency: bankAgency,
      account: bankAccount,
    });
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const payload = normalizeExecutivePayload({
        ...currentExecutive,
        workEmail: currentUser.email,
        bankInfo: composeBankInfo(bankCode, bankAgency, bankAccount),
        compensationInfo: undefined,
        systemAccessLevels: undefined,
      });
      const apiUser = await completeExecutiveProfile(payload);
      onDone(mapApiUserToAppUser(apiUser));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Carregando seu perfil…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">Complete seu cadastro</h1>
          <p className="text-slate-500 text-sm mt-1">
            Preencha os dados abaixo para concluir seu perfil. O e-mail de login é o seu e-mail corporativo.
          </p>
        </div>
        <div className="p-6 flex flex-col max-h-[85vh]">
          <ExecutiveProfileForm
            currentExecutive={currentExecutive}
            setCurrentExecutive={setCurrentExecutive}
            organizations={organizations}
            departments={departments}
            executives={executives}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            apiError={apiError}
            setApiError={setApiError}
            openSections={openSections}
            toggleSection={toggleSection}
            profileCompletion
            loginEmail={currentUser.email}
            lockHrFields
            bankCode={bankCode}
            bankAgency={bankAgency}
            bankAccount={bankAccount}
            onBankCodeChange={setBankCode}
            onBankAgencyChange={setBankAgency}
            onBankAccountChange={setBankAccount}
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Concluir cadastro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteExecutiveProfileView;
