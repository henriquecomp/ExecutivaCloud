/** Extrai mensagem amigável de erros Axios / FastAPI para exibir ao usuário. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as {
    response?: { data?: { detail?: unknown } };
    message?: string;
  };
  const d = ax.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0] as { msg?: string };
    if (typeof first?.msg === 'string') return first.msg;
  }
  if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
    return err.message;
  }
  if (typeof ax.message === 'string' && ax.message !== 'Network Error') {
    return ax.message;
  }
  return fallback;
}
