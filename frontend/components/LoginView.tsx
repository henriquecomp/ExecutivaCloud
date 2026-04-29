import React, { useState } from 'react';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon, LogoIcon } from './Icons';
import { loginRequest, mapApiUserToAppUser } from '../services/authService';
import { isWeb3FormsConfigured, submitLoginContactForm } from '../services/web3formsService';
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

  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);
    if (!contactEmail.trim() || !contactMessage.trim()) {
      setContactFeedback({ type: 'err', text: 'Preencha e-mail e mensagem.' });
      return;
    }
    if (!isWeb3FormsConfigured()) {
      setContactFeedback({
        type: 'err',
        text: 'Envio por e-mail não configurado. Defina VITE_WEB3FORMS_ACCESS_KEY no .env e reinicie o Vite.',
      });
      return;
    }
    setContactSending(true);
    try {
      await submitLoginContactForm({
        fromEmail: contactEmail.trim(),
        fromName: contactName.trim(),
        message: contactMessage.trim(),
      });
      setContactFeedback({ type: 'ok', text: 'Mensagem enviada. Verifique sua caixa de entrada em breve.' });
      setContactMessage('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível enviar.';
      setContactFeedback({ type: 'err', text: msg });
    } finally {
      setContactSending(false);
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
            onClick={() => {
              setContactFeedback(null);
              const next = !contactOpen;
              setContactOpen(next);
              if (next && email.trim()) {
                setContactEmail(email.trim());
              }
            }}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 w-full text-center"
          >
            {contactOpen ? 'Fechar contato' : 'Enviar mensagem à equipe'}
          </button>
          {contactOpen && (
            <form onSubmit={handleContactSubmit} className="mt-4 space-y-3">
              {!isWeb3FormsConfigured() && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-2">
                  Configure <code className="font-mono text-xs">VITE_WEB3FORMS_ACCESS_KEY</code> no{' '}
                  <code className="font-mono text-xs">frontend/.env</code> para habilitar o envio por e-mail.
                </p>
              )}
              {contactFeedback && (
                <p
                  className={`text-sm px-2 py-2 rounded-md border ${
                    contactFeedback.type === 'ok'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                  role="status"
                >
                  {contactFeedback.text}
                </p>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-slate-600 mb-1">
                  Nome (opcional)
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-slate-600 mb-1">
                  Seu e-mail *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-slate-600 mb-1">
                  Mensagem *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-y min-h-[5rem]"
                  placeholder="Descreva sua dúvida ou solicitação…"
                />
              </div>
              <button
                type="submit"
                disabled={contactSending}
                className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
              >
                {contactSending ? 'Enviando…' : 'Enviar mensagem'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
