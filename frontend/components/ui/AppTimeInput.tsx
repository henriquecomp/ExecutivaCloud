import React, { useEffect, useState } from 'react';
import {
  TIME_BR_MASK_MAX,
  TIME_BR_PLACEHOLDER,
  isValidTimeHHMM,
  maskTimeBR,
} from '../../utils/brDate';

export interface AppTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Valor canônico HH:mm ou ''. */
  value: string;
  /** Emite HH:mm ou '' (vazio limpo). */
  onChange: (time: string) => void;
}

/**
 * Campo de hora com máscara fixa 24h (HH:mm), independente do locale do navegador.
 */
const AppTimeInput: React.FC<AppTimeInputProps> = ({
  value,
  onChange,
  className = '',
  onBlur,
  placeholder = TIME_BR_PLACEHOLDER,
  ...props
}) => {
  const [display, setDisplay] = useState(() => (isValidTimeHHMM(value || '') ? value : ''));
  const [localError, setLocalError] = useState(false);

  useEffect(() => {
    setDisplay(isValidTimeHHMM(value || '') ? value : '');
    setLocalError(false);
  }, [value]);

  const commit = (masked: string) => {
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 0) {
      setLocalError(false);
      if (value !== '') onChange('');
      return;
    }
    if (digits.length < 4 || !isValidTimeHHMM(masked)) {
      setLocalError(true);
      return;
    }
    setLocalError(false);
    if (masked !== value) onChange(masked);
    setDisplay(masked);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      lang="pt-BR"
      maxLength={TIME_BR_MASK_MAX}
      placeholder={placeholder}
      value={display}
      aria-invalid={localError || props['aria-invalid'] ? true : undefined}
      className={`${className}${localError ? ' border-red-500' : ''}`.trim()}
      onChange={(e) => {
        const next = maskTimeBR(e.target.value);
        setDisplay(next);
        setLocalError(false);
        const digits = next.replace(/\D/g, '');
        if (digits.length === 4 && isValidTimeHHMM(next)) {
          if (next !== value) onChange(next);
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

export default AppTimeInput;
