import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, KeyRound, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { translateAuthError } from '../utils/authErrors';
import { validateNewPassword, MIN_PASSWORD_LENGTH } from '../utils/authValidation';

const ResetPasswordView: React.FC = () => {
  const { updatePassword, isLoading: isAuthLoading, session } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Detecta se a URL trouxe parâmetros de erro do Supabase (ex: link expirado no hash)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const search = window.location.search.startsWith('?')
        ? window.location.search.substring(1)
        : window.location.search;

      const parseParams = (str: string) => {
        const params = new URLSearchParams(str);
        const err = params.get('error') || params.get('error_code');
        const errDesc = params.get('error_description');
        return { err, errDesc };
      };

      const hashResult = parseParams(hash);
      const searchResult = parseParams(search);
      const err = hashResult.err || searchResult.err;
      const desc = hashResult.errDesc || searchResult.errDesc;

      if (err || desc) {
        setUrlError(translateAuthError({ message: desc || err }));
      }
    } catch {
      // Ignora parsing errors
    }
  }, []);

  const goToLogin = (forgot = false) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', forgot ? '/?forgot=true' : '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

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
      await updatePassword(newPassword);
      setIsSuccess(true);
      // Limpa hashes da URL para evitar vazamento de tokens no histórico
      if (typeof window !== 'undefined' && window.location.hash) {
        try {
          window.history.replaceState(null, '', '/');
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#031630] transition-colors duration-300">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Logo */}
        <div className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#C8963E] via-[#D4A347] to-[#B8860B] shadow-2xl mb-5 hover:scale-105 transition-transform duration-300">
            <div className="p-1 rounded-full bg-[#0A192F]">
              <img
                src="/drachma-icon.png"
                alt="Drachma"
                className="w-24 h-24 rounded-full shadow-inner object-cover"
              />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Drachma
          </h1>
          <p className="text-sm font-semibold text-[#B8860B] dark:text-[#D4A347] uppercase tracking-[0.2em]">
            Redefinição de Senha
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-[#0A192F] rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 transition-colors duration-300 relative overflow-hidden">

          {/* Estado 1: Carregando autenticação inicial */}
          {isAuthLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="h-10 w-10 border-4 border-[#C8963E]/20 border-t-[#C8963E] rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Validando link de recuperação...
              </p>
            </div>
          ) : isSuccess ? (
            /* Estado 2: Sucesso na alteração */
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Senha atualizada!
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sua nova senha foi salva com segurança. Você já pode acessar sua conta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToLogin(false)}
                className="w-full bg-[#0A192F] hover:bg-[#031630] dark:bg-gradient-to-r dark:from-[#C8963E] dark:to-[#B8860B] text-white dark:text-[#031630] font-bold py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg border border-[#C8963E]/40"
              >
                Ir para o login
              </button>
            </div>
          ) : urlError || (!session && !isAuthLoading) ? (
            /* Estado 3: Link inválido, expirado ou ausência de sessão */
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Link inválido ou expirado
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {urlError || 'Este link de recuperação expirou ou não possui uma sessão ativa válida. Por motivos de segurança, solicite um novo e-mail de recuperação.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToLogin(true)}
                className="w-full bg-[#0A192F] hover:bg-[#031630] dark:bg-gradient-to-r dark:from-[#C8963E] dark:to-[#B8860B] text-white dark:text-[#031630] font-bold py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg border border-[#C8963E]/40 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Voltar e solicitar novo link
              </button>
            </div>
          ) : (
            /* Estado 4: Formulário ativo para definir nova senha */
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-900/50 flex items-center gap-2"
                >
                  <KeyRound size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input oculto para associação de credencial com o Keychain / Touch ID */}
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={session?.user?.email || ''}
                readOnly
                hidden
                aria-hidden="true"
                tabIndex={-1}
              />

              {/* Campo Nova Senha */}
              <div className="space-y-1">
                <label
                  htmlFor="new-password-input"
                  className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="new-password-input"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-[#031630] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#C8963E] focus:border-transparent outline-none text-slate-800 dark:text-white font-medium transition-all"
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

              {/* Campo Confirmar Senha */}
              <div className="space-y-1">
                <label
                  htmlFor="confirm-password-input"
                  className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirm-password-input"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-[#031630] border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#C8963E] focus:border-transparent outline-none text-slate-800 dark:text-white font-medium transition-all"
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
              <div className="space-y-1 pt-1 px-1 text-xs">
                <div className={`flex items-center gap-1.5 transition-colors ${
                  newPassword.length === 0
                    ? 'text-slate-400 dark:text-slate-500'
                    : isPasswordValid
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Mínimo de {MIN_PASSWORD_LENGTH} caracteres {isPasswordValid && '✓'}
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-1.5 transition-colors ${
                    doPasswordsMatch
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {doPasswordsMatch ? 'As senhas conferem ✓' : 'As senhas não coincidem'}
                  </div>
                )}
              </div>

              {/* Botão de Submissão */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0A192F] hover:bg-[#031630] dark:bg-gradient-to-r dark:from-[#C8963E] dark:to-[#B8860B] text-white dark:text-[#031630] font-bold py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2 border border-[#C8963E]/40"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 dark:border-[#031630]/30 border-t-white dark:border-t-[#031630] rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound size={20} />
                    Salvar nova senha
                  </>
                )}
              </button>

              {/* Voltar ao login */}
              <button
                type="button"
                onClick={() => goToLogin(false)}
                disabled={isLoading}
                className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1 pt-2"
              >
                <ArrowLeft size={14} /> Voltar para o login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordView;
