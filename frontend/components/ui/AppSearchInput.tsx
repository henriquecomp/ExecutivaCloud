import React from 'react';
import { Search } from 'lucide-react';
import AppInput from './AppInput';

interface AppSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AppSearchInput: React.FC<AppSearchInputProps> = ({ className = '', ...props }) => {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <AppInput className={`pl-10 ${className}`} {...props} />
    </div>
  );
};

export default AppSearchInput;
