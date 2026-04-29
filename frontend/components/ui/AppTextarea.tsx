import React from 'react';

interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** Área de texto com o mesmo tratamento visual de {@link AppInput}. */
const AppTextarea: React.FC<AppTextareaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
      {...props}
    />
  );
};

export default AppTextarea;
