/** Datas no padrão pt-BR (exibição dd/mm/aaaa); API permanece YYYY-MM-DD. */
/** Horas no padrão 24h (exibição HH:mm, ex.: 23:59). */

export const DATE_BR_PLACEHOLDER = 'dd/mm/aaaa';
export const DATE_BR_MASK_MAX = 10;

export const TIME_BR_PLACEHOLDER = '23:59';
export const TIME_BR_MASK_MAX = 5;

export function maskDateBR(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Digita HH:mm (máx. 4 dígitos). */
export function maskTimeBR(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
    return false;
  }
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

export function isValidTimeHHMM(time: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec((time || '').trim());
  if (!m) return false;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
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
  const time = timePart.slice(0, 5);
  return {
    dateIso: isValidIsoDate(datePart) ? datePart : '',
    time: isValidTimeHHMM(time) ? time : timePart ? time : '',
  };
}

export function joinDatetimeLocal(dateIso: string, time: string): string {
  if (!dateIso) return '';
  const t = (time || '00:00').slice(0, 5);
  return `${dateIso}T${t}`;
}

/** True se o valor parece datetime-local sem fuso (YYYY-MM-DDTHH:mm). */
export function isDatetimeLocalValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test((value || '').trim());
}

/**
 * Interpreta `YYYY-MM-DDTHH:mm` como horário de parede no fuso local do browser.
 * Evita ambiguidade de `new Date("YYYY-MM-DDTHH:mm")` entre ambientes.
 */
export function datetimeLocalToDate(local: string): Date | null {
  const { dateIso, time } = splitDatetimeLocal(local);
  if (!dateIso || !isValidTimeHHMM(time || '00:00')) return null;
  const [y, m, d] = dateIso.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function datetimeLocalToUtcIso(local: string): string | null {
  const dt = datetimeLocalToDate(local);
  return dt ? dt.toISOString() : null;
}

/** Apresentação: YYYY-MM-DD → dd/MM/yyyy. */
export function formatDateBr(isoDate: string): string {
  const datePart = (isoDate || '').trim().slice(0, 10);
  return isoDateToBr(datePart);
}

/**
 * Apresentação de hora 24h HH:mm.
 * Aceita `HH:mm`, `YYYY-MM-DDTHH:mm` (parede local) ou ISO com fuso (converte para local).
 */
export function formatTimeBr(isoOrTime: string): string {
  const trimmed = (isoOrTime || '').trim();
  if (!trimmed) return '';
  if (isValidTimeHHMM(trimmed)) return trimmed;
  if (isDatetimeLocalValue(trimmed)) {
    const fromLocal = splitDatetimeLocal(trimmed).time;
    return isValidTimeHHMM(fromLocal) ? fromLocal : '';
  }
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return '';
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Apresentação: `dd/MM/yyyy HH:mm` a partir de ISO timestamp ou datetime-local. */
export function formatDateTimeBr(isoTimestamp: string): string {
  const trimmed = (isoTimestamp || '').trim();
  if (!trimmed) return '';
  if (isDatetimeLocalValue(trimmed)) {
    const local = splitDatetimeLocal(trimmed);
    const d = formatDateBr(local.dateIso);
    const t = isValidTimeHHMM(local.time) ? local.time : '00:00';
    return d ? `${d} ${t}` : '';
  }
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const dateBr = formatDateBr(`${y}-${mo}-${day}`);
  const timeBr = formatTimeBr(trimmed);
  return dateBr && timeBr ? `${dateBr} ${timeBr}` : dateBr || timeBr;
}
