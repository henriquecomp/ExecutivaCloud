import React from 'react';

/** Cartão branco para barras de filtro / paginação (mesmo shell nas vistas de dados). */
const ToolbarPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-xl border border-slate-100 bg-white p-4 shadow-md ${className}`.trim()}>{children}</div>
);

export default ToolbarPanel;
