import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { EditIcon, LogoutIcon } from './Icons';

const DATA_MENU_LABEL = 'Meus dados Cadastrais';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  /** Executivo: abre o modal unificado (conta + cadastro profissional). */
  onOpenExecutiveProfile?: () => void;
  /** Secretária: abre o modal unificado (conta + cadastro profissional). */
  onOpenSecretaryProfile?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onOpenExecutiveProfile, onOpenSecretaryProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-base hover:bg-slate-300 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Abrir menu do usuário"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {getInitials(user.fullName)}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200/50 z-20 origin-top-right"
          style={{
            animation: 'scale-in-up 0.2s ease-out',
          }}
        >
          <div className="p-6 text-center border-b border-slate-200">
            <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center text-4xl font-bold mx-auto mb-4">
              {getInitials(user.fullName)}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Olá, {user.fullName}!</h3>
            {user.email && <p className="text-xs text-slate-500 mt-1 break-all">{user.email}</p>}
            {user.phone && <p className="text-xs text-slate-500 mt-1">{user.phone}</p>}
            <p className="text-sm text-slate-500 capitalize mt-1">{user.role}</p>
          </div>
          <div className="p-2 space-y-1">
            {user.role === 'executive' && user.executiveId && onOpenExecutiveProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenExecutiveProfile();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 rounded-md hover:bg-slate-100 transition"
              >
                <EditIcon className="w-5 h-5 shrink-0 text-slate-500" />
                <span>{DATA_MENU_LABEL}</span>
              </button>
            )}
            {user.role === 'secretary' && user.secretaryId && onOpenSecretaryProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSecretaryProfile();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 rounded-md hover:bg-slate-100 transition"
              >
                <EditIcon className="w-5 h-5 shrink-0 text-slate-500" />
                <span>{DATA_MENU_LABEL}</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 rounded-md hover:bg-slate-100 hover:text-red-600 transition"
            >
              <LogoutIcon />
              <span>Sair do sistema</span>
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes scale-in-up {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
      `}</style>
    </div>
  );
};

export default UserMenu;
