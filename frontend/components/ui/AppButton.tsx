import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300',
  secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:bg-slate-100',
  ghost: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:bg-slate-100',
};

const AppButton: React.FC<AppButtonProps> = ({ variant = 'primary', className = '', type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
};

export default AppButton;
