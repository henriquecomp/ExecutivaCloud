import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { LogoIcon, ExecutivesIcon, SecretariesIcon, SettingsIcon, ChevronDownIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface LoginViewProps {
  users: User[]; // This will now be fetched
}

const getRoleIcon = (role: User['role'], className: string = 'w-5 h-5') => {
    switch(role) {
        case 'executive': return <ExecutivesIcon className={className} />;
        case 'secretary': return <SecretariesIcon className={className} />;
        case 'admin':
        case 'master':
            return <SettingsIcon className={className} />;
        default: return <ExecutivesIcon className={className} />;
    }
}

const getRoleDescription = (role: User['role']) => {
    switch(role) {
        case 'executive': return 'Acesso focado nas próprias atividades.';
        case 'secretary': return 'Gerenciamento dos executivos associados.';
        case 'admin': return 'Administração de uma organização.';
        case 'master': return 'Acesso total a todas as funcionalidades.';
        default: return '';
    }
}

const LoginView: React.FC<LoginViewProps> = () => {
    const { login } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (err) {
                setError('Falha ao carregar usuários. Verifique se o servidor backend está em execução.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setIsOpen(false);
    };

    const handleLogin = async () => {
        if (selectedUser) {
            setError('');
            try {
                await login(selectedUser.id);
            } catch (err) {
                setError('Login falhou. Tente novamente.');
                console.error(err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 antialiased">
            <div className="text-center">
                <div className="inline-block bg-slate-800 p-4 rounded-full mb-4">
                    <LogoIcon className="w-24 h-24 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-800">Bem-vindo à Executiva Cloud</h1>
                <p className="text-slate-500 mt-2 text-lg">Selecione seu perfil para acessar o sistema.</p>
            </div>

            <div className="w-full max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg">
                <div className="space-y-6">
                    <div>
                        <label id="profile-label" className="block text-sm font-medium text-slate-700 mb-2">Selecione o Perfil</label>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                disabled={loading || !!error}
                                className="relative w-full bg-white border border-slate-300 rounded-md shadow-sm pl-4 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100"
                                aria-haspopup="listbox"
                                aria-expanded={isOpen}
                                aria-labelledby="profile-label"
                            >
                                {selectedUser ? (
                                    <span className="flex items-center">
                                        {getRoleIcon(selectedUser.role, 'w-6 h-6 mr-3 text-indigo-600 flex-shrink-0')}
                                        <span className="block truncate font-semibold text-slate-800">{selectedUser.fullName}</span>
                                    </span>
                                ) : (
                                    <span className="block truncate text-slate-500">{loading ? 'Carregando perfis...' : 'Selecione um perfil para acessar'}</span>
                                )}
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDownIcon />
                                </span>
                            </button>

                            {isOpen && (
                                <ul
                                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                                    tabIndex={-1}
                                    role="listbox"
                                    aria-labelledby="profile-label"
                                >
                                    {users.map((user) => (
                                        <li
                                            key={user.id}
                                            className="text-slate-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                            role="option"
                                            aria-selected={selectedUser?.id === user.id}
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            <div className="flex items-start">
                                                {getRoleIcon(user.role, 'w-6 h-6 mr-3 text-indigo-600 flex-shrink-0')}
                                                <div>
                                                    <p className="font-semibold">{user.fullName}</p>
                                                    <p className="text-xs text-slate-500">{getRoleDescription(user.role)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    
                    <button
                        onClick={handleLogin}
                        disabled={!selectedUser || loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Entrar no Sistema
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
