import React from 'react';

/** Rótulo padrão para campos de formulário (tipografia e cor alinhadas ao design system). */
const AppLabel: React.FC<
  React.LabelHTMLAttributes<HTMLLabelElement> & { optional?: boolean }
> = ({ children, className = '', optional, ...props }) => (
  <label
    {...props}
    className={`block text-sm font-medium text-slate-700 ${optional ? 'font-normal text-slate-500' : ''} ${className}`.trim()}
  >
    {children}
    {optional ? <span className="text-slate-400"> (opcional)</span> : null}
  </label>
);

export default AppLabel;
