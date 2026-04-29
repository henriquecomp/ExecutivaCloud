import React from 'react';

export interface FormDangerAlertProps {
  message: string | null | undefined;
  className?: string;
}

/** Bloco de erro inline (estilo danger), substitui `alert()` em formulários. */
export const FormDangerAlert: React.FC<FormDangerAlertProps> = ({ message, className = '' }) => {
  if (!message?.trim()) return null;
  return (
    <p
      role="alert"
      className={`text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 ${className}`.trim()}
    >
      {message}
    </p>
  );
};
