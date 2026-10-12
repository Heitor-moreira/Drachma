// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginView from './LoginView';

const auth = {
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  resetPassword: vi.fn(),
  authCallbackError: null as string | null,
  clearAuthCallbackError: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => auth,
}));

beforeEach(() => {
  auth.login = vi.fn().mockResolvedValue(undefined);
  auth.loginWithGoogle = vi.fn().mockResolvedValue(undefined);
  auth.resetPassword = vi.fn().mockResolvedValue(undefined);
  auth.authCallbackError = null;
  auth.clearAuthCallbackError = vi.fn();
});

afterEach(cleanup);

const emailInput = () => screen.getByPlaceholderText('seu@email.com') as HTMLInputElement;
const passwordInput = () => screen.getByPlaceholderText('••••••••') as HTMLInputElement;
const submitLogin = () => fireEvent.submit(screen.getByRole('button', { name: /Entrar/ }).closest('form')!);
const openForgot = () => fireEvent.click(screen.getByText('Esqueceu?'));
const submitForgot = () =>
  fireEvent.submit(screen.getByRole('button', { name: /Enviar link de recuperação/ }).closest('form')!);

const fillLogin = (email: string, password: string) => {
  fireEvent.change(emailInput(), { target: { value: email } });
  fireEvent.change(passwordInput(), { target: { value: password } });
};

describe('LoginView — login com e-mail e senha', () => {
  it('L1/L2: exige e-mail e senha sem chamar a API', () => {
    render(<LoginView />);
    submitLogin();
    expect(screen.getByText('Preencha seu e-mail e senha.')).toBeTruthy();

    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } });
    submitLogin();
    expect(screen.getByText('Preencha seu e-mail e senha.')).toBeTruthy();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it.each([
    ['Invalid login credentials', 'E-mail ou senha incorretos.'],
    ['invalid_credentials', 'E-mail ou senha incorretos.'],
    ['Email not confirmed', 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'],
    ['User not found', 'Usuário não encontrado.'],
    ['Password should be at least 6 characters', 'A senha deve ter no mínimo 6 caracteres.'],
    ['email rate limit exceeded: over_email_send_rate_limit', 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.'],
    ['Supabase não configurado. Verifique as variáveis de ambiente.', 'Serviço de autenticação não configurado no momento.'],
    ['Algo estranho', 'Algo estranho'],
  ])('L3-L8: traduz "%s"', async (raw, expected) => {
    auth.login = vi.fn().mockRejectedValue(new Error(raw));
    render(<LoginView />);
    fillLogin('a@b.com', '123456');
    submitLogin();
    expect(await screen.findByText(expected)).toBeTruthy();
  });

  it('L8: erro sem mensagem usa texto genérico', async () => {
    auth.login = vi.fn().mockRejectedValue({});
    render(<LoginView />);
    fillLogin('a@b.com', '123456');
    submitLogin();
    expect(await screen.findByText('Ocorreu um erro ao processar. Tente novamente.')).toBeTruthy();
  });

  it('L9: faz trim do e-mail e envia a senha', async () => {
    render(<LoginView />);
    fillLogin('  a@b.com  ', 'segredo');
    submitLogin();
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('a@b.com', 'segredo'));
  });

  it('L10: desabilita campos durante o envio e reabilita depois do erro', async () => {
    let reject!: (e: Error) => void;
    auth.login = vi.fn().mockReturnValue(new Promise((_, r) => { reject = r; }));
    render(<LoginView />);
    fillLogin('a@b.com', '123456');
    submitLogin();

    await waitFor(() => expect(emailInput().disabled).toBe(true));
    expect(passwordInput().disabled).toBe(true);

    reject(new Error('Invalid login credentials'));
    await screen.findByText('E-mail ou senha incorretos.');
    expect(emailInput().disabled).toBe(false);
    expect(passwordInput().disabled).toBe(false);
  });

  it('L11: limpa o erro anterior ao reenviar', async () => {
    auth.login = vi.fn().mockRejectedValueOnce(new Error('Invalid login credentials')).mockResolvedValueOnce(undefined);
    render(<LoginView />);
    fillLogin('a@b.com', '123456');
    submitLogin();
    await screen.findByText('E-mail ou senha incorretos.');
    submitLogin();
    await waitFor(() => expect(screen.queryByText('E-mail ou senha incorretos.')).toBeNull());
  });

  it('usa onLogin quando informado', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginView onLogin={onLogin} />);
    fillLogin('a@b.com', '123456');
    submitLogin();
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('email', 'a@b.com', '123456'));
    expect(auth.login).not.toHaveBeenCalled();
  });
});

describe('LoginView — Google', () => {
  it('G1: chama loginWithGoogle', async () => {
    render(<LoginView />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar com o Google/ }));
    await waitFor(() => expect(auth.loginWithGoogle).toHaveBeenCalled());
  });

  it('G2: falha mostra erro traduzido e reabilita o botão', async () => {
    auth.loginWithGoogle = vi.fn().mockRejectedValue(new Error('Supabase não configurado.'));
    render(<LoginView />);
    const btn = screen.getByRole('button', { name: /Continuar com o Google/ }) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(await screen.findByText('Serviço de autenticação não configurado no momento.')).toBeTruthy();
    expect(btn.disabled).toBe(false);
  });

  it('G3: erro de provider desabilitado exibe mensagem amigável e reabilita botão', async () => {
    auth.loginWithGoogle = vi.fn().mockRejectedValue(new Error('Unsupported provider: provider is not enabled'));
    render(<LoginView />);
    const btn = screen.getByRole('button', { name: /Continuar com o Google/ }) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(
      await screen.findByText('Login com Google indisponível no momento. Use e-mail e senha ou contate o administrador.')
    ).toBeTruthy();
    expect(btn.disabled).toBe(false);
  });

  it('G4: exibe authCallbackError recebido do contexto e limpa o erro no contexto', async () => {
    auth.authCallbackError = 'Signups not allowed for this instance';
    render(<LoginView />);
    expect(
      await screen.findByText('Esta conta Google não tem acesso ao Drachma. Solicite acesso ou entre com o e-mail cadastrado.')
    ).toBeTruthy();
    expect(auth.clearAuthCallbackError).toHaveBeenCalled();
  });

  it('G5: cancelamento do usuário no callback exibe mensagem de cancelado', async () => {
    auth.authCallbackError = 'access_denied';
    render(<LoginView />);
    expect(await screen.findByText('Login com Google cancelado.')).toBeTruthy();
    expect(auth.clearAuthCallbackError).toHaveBeenCalled();
  });
});

describe('LoginView — esqueci a senha', () => {
  it('R1: abre o formulário de recuperação e esconde o rodapé de acesso', () => {
    render(<LoginView onNavigateToRequestAccess={() => {}} />);
    expect(screen.getByText('Solicitar acesso')).toBeTruthy();
    openForgot();
    expect(screen.getByRole('button', { name: /Enviar link de recuperação/ })).toBeTruthy();
    expect(screen.queryByText('Solicitar acesso')).toBeNull();
  });

  it('R2: e-mail vazio ou só espaços não chama a API', () => {
    render(<LoginView />);
    openForgot();
    submitForgot();
    expect(screen.getByText('Por favor, informe seu e-mail.')).toBeTruthy();
    fireEvent.change(emailInput(), { target: { value: '   ' } });
    submitForgot();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('R3: sucesso envia e-mail aparado e mostra confirmação', async () => {
    render(<LoginView />);
    openForgot();
    fireEvent.change(emailInput(), { target: { value: ' a@b.com ' } });
    submitForgot();
    expect(await screen.findByText(/E-mail de recuperação enviado com sucesso/)).toBeTruthy();
    expect(auth.resetPassword).toHaveBeenCalledWith('a@b.com');
  });

  it('R4: rate limit mostra erro e não mostra sucesso', async () => {
    auth.resetPassword = vi.fn().mockRejectedValue(new Error('email rate limit exceeded'));
    render(<LoginView />);
    openForgot();
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } });
    submitForgot();
    expect(await screen.findByText('Muitas tentativas em pouco tempo. Aguarde alguns instantes.')).toBeTruthy();
    expect(screen.queryByText(/enviado com sucesso/)).toBeNull();
  });

  it('R5: voltar para o login limpa mensagens', async () => {
    render(<LoginView />);
    openForgot();
    submitForgot();
    expect(screen.getByText('Por favor, informe seu e-mail.')).toBeTruthy();
    fireEvent.click(screen.getByText(/Voltar para o login/));
    expect(screen.queryByText('Por favor, informe seu e-mail.')).toBeNull();
    expect(screen.getByRole('button', { name: /Entrar/ })).toBeTruthy();
  });

  it('R6: usa onNavigateToForgotPassword quando informado', () => {
    const onNav = vi.fn();
    render(<LoginView onNavigateToForgotPassword={onNav} />);
    openForgot();
    expect(onNav).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Enviar link de recuperação/ })).toBeNull();
  });

  it('R7: inicializa em modo forgot quando a URL contém ?forgot=true', () => {
    window.history.pushState({}, '', '/?forgot=true');
    try {
      render(<LoginView />);
      expect(screen.getByRole('button', { name: /Enviar link de recuperação/ })).toBeTruthy();
    } finally {
      window.history.pushState({}, '', '/');
    }
  });
});
