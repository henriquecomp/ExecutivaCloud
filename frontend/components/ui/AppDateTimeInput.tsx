import React from 'react';
import { joinDatetimeLocal, splitDatetimeLocal } from '../../utils/brDate';
import AppDateInput from './AppDateInput';
import AppTimeInput from './AppTimeInput';

export interface AppDateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Valor canônico datetime-local: YYYY-MM-DDTHH:mm ou ''. */
  value: string;
  onChange: (datetimeLocal: string) => void;
  /** min em YYYY-MM-DDTHH:mm (opcional; só a parte da data é aplicada no date). */
  min?: string;
}

/**
 * Data + hora com máscaras pt-BR: data dd/mm/aaaa e hora 24h HH:mm (ex.: 23:59).
 * Substitui `datetime-local` / `type="time"` para não herdar locale do navegador.
 */
const AppDateTimeInput: React.FC<AppDateTimeInputProps> = ({
  value,
  onChange,
  min,
  className = '',
  disabled,
  required,
  id,
  onFocus,
  ..._rest
}) => {
  void _rest;
  const { dateIso, time } = splitDatetimeLocal(value);
  const minDate = min ? splitDatetimeLocal(min).dateIso : undefined;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <AppDateInput
        id={id}
        value={dateIso}
        min={minDate}
        disabled={disabled}
        required={required}
        className="mt-0 min-w-[9.5rem] flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        onChange={(nextDate) => {
          if (!nextDate) {
            onChange('');
            return;
          }
          onChange(joinDatetimeLocal(nextDate, time || '00:00'));
        }}
        onFocus={onFocus}
      />
      <AppTimeInput
        disabled={disabled}
        required={required && !!dateIso}
        value={time}
        aria-label="Hora"
        className="w-[5.5rem] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        onChange={(nextTime) => {
          if (!dateIso) {
            onChange('');
            return;
          }
          onChange(joinDatetimeLocal(dateIso, nextTime || '00:00'));
        }}
        onFocus={onFocus}
      />
    </div>
  );
};

export default AppDateTimeInput;
