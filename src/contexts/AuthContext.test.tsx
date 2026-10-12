// @vitest-environment jsdom
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mockSignInWithOAuth = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
      signInWithOAuth: (opts: any) => mockSignInWithOAuth(opts),
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
