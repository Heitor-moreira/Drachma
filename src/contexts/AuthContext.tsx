import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MIN_PASSWORD_LENGTH } from '../utils/authValidation';

export type User = {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (sbUser: SupabaseUser | null): User | null => {
  if (!sbUser) return null;
  const userMetadata = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: userMetadata.full_name || userMetadata.name || sbUser.email?.split('@')[0],
    isPremium: Boolean(userMetadata.is_premium || userMetadata.isPremium),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Detectar fluxo de recuperação inicial
    if (typeof window !== 'undefined') {
      const isRecovery =
        window.location.hash.includes('type=recovery') ||
        window.location.pathname.startsWith('/reset-password');
      if (isRecovery) {
        setIsPasswordRecovery(true);
      }
    }

    // Buscar sessão inicial ativa
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setSupabaseUser(currentUser);
      setUser(mapSupabaseUser(currentUser));
      setIsLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : 'Erro ao inicializar sessão.');
      setIsLoading(false);
    });

    // Escuta alterações no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setSupabaseUser(currentUser);
      setUser(mapSupabaseUser(currentUser));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }
      if (!password) {
        throw new Error('Senha é obrigatória para efetuar login.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      setSession(data.session);
      setSupabaseUser(data.user);
      setUser(mapSupabaseUser(data.user));
    } catch (err: any) {
      const message = err?.message || 'Erro ao realizar login.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }

      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (oAuthError) {
        throw oAuthError;
      }
    } catch (err: any) {
      const message = err?.message || 'Erro ao conectar com o Google.';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setSupabaseUser(null);
      setUser(null);
      setIsPasswordRecovery(false);
    } catch (err: any) {
      const message = err?.message || 'Erro ao sair da conta.';
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (resetError) {
        throw resetError;
      }
    } catch (err: any) {
      const message = err?.message || 'Erro ao enviar email de recuperação.';
      setError(message);
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
      }
      if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Encerrar outras sessões ativas por segurança
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch {
        // Falha tolerada se a API não suportar o escopo 'others' no ambiente
      }

      setIsPasswordRecovery(false);

      if (data.user) {
        setSupabaseUser(data.user);
        setUser(mapSupabaseUser(data.user));
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setSession(sessionData.session);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Erro ao atualizar senha.';
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        supabaseUser,
        isAuthenticated: !!session || !!user,
        isLoading,
        isPasswordRecovery,
        error,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
