import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { translateAuthError } from '../utils/authErrors';
import {
  validateNewPassword,
  MIN_PASSWORD_LENGTH,
  PROVISIONAL_DEFAULT_PASSWORD,
} from '../utils/authValidation';

export interface OnboardingPasswordViewProps {
  onSuccess?: () => void;
}

const OnboardingPasswordView: React.FC<OnboardingPasswordViewProps> = ({ onSuccess }) => {
  const { completeFirstAccessPassword, logout, session, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordValidLength = newPassword.length >= MIN_PASSWORD_LENGTH;
  const isDefaultPassword = Boolean(newPassword && newPassword === PROVISIONAL_DEFAULT_PASSWORD);
  const doPasswordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Preencha a nova senha e a confirmação.');
      return;
    }

    const validation = validateNewPassword(newPassword, confirmPassword, {
      disallowDefaultPassword: true,
    });

    if (!validation.isValid) {
      setError(validation.error || `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setIsLoading(true);
    try {
      await completeFirstAccessPassword(newPassword);
      onSuccess?.();
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userEmail = session?.user?.email || user?.email || '';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-dark-app-background transition-colors duration-300">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Logo */}
        <div className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          <div className="relative p-1.5 rounded-full bg-white dark:bg-dark-app-surface border border-slate-200 dark:border-dark-app-border shadow-lg mb-5 hover:scale-105 transition-transform duration-300">
            <img
              src="/drachma-icon.png"
              alt="Drachma"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-dark-app-text-primary mb-2">
            Bem-vindo ao Drachma! 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-dark-app-text-secondary max-w-sm leading-relaxed">
            Como este é seu primeiro acesso com a senha padrão, configure sua senha pessoal para proteger seus dados financeiros.
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-dark-app-surface rounded-3xl sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-dark-app-border transition-colors duration-300 relative overflow-hidden">

          {error && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-900/50 flex items-center gap-2"
            >
              <KeyRound size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Input oculto para associação de credencial com o Keychain / Touch ID */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={userEmail}
              readOnly
              hidden
              aria-hidden="true"
              tabIndex={-1}
            />

            {/* Campo Nova Senha */}
            <div className="space-y-1">
              <label
                htmlFor="onboarding-new-password"
                className="text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase tracking-wider ml-1"
              >
                Nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="onboarding-new-password"
                  name="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 text-base bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl focus:ring-2 focus:ring-theme focus:border-transparent outline-none text-slate-800 dark:text-dark-app-text-primary font-medium transition-all"
                  placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
                  disabled={isLoading || isLoggingOut}
                  autoComplete="new-password"
                  maxLength={72}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Ocultar nova senha' : 'Exibir nova senha'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-1">
              <label
                htmlFor="onboarding-confirm-password"
                className="text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase tracking-wider ml-1"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="onboarding-confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 text-base bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl focus:ring-2 focus:ring-theme focus:border-transparent outline-none text-slate-800 dark:text-dark-app-text-primary font-medium transition-all"
                  placeholder="Repita a nova senha"
                  disabled={isLoading || isLoggingOut}
                  autoComplete="new-password"
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Indicadores dinâmicos de requisitos */}
            <div className="space-y-1 pt-1 px-1 text-xs">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  newPassword.length === 0
                    ? 'text-slate-400 dark:text-slate-500'
                    : isPasswordValidLength
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Mínimo de {MIN_PASSWORD_LENGTH} caracteres {isPasswordValidLength && '✓'}
              </div>

              {isDefaultPassword && (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  A nova senha não pode ser a senha padrão provisória
                </div>
              )}

              {confirmPassword && (
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    doPasswordsMatch
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {doPasswordsMatch ? 'As senhas conferem ✓' : 'As senhas não coincidem'}
                </div>
              )}
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={isLoading || isLoggingOut}
              className="w-full bg-theme hover:brightness-95 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={20} />
                  Salvar senha e entrar no Drachma
                </>
              )}
            </button>

            {/* Botão para Sair / Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading || isLoggingOut}
              className="w-full text-xs sm:text-sm font-bold text-slate-500 dark:text-dark-app-text-secondary hover:text-slate-800 dark:hover:text-dark-app-text-primary transition-colors flex items-center justify-center gap-1.5 pt-2 disabled:opacity-50"
            >
              <LogOut size={16} />
              {isLoggingOut ? 'Saindo da conta...' : 'Sair da conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPasswordView;
