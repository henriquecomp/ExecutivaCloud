import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import {
  PROBLEM_REPORT_CATEGORIES,
  ProblemReportCategory,
  ProblemReportContext,
  submitProblemReport,
} from '../services/problemReportService';
import { PaperAirplaneIcon } from './Icons';
import { getApiErrorMessage } from '../utils/apiError';

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
    setSending(true);
    try {
      await submitProblemReport({
        context,
        category,
        email: email.trim(),
        name: name.trim(),
        description: description.trim(),
        screenLabel,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
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
      const msg = getApiErrorMessage(err, 'Não foi possível enviar o relatório.');
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
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-400"
            title={sending ? 'Enviando relatório…' : 'Enviar relatório'}
            aria-label={sending ? 'Enviando relatório' : 'Enviar relatório'}
          >
            <PaperAirplaneIcon className={`${sending ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportProblemModal;
