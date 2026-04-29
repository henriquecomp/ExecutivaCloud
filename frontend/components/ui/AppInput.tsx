import React from 'react';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AppInput: React.FC<AppInputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
      {...props}
    />
  );
};

export default AppInput;
