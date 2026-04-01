import React, { useState, useEffect } from 'react';
import { User } from './types';
import CompleteExecutiveProfileView from './components/CompleteExecutiveProfileView';
import CompleteSecretaryProfileView from './components/CompleteSecretaryProfileView';
import LoginView from './components/LoginView';
import RegisterOrganizationView from './components/RegisterOrganizationView';
import SetPasswordView from './components/SetPasswordView';
import MainAppLayout from './MainAppLayout';
import {
  fetchMe,
  hydrateAuthHeader,
  logoutAuth,
  mapApiUserToAppUser,
} from './services/authService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const hasInviteLink = params.get('flow') === 'set-password' && Boolean(params.get('token')?.trim());

      // Link de convite deve sempre abrir a tela de senha: sessão antiga faria fetchMe e ignoraria a URL.
      if (hasInviteLink) {
        logoutAuth();
        if (!cancelled) {
          setCurrentUser(null);
          setSessionReady(true);
        }
        return;
      }

      hydrateAuthHeader();
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        if (!cancelled) setSessionReady(true);
        return;
      }
      try {
        const apiUser = await fetchMe();
        if (!cancelled) setCurrentUser(mapApiUserToAppUser(apiUser));
      } catch {
        logoutAuth();
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthScreen('login');
  };

  const handleLogout = () => {
    logoutAuth();
    setCurrentUser(null);
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Carregando…
      </div>
    );
  }

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const setPasswordFlow = searchParams.get('flow') === 'set-password';
  const inviteToken = searchParams.get('token');

  if (!currentUser && setPasswordFlow && inviteToken) {
    return <SetPasswordView token={inviteToken} onSuccess={handleAuthSuccess} />;
  }

  if (!currentUser) {
    if (authScreen === 'register') {
      return (
        <RegisterOrganizationView onSuccess={handleAuthSuccess} onBack={() => setAuthScreen('login')} />
      );
    }
    return <LoginView onSuccess={handleAuthSuccess} onGoRegister={() => setAuthScreen('register')} />;
  }

  if (currentUser.needsProfileCompletion && currentUser.role === 'executive') {
    return (
      <CompleteExecutiveProfileView
        currentUser={currentUser}
        onDone={(u) => setCurrentUser(u)}
      />
    );
  }

  if (currentUser.needsProfileCompletion && currentUser.role === 'secretary') {
    return (
      <CompleteSecretaryProfileView
        currentUser={currentUser}
        onDone={(u) => setCurrentUser(u)}
      />
    );
  }

  return <MainAppLayout key={currentUser.id} currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
