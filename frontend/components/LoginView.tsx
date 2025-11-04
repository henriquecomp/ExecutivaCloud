import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types';
import { LogoIcon, ExecutivesIcon, SecretariesIcon, SettingsIcon, ChevronDownIcon } from './Icons';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

// Define the structure for profile types
type ProfileTypeKey = 'master' | 'admin_org' | 'admin_emp' | 'executive' | 'secretary';
interface ProfileType {
  key: ProfileTypeKey;
  label: string;
  description: string;
}

// Static list of profile types as requested
const profileTypes: ProfileType[] = [
    { key: 'master', label: 'Administrador Geral', description: 'Acesso total a todas as funcionalidades.' },
    { key: 'admin_org', label: 'Administrador de Organização', description: 'Administração de uma organização.' },
    { key: 'admin_emp', label: 'Administrador de Empresa', description: 'Administração de uma empresa.' },
    { key: 'executive', label: 'Executivo', description: 'Acesso às funcionalidades do executivo.' },
    { key: 'secretary', label: 'Secretária', description: 'Acesso às funcionalidades de gestão dos executivos.' },
];

const getRoleIcon = (roleKey: ProfileTypeKey, className: string = 'w-5 h-5') => {
    switch(roleKey) {
        case 'executive': return <ExecutivesIcon className={className} />;
        case 'secretary': return <SecretariesIcon className={className} />;
        case 'admin_org':
        case 'admin_emp':
        case 'master':
            return <SettingsIcon className={className} />;
        default: return <ExecutivesIcon className={className} />;
    }
}

const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
    const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);

    const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    // Effect to handle clicks outside of dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectProfile = (profile: ProfileType) => {
        setSelectedProfile(profile);
        setSelectedUser(null); // Reset user when profile changes
        setProfileDropdownOpen(false);
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setUserDropdownOpen(false);
    };

    const handleLogin = () => {
        if (selectedUser) {
            onLogin(selectedUser);
        }
    };
    
    // Filter users based on the selected profile type
    const filteredUsers = useMemo(() => {
        if (!selectedProfile) return [];

        switch (selectedProfile.key) {
            case 'master':
                return users.filter(u => u.role === 'master');
            case 'admin_org':
                // Admin for a legal organization, but not for a specific company
                return users.filter(u => u.role === 'admin' && u.legalOrganizationId && !u.organizationId);
            case 'admin_emp':
                // Admin for a specific company
                return users.filter(u => u.role === 'admin' && u.organizationId);
            case 'executive':
                return users.filter(u => u.role === 'executive');
            case 'secretary':
                return users.filter(u => u.role === 'secretary');
            default:
                return [];
        }
    }, [selectedProfile, users]);
    
    // Auto-select user if only one is available for the selected profile
    useEffect(() => {
        if (filteredUsers.length === 1) {
            setSelectedUser(filteredUsers[0]);
        }
    }, [filteredUsers]);


    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 antialiased">
            <div className="text-center">
                <div className="inline-block bg-slate-800 p-4 rounded-full mb-4">
                    <LogoIcon className="w-24 h-24 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-800">Bem-vindo à Executiva Cloud</h1>
                <p className="text-slate-500 mt-2 text-lg">Selecione seu perfil e usuário para acessar o sistema.</p>
            </div>

            <div className="w-full max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg">
                <div className="space-y-6">
                    {/* Profile Type Dropdown */}
                    <div>
                        <label id="profile-label" className="block text-sm font-medium text-slate-700 mb-2">Selecione o Perfil</label>
                        <div className="relative" ref={profileDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="relative w-full bg-white border border-slate-300 rounded-md shadow-sm pl-4 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-haspopup="listbox"
                                aria-expanded={isProfileDropdownOpen}
                                aria-labelledby="profile-label"
                            >
                                {selectedProfile ? (
                                    <span className="flex items-center">
                                        {getRoleIcon(selectedProfile.key, 'w-6 h-6 mr-3 text-indigo-600 flex-shrink-0')}
                                        <span className="block truncate font-semibold text-slate-800">{selectedProfile.label}</span>
                                    </span>
                                ) : (
                                    <span className="block truncate text-slate-500">Selecione um tipo de perfil</span>
                                )}
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDownIcon />
                                </span>
                            </button>

                            {isProfileDropdownOpen && (
                                <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {profileTypes.map((profile) => (
                                        <li
                                            key={profile.key}
                                            className="text-slate-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                            onClick={() => handleSelectProfile(profile)}
                                        >
                                            <div className="flex items-start">
                                                {getRoleIcon(profile.key, 'w-6 h-6 mr-3 text-indigo-600 flex-shrink-0')}
                                                <div>
                                                    <p className="font-semibold">{profile.label}</p>
                                                    <p className="text-xs text-slate-500">{profile.description}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* User Selection Dropdown */}
                    <div>
                        <label id="user-label" className="block text-sm font-medium text-slate-700 mb-2">Selecione o Usuário</label>
                        <div className="relative" ref={userDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                                className="relative w-full bg-white border border-slate-300 rounded-md shadow-sm pl-4 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                                aria-haspopup="listbox"
                                aria-expanded={isUserDropdownOpen}
                                aria-labelledby="user-label"
                                disabled={!selectedProfile || filteredUsers.length === 0}
                            >
                                {selectedUser ? (
                                    <span className="flex items-center">
                                        <span className="block truncate font-semibold text-slate-800">{selectedUser.fullName}</span>
                                    </span>
                                ) : (
                                    <span className="block truncate text-slate-500">
                                        {!selectedProfile ? 'Selecione um perfil primeiro' : (filteredUsers.length > 0 ? 'Selecione um usuário' : 'Nenhum usuário encontrado')}
                                    </span>
                                )}
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDownIcon />
                                </span>
                            </button>

                            {isUserDropdownOpen && filteredUsers.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {filteredUsers.map((user) => (
                                        <li
                                            key={user.id}
                                            className="text-slate-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            <p className="font-semibold">{user.fullName}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleLogin}
                        disabled={!selectedUser}
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