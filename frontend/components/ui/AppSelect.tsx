import React from 'react';

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const AppSelect: React.FC<AppSelectProps> = ({ className = '', ...props }) => {
  return (
    <select
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
      {...props}
    />
  );
};

export default AppSelect;
