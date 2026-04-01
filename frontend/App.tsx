import React, { useState, useEffect } from 'react';
import { User } from './types';
import LoginView from './components/LoginView';
import RegisterOrganizationView from './components/RegisterOrganizationView';
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

  if (!currentUser) {
    if (authScreen === 'register') {
      return (
        <RegisterOrganizationView onSuccess={handleAuthSuccess} onBack={() => setAuthScreen('login')} />
      );
    }
    return <LoginView onSuccess={handleAuthSuccess} onGoRegister={() => setAuthScreen('register')} />;
  }

  return <MainAppLayout key={currentUser.id} currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
