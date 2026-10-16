import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateNewPassword, MIN_PASSWORD_LENGTH } from '../utils/authValidation';
import { translateAuthError } from '../utils/authErrors';

/**
 * Verifica se o usuário autenticado efetuou login via Google e ainda não possui senha de e-mail cadastrada.
 */
export const isGoogleWithoutPassword = (sbUser: any): boolean => {
  if (!sbUser) return false;
  const providers = (sbUser.app_metadata?.providers as string[] | undefined) || [];
  const identities = (sbUser.identities as Array<{ provider: string }> | undefined) || [];
  const singleProvider = sbUser.app_metadata?.provider as string | undefined;

  const hasGoogle =
    providers.includes('google') ||
    identities.some((i) => i?.provider === 'google') ||
    singleProvider === 'google';

  const hasEmail =
    providers.includes('email') ||
    identities.some((i) => i?.provider === 'email') ||
    singleProvider === 'email';

  return hasGoogle && !hasEmail;
};

export interface GoogleWelcomePasswordModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const GoogleWelcomePasswordModal: React.FC<GoogleWelcomePasswordModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { user, supabaseUser, updatePassword } = useAuth();
  const userId = user?.id || supabaseUser?.id;

  const isUrlPreview = typeof window !== 'undefined' && (
    window.location.search.includes('preview=welcome') ||
    window.location.search.includes('welcome=true')
  );
  const isPreview = Boolean(forceOpen || isUrlPreview);

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (forceOpen || isUrlPreview) return false;
    if (!userId || typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`drachma_dismissed_google_password_${userId}`) === 'true';
    } catch {
      return false;
    }
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsDismissed(false);
      setIsSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!isPreview && userId && typeof window !== 'undefined' && !isSuccess) {
      try {
        if (localStorage.getItem(`drachma_dismissed_google_password_${userId}`) === 'true') {
          setIsDismissed(true);
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [userId, isSuccess, isPreview]);

  const handleDismiss = () => {
    if (userId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`drachma_dismissed_google_password_${userId}`, 'true');
      } catch {
        // ignore storage errors
      }
    }

    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('preview') || url.searchParams.has('welcome')) {
          url.searchParams.delete('preview');
          url.searchParams.delete('welcome');
          const newSearch = url.searchParams.toString();
          const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
          window.history.replaceState({}, '', newUrl);
        }
      } catch {
        // ignore storage/URL errors
      }
    }

    setIsDismissed(true);
    onClose?.();
  };

  // Fecha o modal automaticamente após o feedback de sucesso
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const isEligible = isGoogleWithoutPassword(supabaseUser);

  if (isDismissed) {
    return null;
  }

  if (!isPreview && (!userId || !isEligible)) {
    return null;
  }

  const isPasswordValid = newPassword.length >= MIN_PASSWORD_LENGTH;
  const doPasswordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Preencha a nova senha e a confirmação.');
      return;
    }

    const validation = validateNewPassword(newPassword, confirmPassword);
    if (!validation.isValid) {
      setError(validation.error || `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setIsLoading(true);
    try {
      if (isPreview && (!supabaseUser || !userId)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsSuccess(true);
        return;
      }

      await updatePassword(newPassword);
      if (userId && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`drachma_dismissed_google_password_${userId}`, 'true');
        } catch {
          // ignore storage errors
        }
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-welcome-title"
    >
      <div
        className="bg-white dark:bg-[#0A192F] rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors duration-300 relative overflow-hidden w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar / dispensar */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          /* Estado de sucesso */
          <div className="space-y-6 text-center animate-in fade-in duration-300 py-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h2
                id="google-welcome-title"
                className="text-2xl text-slate-900 dark:text-white"
                style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 600, letterSpacing: '0.04em' }}
              >
                Senha cadastrada com sucesso!
              </h2>
              <p
                className="text-sm text-slate-600 dark:text-slate-300"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Agora você pode acessar sua conta utilizando seu e-mail e sua nova senha ou continuar entrando via Google.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full bg-[#0A192F] hover:bg-[#031630] dark:bg-gradient-to-r dark:from-[#C8963E] dark:to-[#B8860B] text-white dark:text-[#031630] font-bold py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg border border-[#C8963E]/40"
              style={{ fontFamily: "'Nunito Sans', sans-serif" }}
            >
              Continuar para o Drachma
            </button>
          </div>
        ) : (
          /* Formulário de definição de senha */
          <div>
            {/* Ícone de chave/segurança em círculo com destaque ouro */}
            <div className="mx-auto w-16 h-16 rounded-full bg-[#C8963E]/20 text-[#D4A347] border border-[#C8963E]/30 flex items-center justify-center mb-4 shadow-lg shadow-[#C8963E]/10">
              <KeyRound size={28} />
            </div>

            <div className="text-center mb-6">
              <h2
                id="google-welcome-title"
                className="text-2xl text-slate-900 dark:text-white mb-2"
                style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 600, letterSpacing: '0.04em' }}
              >
                Defina sua senha
              </h2>
              <p
                className="text-sm text-slate-600 dark:text-slate-300"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Você entrou com sua conta Google. Para acessar também usando seu e-mail e senha diretamente, defina uma senha de acesso.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-900/50 flex items-center gap-2"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                <KeyRound size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Input oculto para associação de credencial com o Keychain / Touch ID */}
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={user?.email || ''}
                readOnly
                hidden
                aria-hidden="true"
                tabIndex={-1}
              />

              {/* Campo Nova Senha */}
              <div className="space-y-1">
                <label
                  htmlFor="google-welcome-new-password"
                  className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  Nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="google-welcome-new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-[#031630] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#C8963E] focus:border-transparent outline-none text-slate-800 dark:text-white font-medium transition-all"
                    style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    placeholder="Mínimo de 6 caracteres"
                    disabled={isLoading}
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

              {/* Campo Confirmar Nova Senha */}
              <div className="space-y-1">
                <label
                  htmlFor="google-welcome-confirm-password"
                  className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="google-welcome-confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-[#031630] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#C8963E] focus:border-transparent outline-none text-slate-800 dark:text-white font-medium transition-all"
                    style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    placeholder="Repita a nova senha"
                    disabled={isLoading}
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
              <div className="space-y-1 pt-1 px-1 text-xs" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    newPassword.length === 0
                      ? 'text-slate-400 dark:text-slate-500'
                      : isPasswordValid
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Mínimo de {MIN_PASSWORD_LENGTH} caracteres {isPasswordValid && '✓'}
                </div>
                {confirmPassword && (
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      doPasswordsMatch
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {doPasswordsMatch ? 'As senhas conferem ✓' : 'As senhas não coincidem'}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A192F] hover:bg-[#031630] dark:bg-gradient-to-r dark:from-[#C8963E] dark:to-[#B8860B] text-white dark:text-[#031630] font-bold py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed border border-[#C8963E]/40"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 dark:border-[#031630]/30 border-t-white dark:border-t-[#031630] rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={20} />
                      Definir senha e continuar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="w-full text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors py-2 text-center"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  Agora não, continuar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleWelcomePasswordModal;
