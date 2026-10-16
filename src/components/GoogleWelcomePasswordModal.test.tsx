// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GoogleWelcomePasswordModal, { isGoogleWithoutPassword } from './GoogleWelcomePasswordModal';

const auth = {
  user: null as any,
  supabaseUser: null as any,
  updatePassword: vi.fn(),
  isLoading: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => auth,
}));

const store = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, val: string) => { store.set(key, String(val)); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() { return store.size; },
};

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', mockStorage);
  auth.updatePassword = vi.fn().mockResolvedValue(undefined);
  auth.user = { id: 'test-user-id', email: 'google.user@gmail.com', isPremium: false };
  auth.supabaseUser = {
    id: 'test-user-id',
    app_metadata: { providers: ['google'] },
    identities: [{ provider: 'google' }],
  };
});

afterEach(cleanup);

const newPasswordInput = () => screen.getByLabelText('Nova senha') as HTMLInputElement;
const confirmPasswordInput = () => screen.getByLabelText('Confirmar nova senha') as HTMLInputElement;
const submitButton = () => screen.getByRole('button', { name: /Definir senha e continuar/i });
const dismissButton = () => screen.getByRole('button', { name: /Agora não, continuar/i });

describe('isGoogleWithoutPassword — Função de detecção', () => {
  it('retorna false para usuário nulo ou indefinido', () => {
    expect(isGoogleWithoutPassword(null)).toBe(false);
    expect(isGoogleWithoutPassword(undefined)).toBe(false);
  });

  it('retorna true para usuário que possui somente provedor google em providers', () => {
    const user = { app_metadata: { providers: ['google'] } };
    expect(isGoogleWithoutPassword(user)).toBe(true);
  });

  it('retorna true para usuário que possui somente provedor google em provider singular', () => {
    const user = { app_metadata: { provider: 'google' } };
    expect(isGoogleWithoutPassword(user)).toBe(true);
  });

  it('retorna true para usuário que possui identities apenas com google', () => {
    const user = { identities: [{ provider: 'google' }] };
    expect(isGoogleWithoutPassword(user)).toBe(true);
  });

  it('retorna false para usuário que já possui senha/provedor de email', () => {
    const userWithBoth = { app_metadata: { providers: ['google', 'email'] } };
    expect(isGoogleWithoutPassword(userWithBoth)).toBe(false);

    const userWithEmailIdentity = {
      identities: [{ provider: 'google' }, { provider: 'email' }],
    };
    expect(isGoogleWithoutPassword(userWithEmailIdentity)).toBe(false);

    const userOnlyEmail = { app_metadata: { providers: ['email'] } };
    expect(isGoogleWithoutPassword(userOnlyEmail)).toBe(false);
  });
});

describe('GoogleWelcomePasswordModal — Exibição e comportamento', () => {
  it('não exibe se o usuário já tiver provedor email ou não for Google', () => {
    // Caso com email e google
    auth.supabaseUser = {
      id: 'test-user-id',
      app_metadata: { providers: ['google', 'email'] },
    };
    const { rerender } = render(<GoogleWelcomePasswordModal />);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Caso apenas email
    auth.supabaseUser = {
      id: 'test-user-id',
      app_metadata: { providers: ['email'] },
    };
    rerender(<GoogleWelcomePasswordModal />);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Caso sem usuário
    auth.user = null;
    auth.supabaseUser = null;
    rerender(<GoogleWelcomePasswordModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('não exibe se o modal já tiver sido dispensado no localStorage para o usuário', () => {
    localStorage.setItem('drachma_dismissed_google_password_test-user-id', 'true');
    render(<GoogleWelcomePasswordModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exibe o modal para usuário Google sem senha', () => {
    render(<GoogleWelcomePasswordModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Defina sua senha')).toBeTruthy();
    expect(newPasswordInput()).toBeTruthy();
    expect(confirmPasswordInput()).toBeTruthy();
    expect(submitButton()).toBeTruthy();
    expect(dismissButton()).toBeTruthy();
  });

  it('alterna os botões de olho para exibir/ocultar senha e confirmação', () => {
    render(<GoogleWelcomePasswordModal />);

    // Nova senha
    const toggleNewPass = screen.getByLabelText('Exibir nova senha');
    expect(newPasswordInput().type).toBe('password');
    fireEvent.click(toggleNewPass);
    expect(newPasswordInput().type).toBe('text');
    expect(screen.getByLabelText('Ocultar nova senha')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Ocultar nova senha'));
    expect(newPasswordInput().type).toBe('password');

    // Confirmar nova senha
    const toggleConfirmPass = screen.getByLabelText('Exibir confirmação de senha');
    expect(confirmPasswordInput().type).toBe('password');
    fireEvent.click(toggleConfirmPass);
    expect(confirmPasswordInput().type).toBe('text');
    expect(screen.getByLabelText('Ocultar confirmação de senha')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Ocultar confirmação de senha'));
    expect(confirmPasswordInput().type).toBe('password');
  });

  it('valida senhas não preenchidas, menores que 6 caracteres ou não coincidentes', async () => {
    render(<GoogleWelcomePasswordModal />);

    // Campos vazios
    fireEvent.click(submitButton());
    expect(screen.getByText('Preencha a nova senha e a confirmação.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();

    // Menor que 6 caracteres
    fireEvent.change(newPasswordInput(), { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: '123' } });
    fireEvent.click(submitButton());
    expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();

    // Senhas não coincidentes
    fireEvent.change(newPasswordInput(), { target: { value: 'segredo123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'outroSegredo' } });
    fireEvent.click(submitButton());
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('chama updatePassword com sucesso, exibe feedback positivo e salva no localStorage', async () => {
    render(<GoogleWelcomePasswordModal />);

    fireEvent.change(newPasswordInput(), { target: { value: 'minhasenha123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'minhasenha123' } });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(auth.updatePassword).toHaveBeenCalledWith('minhasenha123');
      expect(screen.getByText('Senha cadastrada com sucesso!')).toBeTruthy();
    });

    expect(localStorage.getItem('drachma_dismissed_google_password_test-user-id')).toBe('true');

    // Botão de continuar fecha o modal
    const continueBtn = screen.getByRole('button', { name: /Continuar para o Drachma/i });
    fireEvent.click(continueBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('fecha e salva no localStorage ao clicar em "Agora não, continuar"', () => {
    render(<GoogleWelcomePasswordModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(dismissButton());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('drachma_dismissed_google_password_test-user-id')).toBe('true');
  });

  it('fecha e salva no localStorage ao clicar no botão de fechar (X)', () => {
    render(<GoogleWelcomePasswordModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();

    const closeBtn = screen.getByLabelText('Fechar');
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('drachma_dismissed_google_password_test-user-id')).toBe('true');
  });

  it('exibe o modal com forceOpen={true} mesmo se o usuário for nulo ou não elegível', () => {
    auth.user = null;
    auth.supabaseUser = null;
    render(<GoogleWelcomePasswordModal forceOpen={true} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Defina sua senha')).toBeTruthy();
  });

  it('exibe o modal com forceOpen={true} mesmo se já tiver sido dispensado no localStorage', () => {
    localStorage.setItem('drachma_dismissed_google_password_test-user-id', 'true');
    render(<GoogleWelcomePasswordModal forceOpen={true} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Defina sua senha')).toBeTruthy();
  });

  it('em modo preview sem usuário real conectado, valida e exibe tela de sucesso com checkmark', async () => {
    auth.user = null;
    auth.supabaseUser = null;
    render(<GoogleWelcomePasswordModal forceOpen={true} />);

    fireEvent.change(newPasswordInput(), { target: { value: 'novasenha123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'novasenha123' } });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText('Senha cadastrada com sucesso!')).toBeTruthy();
    });
  });

  it('chama onClose e fecha o modal ao clicar em Fechar com forceOpen={true}', () => {
    const onClose = vi.fn();
    render(<GoogleWelcomePasswordModal forceOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    const closeBtn = screen.getByLabelText('Fechar');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza o modal quando a URL possui ?welcome=true mesmo sem usuário', () => {
    auth.user = null;
    auth.supabaseUser = null;
    delete (window as any).location;
    window.location = new URL('http://localhost:3000/?welcome=true') as any;

    render(<GoogleWelcomePasswordModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Defina sua senha')).toBeTruthy();
  });

  it('contém atributos de autofill, acessibilidade e campo oculto de username para Keychain', () => {
    auth.user = { id: 'test-user-id', email: 'test.google@domain.com' };
    auth.supabaseUser = {
      id: 'test-user-id',
      app_metadata: { providers: ['google'] },
      identities: [{ provider: 'google' }],
    };

    const { container } = render(<GoogleWelcomePasswordModal />);

    const hiddenUsername = container.querySelector('input[name="username"]') as HTMLInputElement;
    expect(hiddenUsername).toBeTruthy();
    expect(hiddenUsername.type).toBe('email');
    expect(hiddenUsername.autocomplete).toBe('username');
    expect(hiddenUsername.value).toBe('test.google@domain.com');
    expect(hiddenUsername.readOnly).toBe(true);
    expect(hiddenUsername.hidden).toBe(true);
    expect(hiddenUsername.getAttribute('aria-hidden')).toBe('true');

    const newPass = newPasswordInput();
    const confirmPass = confirmPasswordInput();
    const newPassLabel = screen.getByText('Nova senha');
    const confirmPassLabel = screen.getByText('Confirmar nova senha');

    expect(newPass.id).toBe('google-welcome-new-password');
    expect(newPass.name).toBe('new-password');
    expect(newPass.autocomplete).toBe('new-password');
    expect(newPassLabel.getAttribute('for')).toBe('google-welcome-new-password');

    expect(confirmPass.id).toBe('google-welcome-confirm-password');
    expect(confirmPass.name).toBe('confirm-password');
    expect(confirmPass.autocomplete).toBe('new-password');
    expect(confirmPassLabel.getAttribute('for')).toBe('google-welcome-confirm-password');
  });
});
