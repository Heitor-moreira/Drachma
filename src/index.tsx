import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './data';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { DevModeWrapper } from './components/DevModeWrapper';
import ResetPasswordView from './components/ResetPasswordView';
import OnboardingPasswordView from './components/OnboardingPasswordView';

export const AuthGate: React.FC = () => {
  const { isPasswordRecovery, mustChangePassword } = useAuth();
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isResetPath = pathname.startsWith('/reset-password');

  if (isPasswordRecovery || isResetPath) {
    return <ResetPasswordView />;
  }

  if (mustChangePassword) {
    return <OnboardingPasswordView />;
  }

  return (
    <SyncProvider>
      <DataProvider>
        <DevModeWrapper>
          <App />
        </DevModeWrapper>
      </DataProvider>
    </SyncProvider>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </React.StrictMode>
  );
}
