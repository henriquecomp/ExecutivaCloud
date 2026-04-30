import { api } from './api';

export type ProblemReportContext = 'login' | 'app';
export const PROBLEM_REPORT_CATEGORIES = ['Bug', 'Acesso / login', 'Sugestão', 'Outro'] as const;
export type ProblemReportCategory = (typeof PROBLEM_REPORT_CATEGORIES)[number];

export interface ProblemReportPayload {
  context: ProblemReportContext;
  category: ProblemReportCategory;
  email: string;
  name?: string;
  description: string;
  screenLabel?: string;
  pageUrl?: string;
  userAgent?: string;
}

export async function submitProblemReport(payload: ProblemReportPayload): Promise<void> {
  await api.post('/support/problem-report', payload);
}
