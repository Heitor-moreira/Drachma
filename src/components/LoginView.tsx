import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, LogIn, KeyRound } from 'lucide-react';

interface LoginViewProps {
  onLogin: (method: 'email' | 'google', email?: string, password?: string) => Promise<void>;
  onNavigateToRequestAccess: () => void;
  onNavigateToForgotPassword: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ 
  onLogin, 
  onNavigateToRequestAccess,
  onNavigateToForgotPassword 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    
    setIsLoading(true);
    try {
      await onLogin('email', email, password);
    } catch (err) {
      setError('Credenciais inválidas ou erro no login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onLogin('google');
    } catch (err) {
      setError('Erro ao conectar com o Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-dark-app-background transition-colors duration-300">
      
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="bg-theme p-4 rounded-3xl text-white shadow-xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <TrendingUp size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-dark-app-text-primary mb-2">
            Drachma
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-dark-app-text-secondary uppercase tracking-widest">
            Finanças Descomplicadas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-dark-app-surface rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-100 dark:border-dark-app-border transition-colors duration-300 relative overflow-hidden">
          
          {/* Subtle decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-theme/40 via-theme to-theme/40" />

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-900/50 flex items-center gap-2">
              <KeyRound size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl focus:ring-2 focus:ring-theme focus:border-transparent outline-none text-slate-800 dark:text-dark-app-text-primary font-medium transition-all"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase tracking-wider">Senha</label>
                <button 
                  type="button" 
                  onClick={onNavigateToForgotPassword}
                  className="text-xs font-bold text-theme hover:text-theme-dark transition-colors"
                  disabled={isLoading}
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl focus:ring-2 focus:ring-theme focus:border-transparent outline-none text-slate-800 dark:text-dark-app-text-primary font-medium transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 mb-6 flex items-center justify-center gap-4">
            <div className="h-px bg-slate-200 dark:bg-dark-app-border flex-1" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ou</span>
            <div className="h-px bg-slate-200 dark:bg-dark-app-border flex-1" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white dark:bg-dark-app-surface border-2 border-slate-200 dark:border-dark-app-border text-slate-700 dark:text-dark-app-text-primary font-bold py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-app-surface-secondary transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com o Google
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm font-medium text-slate-600 dark:text-dark-app-text-secondary">
            Não tem uma conta?
          </p>
          <button 
            onClick={onNavigateToRequestAccess}
            className="text-sm font-bold text-theme hover:text-theme-dark transition-colors bg-theme/10 hover:bg-theme/20 px-6 py-2 rounded-full"
          >
            Solicitar acesso
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
