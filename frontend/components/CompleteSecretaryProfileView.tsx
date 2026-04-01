import React, { useEffect, useState } from 'react';
import { completeSecretaryProfile, mapApiUserToAppUser } from '../services/authService';
import { departmentService } from '../services/departmentService';
import { executiveService } from '../services/executiveService';
import { organizationService } from '../services/organizationService';
import { secretaryService } from '../services/secretaryService';
import { SecretaryForm } from './SecretariesView';
import type { Department, Executive, Organization, Secretary, User } from '../types';

interface CompleteSecretaryProfileViewProps {
  currentUser: User;
  onDone: (user: User) => void;
}

const CompleteSecretaryProfileView: React.FC<CompleteSecretaryProfileViewProps> = ({
  currentUser,
  onDone,
}) => {
  const [secretary, setSecretary] = useState<Partial<Secretary> | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser.secretaryId) return;
      try {
        const [sec, orgs, depts, execs] = await Promise.all([
          secretaryService.getOne(currentUser.secretaryId),
          organizationService.getAll(),
          departmentService.getAll(),
          executiveService.getAll(0, 2000),
        ]);
        if (!cancelled) {
          setSecretary(sec);
          setOrganizations(orgs);
          setDepartments(depts);
          setExecutives(execs);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Não foi possível carregar seus dados.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.secretaryId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!secretary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Carregando seu perfil…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Complete seu cadastro</h1>
        <p className="text-slate-500 text-sm mb-6">
          Preencha seus dados e selecione ao menos um executivo vinculado.
        </p>
        <SecretaryForm
          secretary={secretary}
          organizations={organizations}
          departments={departments}
          executives={executives}
          currentUser={currentUser}
          profileCompletion
          onCancel={() => {}}
          onSave={async (payload) => {
            const apiUser = await completeSecretaryProfile(payload as unknown as Record<string, unknown>);
            onDone(mapApiUserToAppUser(apiUser));
          }}
        />
      </div>
    </div>
  );
};

export default CompleteSecretaryProfileView;
