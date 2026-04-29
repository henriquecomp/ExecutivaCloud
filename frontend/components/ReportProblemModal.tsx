import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import {
  isWeb3FormsConfigured,
  PROBLEM_REPORT_CATEGORIES,
  ProblemReportCategory,
  ProblemReportContext,
  submitProblemReport,
} from '../services/web3formsService';

export interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ProblemReportContext;
  defaultEmail?: string;
  defaultName?: string;
  /** Nome da tela atual (ex.: Painel, Agenda) quando logado */
  screenLabel?: string;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  context,
  defaultEmail = '',
  defaultName = '',
  screenLabel,
}) => {
  const [category, setCategory] = useState<ProblemReportCategory>('Bug');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail ?? '');
      setName(defaultName ?? '');
      setDescription('');
      setCategory('Bug');
      setFeedback(null);
    }
  }, [isOpen, defaultEmail, defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!email.trim() || !description.trim()) {
      setFeedback({ type: 'err', text: 'Preencha e-mail e descrição do problema.' });
      return;
    }
    if (!isWeb3FormsConfigured()) {
      setFeedback({
        type: 'err',
        text: 'Envio não configurado. Defina VITE_WEB3FORMS_ACCESS_KEY no .env do frontend e reinicie o Vite.',
      });
      return;
    }
    setSending(true);
    try {
      await submitProblemReport({
        context,
        category,
        email: email.trim(),
        name: name.trim(),
        description: description.trim(),
        screenLabel,
      });
      setFeedback({
        type: 'ok',
        text: 'Relatório enviado. Obrigado — nossa equipe receberá por e-mail.',
      });
      setDescription('');
      window.setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível enviar.';
      setFeedback({ type: 'err', text: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Reportar um problema"
      onClose={onClose}
      panelClassName="max-w-lg"
    >
      <p className="text-sm text-slate-600 mb-4">
        {context === 'login'
          ? 'Descreva o que aconteceu. Inclua mensagens de erro se aparecerem na tela.'
          : 'Seu relatório incluirá automaticamente a tela em que você está e o endereço da página.'}
      </p>
      {!isWeb3FormsConfigured() && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          Configure <code className="font-mono">VITE_WEB3FORMS_ACCESS_KEY</code> em{' '}
          <code className="font-mono">frontend/.env</code>. Veja também{' '}
          <code className="font-mono">frontend/docs/email-setup.md</code>.
        </p>
      )}
      {feedback && (
        <p
          className={`text-sm px-3 py-2 rounded-md border mb-4 ${
            feedback.type === 'ok'
              ? 'bg-green-50 text-green-900 border-green-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
          role="status"
        >
          {feedback.text}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="report-category" className="block text-sm font-medium text-slate-700 mb-1">
            Tipo
          </label>
          <select
            id="report-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProblemReportCategory)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PROBLEM_REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="report-name" className="block text-sm font-medium text-slate-700 mb-1">
            Nome (opcional)
          </label>
          <input
            id="report-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="report-email" className="block text-sm font-medium text-slate-700 mb-1">
            E-mail para contato *
          </label>
          <input
            id="report-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="report-desc" className="block text-sm font-medium text-slate-700 mb-1">
            O que aconteceu? *
          </label>
          <textarea
            id="report-desc"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-y min-h-[6rem]"
            placeholder="Passos para reproduzir, mensagem de erro, captura de tela (descreva)…"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400"
          >
            {sending ? 'Enviando…' : 'Enviar relatório'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportProblemModal;
