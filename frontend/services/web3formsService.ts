import axios from 'axios';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export function isWeb3FormsConfigured(): boolean {
  const key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export type ProblemReportContext = 'login' | 'app';

export const PROBLEM_REPORT_CATEGORIES = ['Bug', 'Acesso / login', 'Sugestão', 'Outro'] as const;
export type ProblemReportCategory = (typeof PROBLEM_REPORT_CATEGORIES)[number];

export interface SubmitProblemReportParams {
  context: ProblemReportContext;
  category: ProblemReportCategory | string;
  email: string;
  name: string;
  description: string;
  /** Nome amigável da tela (apenas quando context === 'app') */
  screenLabel?: string;
}

function buildReportMessage(params: SubmitProblemReportParams): string {
  const lines: string[] = [
    `Categoria: ${params.category}`,
    params.context === 'app' && params.screenLabel?.trim()
      ? `Tela / módulo: ${params.screenLabel.trim()}`
      : params.context === 'login'
        ? 'Origem: Tela de login (usuário não autenticado)'
        : null,
    typeof window !== 'undefined' ? `URL: ${window.location.href}` : '',
    typeof navigator !== 'undefined' ? `Navegador: ${navigator.userAgent}` : '',
    '---',
    params.description.trim(),
  ];
  return lines.filter(Boolean).join('\n');
}

/**
 * Envia relatório de problema via Web3Forms (e-mail na caixa configurada na Access Key).
 */
export async function submitProblemReport(params: SubmitProblemReportParams): Promise<void> {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey || !String(accessKey).trim()) {
    throw new Error(
      'Chave Web3Forms não configurada. Adicione VITE_WEB3FORMS_ACCESS_KEY ao arquivo .env do frontend.',
    );
  }

  const subjectSuffix =
    params.context === 'login' ? 'Login' : params.screenLabel?.trim() || 'App';
  const subject = `[Executiva Cloud] Report — ${subjectSuffix} — ${params.category}`;

  const { data } = await axios.post<{ success: boolean; message?: string }>(
    WEB3FORMS_URL,
    {
      access_key: accessKey.trim(),
      subject,
      name: params.name.trim() || params.email.trim(),
      email: params.email.trim(),
      message: buildReportMessage(params),
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível enviar o relatório.');
  }
}
