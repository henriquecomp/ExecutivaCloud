import React from 'react';
import AppLabel from './AppLabel';
import TypeColorSwatch, { normalizeHex } from './TypeColorSwatch';

export interface TypeColorFormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
  defaultColor?: string;
}

/**
 * Seletor de cor + círculo de pré-visualização (sem campo de texto para hex).
 */
const TypeColorFormField: React.FC<TypeColorFormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  defaultColor = '#64748b',
}) => {
  const safe = normalizeHex(value || defaultColor);
  return (
    <div>
      <AppLabel htmlFor={id}>{label}</AppLabel>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="color"
          id={id}
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-1"
        />
        <TypeColorSwatch color={safe} size="lg" title="Pré-visualização da cor" />
      </div>
    </div>
  );
};

export default TypeColorFormField;
