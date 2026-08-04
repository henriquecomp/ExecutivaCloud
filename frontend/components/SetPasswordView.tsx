import React, { useEffect, useRef, useState } from 'react';
import { completeInvite, fetchInviteStatus, mapApiUserToAppUser } from '../services/authService';
import type { User } from '../types';
import {
  getPasswordPolicyError,
  getPasswordStrength,
  PASSWORD_HELP_ITEMS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_STRENGTH_BAR_CLASS,
  PASSWORD_STRENGTH_LABEL,
  PASSWORD_STRENGTH_WIDTH,
} from '../utils/passwordPolicy';

interface SetPasswordViewProps {
  token: string;
  onSuccess: (user: User) => void;
}

const SetPasswordView: React.FC<SetPasswordViewProps> = ({ token, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [checking, setChecking] = useState(true);
  const [linkOk, setLinkOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  const passwordStrength = getPasswordStrength(password);
  const policyError = password ? getPasswordPolicyError(password) : null;
  const passwordsMatch = password === passwordConfirm;
  const canSubmit =
    !submitting &&
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    !policyError &&
    passwordsMatch;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { valid } = await fetchInviteStatus(token);
        if (!cancelled) {
          setLinkOk(valid);
          if (!valid) setError('Este link é inválido ou já foi utilizado.');
        }
      } catch {
        if (!cancelled) {
          setLinkOk(false);
          setError('Não foi possível validar o link.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!helpOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = getPasswordPolicyError(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!passwordsMatch) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await completeInvite(token, password, passwordConfirm);
      window.history.replaceState({}, '', window.location.pathname || '/');
      onSuccess(mapApiUserToAppUser(data.user));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Não foi possível definir a senha.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Validando link…
      </div>
    );
  }

  if (!linkOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600">{error || 'Link inválido.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800">Definir senha</h1>
        <p className="text-slate-500 mt-2 text-sm">Crie uma senha para acessar o Executiva Cloud.</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="np-pass" className="block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <div className="relative" ref={helpRef}>
                <button
                  type="button"
                  aria-label="Ajuda sobre como formar a senha"
                  aria-expanded={helpOpen}
                  onClick={() => setHelpOpen((open) => !open)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  ?
                </button>
                {helpOpen && (
                  <div
                    role="tooltip"
                    className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-lg"
                  >
                    <p className="font-medium text-slate-800 mb-2">Como formar sua senha</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {PASSWORD_HELP_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <input
              id="np-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
            {password && passwordStrength !== 'empty' && (
              <div className="mt-2" aria-live="polite">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${PASSWORD_STRENGTH_BAR_CLASS[passwordStrength]} ${PASSWORD_STRENGTH_WIDTH[passwordStrength]}`}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600">{PASSWORD_STRENGTH_LABEL[passwordStrength]}</p>
              </div>
            )}
            {policyError && password && <p className="mt-1 text-xs text-red-600">{policyError}</p>}
          </div>
          <div>
            <label htmlFor="np-pass2" className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar senha
            </label>
            <input
              id="np-pass2"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
            {passwordConfirm && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">As senhas não coincidem.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordView;
