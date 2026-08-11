/** Valores de data/hora de parede (fuso do browser), sem conversão UTC. */

import {
  isDatetimeLocalValue,
  isNaiveIsoDatetime,
  isValidTimeHHMM,
  splitDatetimeLocal,
} from './brDate';

export function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayDateInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Form `YYYY-MM-DDTHH:mm` → API naive `YYYY-MM-DDTHH:mm:00` (sem Z). */
export function datetimeLocalToApi(local: string): string | null {
  const { dateIso, time } = splitDatetimeLocal(local);
  if (!dateIso || !isValidTimeHHMM(time)) return null;
  return `${dateIso}T${time}:00`;
}

/** Date local → API naive `YYYY-MM-DDTHH:mm:00`. */
export function dateToApiNaive(d: Date): string {
  return `${toDatetimeLocalInputValue(d)}:00`;
}

/**
 * Valor da API → form `YYYY-MM-DDTHH:mm`.
 * Naive (sem fuso) = horário de parede; com Z/offset = converte para local.
 */
export function apiDateTimeToDatetimeLocal(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (isDatetimeLocalValue(trimmed)) return trimmed;
  if (isNaiveIsoDatetime(trimmed)) {
    const [datePart, timePart = ''] = trimmed.split('T');
    const time = timePart.slice(0, 5);
    return isValidTimeHHMM(time) ? `${datePart.slice(0, 10)}T${time}` : '';
  }
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return '';
  return toDatetimeLocalInputValue(dt);
}
