import React, { useEffect, useState } from 'react';
import { completeInvite, fetchInviteStatus, mapApiUserToAppUser } from '../services/authService';
import type { User } from '../types';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
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
            <label htmlFor="np-pass" className="block text-sm font-medium text-slate-700 mb-1">
              Nova senha
            </label>
            <input
              id="np-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              minLength={6}
              required
            />
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
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
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
