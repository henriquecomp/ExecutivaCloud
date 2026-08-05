import React from 'react';
import { joinDatetimeLocal, splitDatetimeLocal } from '../../utils/brDate';
import AppDateInput from './AppDateInput';

export interface AppDateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Valor canônico datetime-local: YYYY-MM-DDTHH:mm ou ''. */
  value: string;
  onChange: (datetimeLocal: string) => void;
  /** min em YYYY-MM-DDTHH:mm (opcional; só a parte da data é aplicada no date). */
  min?: string;
}

/**
 * Data + hora com data em máscara pt-BR (dd/mm/aaaa) e hora nativa `type="time"`.
 * Substitui `datetime-local` para não herdar mm/dd/yyyy do locale do navegador.
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
      <input
        type="time"
        lang="pt-BR"
        disabled={disabled}
        required={required && !!dateIso}
        value={time}
        aria-label="Hora"
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        onChange={(e) => {
          const nextTime = e.target.value;
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
