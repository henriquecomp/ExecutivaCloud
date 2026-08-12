/** Extrai mensagem amigável de erros Axios / FastAPI para exibir ao usuário. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as {
    response?: { data?: { detail?: unknown }; status?: number };
    message?: string;
  };
  const d = ax.response?.data?.detail;
  if (typeof d === 'string' && d.trim()) return d;
  if (Array.isArray(d) && d.length > 0) {
    const parts = d
      .map((item) => {
        const row = item as { loc?: unknown[]; msg?: string };
        if (typeof row?.msg !== 'string' || !row.msg.trim()) return null;
        const loc = Array.isArray(row.loc)
          ? row.loc.filter((x) => x !== 'body' && typeof x === 'string').join('.')
          : '';
        return loc ? `${loc}: ${row.msg}` : row.msg;
      })
      .filter((x): x is string => Boolean(x));
    if (parts.length > 0) return parts.join(' ');
  }
  if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
    // Axios costuma colocar "Request failed with status code 500" — preferir fallback amigável.
    if (/^request failed with status code/i.test(err.message)) {
      return fallback;
    }
    return err.message;
  }
  if (typeof ax.message === 'string' && ax.message !== 'Network Error') {
    if (/^request failed with status code/i.test(ax.message)) {
      return fallback;
    }
    return ax.message;
  }
  return fallback;
}

/** True quando a API indica CPF duplicado (mensagem pt-BR conhecida). */
export function isDuplicateCpfError(err: unknown): boolean {
  const msg = getApiErrorMessage(err, '').toLowerCase();
  return msg.includes('cpf já cadastrado');
}
