import React, { useEffect, useState } from 'react';
import {
  DATE_BR_MASK_MAX,
  DATE_BR_PLACEHOLDER,
  brDateToIso,
  isoDateToBr,
  maskDateBR,
} from '../../utils/brDate';

export interface AppDateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Valor canônico YYYY-MM-DD (API) ou ''. */
  value: string;
  /** Emite YYYY-MM-DD ou '' (vazio limpo). */
  onChange: (isoDate: string) => void;
  /** min/max em YYYY-MM-DD (opcional). */
  min?: string;
  max?: string;
}

/**
 * Campo de data com máscara fixa pt-BR (dd/mm/aaaa), independente do locale do navegador.
 * O valor controlado continua em YYYY-MM-DD para o restante da app/API.
 */
const AppDateInput: React.FC<AppDateInputProps> = ({
  value,
  onChange,
  min,
  max,
  className = '',
  onBlur,
  placeholder = DATE_BR_PLACEHOLDER,
  ...props
}) => {
  const [display, setDisplay] = useState(() => isoDateToBr(value || ''));
  const [localError, setLocalError] = useState(false);

  useEffect(() => {
    setDisplay(isoDateToBr(value || ''));
    setLocalError(false);
  }, [value]);

  const commit = (masked: string) => {
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 0) {
      setLocalError(false);
      if (value !== '') onChange('');
      return;
    }
    if (digits.length < 8) {
      setLocalError(true);
      return;
    }
    const iso = brDateToIso(masked);
    if (!iso) {
      setLocalError(true);
      return;
    }
    if (min && iso < min) {
      setLocalError(true);
      return;
    }
    if (max && iso > max) {
      setLocalError(true);
      return;
    }
    setLocalError(false);
    if (iso !== value) onChange(iso);
    setDisplay(isoDateToBr(iso));
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      lang="pt-BR"
      maxLength={DATE_BR_MASK_MAX}
      placeholder={placeholder}
      value={display}
      aria-invalid={localError || props['aria-invalid'] ? true : undefined}
      className={`${className}${localError ? ' border-red-500' : ''}`.trim()}
      onChange={(e) => {
        const next = maskDateBR(e.target.value);
        setDisplay(next);
        setLocalError(false);
        const digits = next.replace(/\D/g, '');
        if (digits.length === 8) {
          const iso = brDateToIso(next);
          if (iso && (!min || iso >= min) && (!max || iso <= max)) {
            if (iso !== value) onChange(iso);
          }
        } else if (digits.length === 0 && value !== '') {
          onChange('');
        }
      }}
      onBlur={(e) => {
        commit(display);
        onBlur?.(e);
      }}
    />
  );
};

export default AppDateInput;
