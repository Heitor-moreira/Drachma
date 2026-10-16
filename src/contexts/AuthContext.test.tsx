// @vitest-environment jsdom
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mockSignInWithOAuth = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
      signInWithOAuth: (opts: any) => mockSignInWithOAuth(opts),
      signInWithPassword: (opts: any) => mockSignInWithPassword(opts),
      signOut: (opts?: any) => mockSignOut(opts),
      updateUser: (opts: any) => mockUpdateUser(opts),
    },
  },
}));

afterEach(cleanup);

const TestConsumer: React.FC<{ onAuth?: (auth: ReturnType<typeof useAuth>) => void }> = ({ onAuth }) => {
  const auth = useAuth();
  if (onAuth) onAuth(auth);
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="recovery">{String(auth.isPasswordRecovery)}</span>
      <span data-testid="must-change">{String(auth.mustChangePassword)}</span>
      <span data-testid="callback-error">{auth.authCallbackError || 'none'}</span>
    </div>
  );
};

describe('AuthContext — Google OAuth e Callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    // Mock window.location.assign
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: vi.fn(),
      },
    });
  });

  it('loginWithGoogle passa skipBrowserRedirect: true e prompt: select_account', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://fqdi.supabase.co/auth/v1/authorize?provider=google' },
      error: null,
    });

    // Mock fetch for pre-check
    global.fetch = vi.fn().mockResolvedValue({
      type: 'opaqueredirect',
      status: 0,
    } as any);

    let authInstance!: ReturnType<typeof useAuth>;
    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await act(async () => {
      await authInstance.loginWithGoogle();
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/',
        queryParams: { prompt: 'select_account' },
        skipBrowserRedirect: true,
      },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://fqdi.supabase.co/auth/v1/authorize?provider=google',
      { method: 'GET', redirect: 'manual' }
    );
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://fqdi.supabase.co/auth/v1/authorize?provider=google'
    );
  });

  it('loginWithGoogle rejeita com erro do provider quando pré-checagem retorna 400', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://fqdi.supabase.co/auth/v1/authorize?provider=google' },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      type: 'basic',
      status: 400,
      json: vi.fn().mockResolvedValue({
        msg: 'Unsupported provider: provider is not enabled',
      }),
    } as any);

    let authInstance!: ReturnType<typeof useAuth>;
    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await act(async () => {
      await expect(authInstance.loginWithGoogle()).rejects.toThrow(
        'Unsupported provider: provider is not enabled'
      );
    });
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('recovery').textContent).toBe('false');
  });

  it('não navega nem falha se a resposta da pré-checagem 400 tiver JSON malformado', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://fqdi.supabase.co/auth/v1/authorize?provider=google' },
      error: null,
    });
    global.fetch = vi.fn().mockResolvedValue({
      type: 'basic',
      status: 400,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as any);

    let authInstance!: ReturnType<typeof useAuth>;
    render(<AuthProvider><TestConsumer onAuth={(a) => { authInstance = a; }} /></AuthProvider>);

    await act(async () => {
      await expect(authInstance.loginWithGoogle()).rejects.toThrow('provider is not enabled');
    });
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('prossegue para a URL OAuth quando a pré-checagem falha por rede', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://fqdi.supabase.co/auth/v1/authorize?provider=google' },
      error: null,
    });
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    let authInstance!: ReturnType<typeof useAuth>;
    render(<AuthProvider><TestConsumer onAuth={(a) => { authInstance = a; }} /></AuthProvider>);

    await act(async () => {
      await authInstance.loginWithGoogle();
    });
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://fqdi.supabase.co/auth/v1/authorize?provider=google'
    );
  });

  it('captura erro de callback na rota raiz e limpa a URL via history.replaceState', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '?error=access_denied&error_description=The+user+denied',
        hash: '',
        assign: vi.fn(),
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('callback-error').textContent).toBe('The user denied');
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/');
  });

  it.each([
    {
      search: '',
      hash: '#access_token=xyz&error=access_denied&error_description=User+cancelled&state=abc',
      expected: 'User cancelled',
    },
    {
      search: '?error_code=server_error',
      hash: '#error_description=Hash+description&state=abc',
      expected: 'Hash description',
    },
    {
      search: '',
      hash: '#error=%E0%A4%A&error_description=%E0%A4%A',
      expected: '�%A',
    },
  ])('captura erros OAuth em query/hash mistos ou malformados', async ({ search, hash, expected }) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        origin: 'http://localhost:3000',
        pathname: '/',
        search,
        hash,
        assign: vi.fn(),
      },
    });

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('callback-error').textContent).toBe(expected));
    expect(screen.getByTestId('recovery').textContent).toBe('false');
  });

  it('não intercepta type=recovery como erro de callback, ativando isPasswordRecovery', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '#type=recovery&access_token=xyz',
        assign: vi.fn(),
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('recovery').textContent).toBe('true');
      expect(screen.getByTestId('callback-error').textContent).toBe('none');
    });
  });
});

describe('AuthContext — Primeiro Acesso e mustChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('ativa mustChangePassword se o usuário na sessão inicial possuir must_change_password: true', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'novo@drachma.app',
            user_metadata: { must_change_password: true },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('must-change').textContent).toBe('true');
    });
  });

  it('mantém mustChangePassword false se o usuário não possuir a flag na sessão', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'antigo@drachma.app',
            user_metadata: { must_change_password: false },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('must-change').textContent).toBe('false');
    });
  });

  it('define mustChangePassword como true ao logar com a senha padrão provisória', async () => {
    let authInstance!: ReturnType<typeof useAuth>;
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: 'u1', email: 'test@drachma.app', user_metadata: {} },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await act(async () => {
      await authInstance.login('test@drachma.app', 'senhapadrao123');
    });

    expect(screen.getByTestId('must-change').textContent).toBe('true');
  });

  it('não define mustChangePassword true ao logar com outra senha se metadados não exigirem', async () => {
    let authInstance!: ReturnType<typeof useAuth>;
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: 'u1', email: 'test@drachma.app', user_metadata: { must_change_password: false } },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await act(async () => {
      await authInstance.login('test@drachma.app', 'minhasenhadificil123');
    });

    expect(screen.getByTestId('must-change').textContent).toBe('false');
  });

  it('reseta mustChangePassword para false ao efetuar logout', async () => {
    let authInstance!: ReturnType<typeof useAuth>;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'novo@drachma.app',
            user_metadata: { must_change_password: true },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('must-change').textContent).toBe('true');
    });

    await act(async () => {
      await authInstance.logout();
    });

    expect(screen.getByTestId('must-change').textContent).toBe('false');
  });

  it('completeFirstAccessPassword rejeita caso tente reutilizar a senha padrão provisória', async () => {
    let authInstance!: ReturnType<typeof useAuth>;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'novo@drachma.app',
            user_metadata: { must_change_password: true },
          },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('must-change').textContent).toBe('true');
    });

    await act(async () => {
      await expect(
        authInstance.completeFirstAccessPassword('senhapadrao123')
      ).rejects.toThrow('A nova senha não pode ser a senha padrão provisória.');
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('must-change').textContent).toBe('true');
  });

  it('completeFirstAccessPassword atualiza a senha, limpa a flag e encerra outras sessões', async () => {
    let authInstance!: ReturnType<typeof useAuth>;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'novo@drachma.app',
            user_metadata: { must_change_password: true },
          },
        },
      },
      error: null,
    });

    mockUpdateUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'novo@drachma.app',
          user_metadata: { must_change_password: false },
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer onAuth={(a) => { authInstance = a; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('must-change').textContent).toBe('true');
    });

    await act(async () => {
      await authInstance.completeFirstAccessPassword('NovaSenhaDefinitiva2026!');
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'NovaSenhaDefinitiva2026!',
      data: { must_change_password: false },
    });
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(screen.getByTestId('must-change').textContent).toBe('false');
  });
});
