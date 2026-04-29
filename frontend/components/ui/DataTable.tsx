import React from 'react';

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  /** Sem cartão externo — usar dentro de painel já existente (ex.: Usuários). */
  embedded?: boolean;
  /** Classes no wrapper de scroll (ex.: `overflow-auto max-h-[500px]` em relatórios). */
  innerClassName?: string;
}

/** Cartão + scroll; ou só scroll se `embedded`. */
export const DataTable: React.FC<DataTableProps> = ({
  children,
  className = '',
  embedded = false,
  innerClassName,
}) => {
  const scrollWrapClass = innerClassName ?? 'overflow-x-auto';
  const inner = (
    <div className={scrollWrapClass}>
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
  if (embedded) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {inner}
    </div>
  );
};

export const DataTableHead: React.FC<{ children: React.ReactNode; sticky?: boolean }> = ({
  children,
  sticky,
}) => (
  <thead
    className={`border-b border-slate-200 bg-slate-50 text-slate-600 ${
      sticky ? 'sticky top-0 z-[1] shadow-[0_1px_0_0_rgb(226_232_240)]' : ''
    }`}
  >
    {children}
  </thead>
);

export const DataTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="text-slate-700">{children}</tbody>
);

export const DataTableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50">{children}</tr>
);

export const DataTableTh: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;

export const DataTableTd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;

/** Linha única de estado (loading / vazio) — colspan no primeiro uso. */
export const DataTableEmptyRow: React.FC<{ colSpan: number; children: React.ReactNode }> = ({
  colSpan,
  children,
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
      {children}
    </td>
  </tr>
);
