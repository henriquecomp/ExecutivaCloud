import React, { useState } from 'react';
import { LogoIcon } from './Icons';
import { loginRequest, mapApiUserToAppUser } from '../services/authService';
import { User } from '../types';
import axios from 'axios';

interface LoginViewProps {
  onSuccess: (user: User) => void;
  onGoRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <h1 className="text-4xl font-bold text-slate-800">Bem-vindo à Executiva Cloud</h1>
        <p className="text-slate-500 mt-2 text-lg">Entre com seu e-mail e senha.</p>
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
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
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
      </div>
    </div>
  );
};

export default LoginView;
