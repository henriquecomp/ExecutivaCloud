import React from 'react';

/** Linha de botões de formulário (cancelar + principal), alinhados à direita com espaçamento fixo. */
const FormActions: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`flex flex-wrap justify-end gap-2 pt-4 ${className}`.trim()}>{children}</div>
);

export default FormActions;
