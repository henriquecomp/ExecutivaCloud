import React from 'react';
import { LayoutView } from '../types';
import { ViewGridIcon, ViewListIcon, ViewTableIcon } from './Icons';

interface ViewSwitcherProps {
  layout: LayoutView;
  setLayout: (layout: LayoutView) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ layout, setLayout }) => {
  const options: { name: LayoutView; icon: React.ReactNode; label: string }[] = [
    { name: 'card', icon: <ViewGridIcon />, label: 'Visualização em Cartões' },
    { name: 'list', icon: <ViewListIcon />, label: 'Visualização em Lista' },
    { name: 'table', icon: <ViewTableIcon />, label: 'Visualização em Tabela' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-200 p-1 text-sm">
      {options.map((option) => (
        <button
          key={option.name}
          type="button"
          onClick={() => setLayout(option.name)}
          title={option.label}
          aria-label={option.label}
          aria-pressed={layout === option.name}
          className={`rounded-md p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
            layout === option.name
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:bg-slate-300/50 hover:text-slate-700'
          }`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
