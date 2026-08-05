/** Datas no padrão pt-BR (exibição dd/mm/aaaa); API permanece YYYY-MM-DD. */

export const DATE_BR_PLACEHOLDER = 'dd/mm/aaaa';
export const DATE_BR_MASK_MAX = 10;

export function maskDateBR(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
    return false;
  }
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

/** YYYY-MM-DD → dd/mm/aaaa (vazio se inválido). */
export function isoDateToBr(iso: string): string {
  const trimmed = (iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return '';
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isValidCalendarDate(year, month, day)) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/mm/aaaa → YYYY-MM-DD ou null se incompleto/inválido. */
export function brDateToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((br || '').trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isValidIsoDate(iso: string): boolean {
  const br = isoDateToBr(iso);
  return br !== '' && brDateToIso(br) === iso.trim();
}

/** Partes de `YYYY-MM-DDTHH:mm` (datetime-local). */
export function splitDatetimeLocal(value: string): { dateIso: string; time: string } {
  const trimmed = (value || '').trim();
  if (!trimmed) return { dateIso: '', time: '' };
  const [datePart, timePart = ''] = trimmed.split('T');
  return {
    dateIso: isValidIsoDate(datePart) ? datePart : '',
    time: timePart.slice(0, 5),
  };
}

export function joinDatetimeLocal(dateIso: string, time: string): string {
  if (!dateIso) return '';
  const t = (time || '00:00').slice(0, 5);
  return `${dateIso}T${t}`;
}
