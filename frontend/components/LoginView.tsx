import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, LogoIcon } from './Icons';
import ReportProblemModal from './ReportProblemModal';
import { loginRequest, mapApiUserToAppUser } from '../services/authService';
import { User } from '../types';

interface LoginViewProps {
  onSuccess: (user: User) => void;
  onGoRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginRequest(email.trim(), password);
      onSuccess(mapApiUserToAppUser(data.user));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail != null) {
        const d = err.response.data.detail;
        const msg = Array.isArray(d)
          ? d.map((x: { msg?: string }) => x?.msg).filter(Boolean).join(' ')
          : typeof d === 'string'
            ? d
            : '';
        setError(msg || 'Não foi possível entrar. Verifique os dados.');
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 antialiased">
      <div className="text-center">
        <div className="inline-block bg-slate-800 p-4 rounded-full mb-4">
          <LogoIcon className="w-24 h-24 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800">Executiva Cloud</h1>
      </div>

      <div className="w-full max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2 border border-red-200" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={revealPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-11 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center justify-center px-2.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-r-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Passe o mouse ou foque aqui para exibir a senha"
                aria-label="Manter o ponteiro ou o foco sobre este botão para exibir a senha"
                onMouseEnter={() => setRevealPassword(true)}
                onMouseLeave={() => setRevealPassword(false)}
                onFocus={() => setRevealPassword(true)}
                onBlur={() => setRevealPassword(false)}
                onTouchStart={() => setRevealPassword(true)}
                onTouchEnd={() => setRevealPassword(false)}
              >
                {revealPassword ? <EyeSlashIcon className="text-indigo-600" /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Entrando…' : 'Entrar no sistema'}
          </button>
          <p className="text-center text-sm text-slate-600">
            Primeira vez?{' '}
            <button
              type="button"
              onClick={onGoRegister}
              className="text-indigo-600 font-medium hover:text-indigo-800"
            >
              Cadastrar organização e administrador
            </button>
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="w-full inline-flex items-center justify-center rounded-lg border-2 border-amber-200 bg-amber-50/80 p-2 text-amber-950 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-colors"
            title="Reportar um problema"
            aria-label="Reportar um problema"
          >
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-700" />
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Erro ao entrar ou algo estranho nesta página? Envie um relatório à equipe.
          </p>
        </div>
      </div>

      <ReportProblemModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        context="login"
        defaultEmail={email.trim() || undefined}
      />
    </div>
  );
};

export default LoginView;
