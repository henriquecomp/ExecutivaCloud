import React from 'react';

const FALLBACK = '#64748b';

function normalizeHex(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return FALLBACK;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return FALLBACK;
}

export interface TypeColorSwatchProps {
  color?: string | null;
  /** Lista compacta (padrão) ou pré-visualização ao lado do seletor */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

const sizeClass: Record<NonNullable<TypeColorSwatchProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-9 w-9',
};

/**
 * Círculo de cor para listas e formulários de tipos (sem exibir hexadecimal).
 */
const TypeColorSwatch: React.FC<TypeColorSwatchProps> = ({
  color,
  size = 'md',
  className = '',
  title,
}) => {
  const bg = normalizeHex(color);
  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-slate-200/90 shadow-inner ring-1 ring-black/5 ${sizeClass[size]} ${className}`}
      style={{ backgroundColor: bg }}
      title={title}
      aria-hidden
    />
  );
};

export default TypeColorSwatch;
export { normalizeHex };
