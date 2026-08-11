import type { Event } from '../types';

export interface ActiveReminder {
  event: Event;
  startMs: number;
  reminderAtMs: number;
  /** Minutos restantes até o início (>= 0). */
  minutesUntilStart: number;
}

function parseEventStartMs(startTime: string): number {
  const ms = new Date(startTime).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * Lembretes na janela ativa: now >= (start − reminderMinutes) e now < start.
 */
export function getActiveReminders(events: Event[], now: Date = new Date()): ActiveReminder[] {
  const nowMs = now.getTime();
  const out: ActiveReminder[] = [];
  for (const event of events) {
    const minutes = event.reminderMinutes;
    if (minutes == null || minutes <= 0 || !event.startTime) continue;
    const startMs = parseEventStartMs(event.startTime);
    if (!Number.isFinite(startMs)) continue;
    const reminderAtMs = startMs - minutes * 60 * 1000;
    if (nowMs >= reminderAtMs && nowMs < startMs) {
      out.push({
        event,
        startMs,
        reminderAtMs,
        minutesUntilStart: Math.max(0, Math.ceil((startMs - nowMs) / 60000)),
      });
    }
  }
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}

export function formatMinutesUntilLabel(minutesUntilStart: number): string {
  if (minutesUntilStart <= 0) return 'começando agora';
  if (minutesUntilStart === 1) return 'em 1 min';
  if (minutesUntilStart < 60) return `em ${minutesUntilStart} min`;
  const hours = Math.floor(minutesUntilStart / 60);
  const mins = minutesUntilStart % 60;
  if (mins === 0) return hours === 1 ? 'em 1 hora' : `em ${hours} horas`;
  return `em ${hours}h ${mins}min`;
}
