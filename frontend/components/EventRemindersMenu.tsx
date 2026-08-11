import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, Executive } from '../types';
import { BellIcon } from './Icons';
import { formatDateTimeBr } from '../utils/brDate';
import {
  formatMinutesUntilLabel,
  getActiveReminders,
  type ActiveReminder,
} from '../utils/eventReminders';

export interface EventRemindersMenuProps {
  events: Event[];
  executives: Executive[];
  dismissedIds: Set<string>;
  onDismiss: (eventId: string) => void;
  onDismissAll: () => void;
  onOpenEvent: (event: Event) => void;
  /** Tick to recompute active window without remounting. */
  nowMs: number;
}

const EventRemindersMenu: React.FC<EventRemindersMenuProps> = ({
  events,
  executives,
  dismissedIds,
  onDismiss,
  onDismissAll,
  onOpenEvent,
  nowMs,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => {
    void nowMs;
    return getActiveReminders(events, new Date(nowMs)).filter(
      (r) => !dismissedIds.has(r.event.id),
    );
  }, [events, dismissedIds, nowMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (active.length === 0) return null;

  const badge = active.length > 9 ? '9+' : String(active.length);

  const executiveName = (r: ActiveReminder) =>
    executives.find((e) => e.id === r.event.executiveId)?.fullName;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 transition-colors"
        title="Lembretes de agenda"
        aria-label={`Lembretes de agenda, ${active.length} pendente${active.length > 1 ? 's' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-5 w-5 text-indigo-600" />
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200/50 z-30 origin-top-right overflow-hidden"
          style={{ animation: 'scale-in-up 0.2s ease-out' }}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/80">
            <h3 className="text-sm font-semibold text-slate-800">Lembretes</h3>
            <button
              type="button"
              onClick={() => {
                onDismissAll();
                setIsOpen(false);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Marcar como visto
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {active.map((r) => (
              <li key={r.event.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition"
                  onClick={() => {
                    onDismiss(r.event.id);
                    onOpenEvent(r.event);
                    setIsOpen(false);
                  }}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{r.event.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTimeBr(r.event.startTime)} · {formatMinutesUntilLabel(r.minutesUntilStart)}
                  </p>
                  {executiveName(r) && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{executiveName(r)}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <style>{`
            @keyframes scale-in-up {
              from { opacity: 0; transform: scale(0.95) translateY(-8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default EventRemindersMenu;
