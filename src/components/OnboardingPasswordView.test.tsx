// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingPasswordView from './OnboardingPasswordView';

const auth = {
  completeFirstAccessPassword: vi.fn(),
  logout: vi.fn(),
  session: null as any,
  user: null as any,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => auth,
}));

beforeEach(() => {
  auth.completeFirstAccessPassword = vi.fn().mockResolvedValue(undefined);
  auth.logout = vi.fn().mockResolvedValue(undefined);
  auth.session = { user: { id: 'test-user-id', email: 'novo@drachma.app' } };
  auth.user = { id: 'test-user-id', email: 'novo@drachma.app', isPremium: false };
});

afterEach(cleanup);

const newPasswordInput = () => screen.getByLabelText('Nova senha') as HTMLInputElement;
const confirmPasswordInput = () => screen.getByLabelText('Confirmar nova senha') as HTMLInputElement;
const submitButton = () => screen.getByRole('button', { name: /Salvar senha e entrar no Drachma/ });
const logoutButton = () => screen.getByRole('button', { name: /Sair da conta/ });

describe('OnboardingPasswordView — Renderização e Interações', () => {
  it('renderiza título de boas-vindas, campos de senha e botões', () => {
    render(<OnboardingPasswordView />);

    expect(screen.getByText('Bem-vindo ao Drachma! 👋')).toBeTruthy();
    expect(screen.getByText(/Como este é seu primeiro acesso com a senha padrão/)).toBeTruthy();
    expect(newPasswordInput()).toBeTruthy();
    expect(confirmPasswordInput()).toBeTruthy();
    expect(submitButton()).toBeTruthy();
    expect(logoutButton()).toBeTruthy();
  });

  it('permite alternar a visibilidade das senhas', () => {
    render(<OnboardingPasswordView />);

    const toggleNewPass = screen.getByLabelText('Exibir nova senha');
    expect(newPasswordInput().type).toBe('password');
    fireEvent.click(toggleNewPass);
    expect(newPasswordInput().type).toBe('text');
    expect(screen.getByLabelText('Ocultar nova senha')).toBeTruthy();

    const toggleConfirmPass = screen.getByLabelText('Exibir confirmação de senha');
    expect(confirmPasswordInput().type).toBe('password');
    fireEvent.click(toggleConfirmPass);
    expect(confirmPasswordInput().type).toBe('text');
    expect(screen.getByLabelText('Ocultar confirmação de senha')).toBeTruthy();
  });

  it('exibe erro quando submetido com campos vazios', async () => {
    render(<OnboardingPasswordView />);

    fireEvent.click(submitButton());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Preencha a nova senha e a confirmação.')).toBeTruthy();
    expect(auth.completeFirstAccessPassword).not.toHaveBeenCalled();
  });

  it('rejeita quando a nova senha é a senha padrão provisória senhapadrao123', async () => {
    render(<OnboardingPasswordView />);

    fireEvent.change(newPasswordInput(), { target: { value: 'senhapadrao123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'senhapadrao123' } });

    expect(screen.getByText('A nova senha não pode ser a senha padrão provisória')).toBeTruthy();

    fireEvent.click(submitButton());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('A nova senha não pode ser a senha padrão provisória.')).toBeTruthy();
    expect(auth.completeFirstAccessPassword).not.toHaveBeenCalled();
  });

  it('rejeita quando a nova senha possui menos de 6 caracteres', async () => {
    render(<OnboardingPasswordView />);

    fireEvent.change(newPasswordInput(), { target: { value: '12345' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: '12345' } });

    fireEvent.click(submitButton());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
    expect(auth.completeFirstAccessPassword).not.toHaveBeenCalled();
  });

  it('rejeita quando as senhas não conferem', async () => {
    render(<OnboardingPasswordView />);

    fireEvent.change(newPasswordInput(), { target: { value: 'MinhaSenhaSegura123!' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'OutraSenhaDiferente' } });

    expect(screen.getByText('As senhas não coincidem')).toBeTruthy();

    fireEvent.click(submitButton());

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    expect(auth.completeFirstAccessPassword).not.toHaveBeenCalled();
  });

  it('chama completeFirstAccessPassword e onSuccess quando o formulário é válido', async () => {
    const onSuccess = vi.fn();
    render(<OnboardingPasswordView onSuccess={onSuccess} />);

    fireEvent.change(newPasswordInput(), { target: { value: 'MinhaNovaSenhaForte2026!' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'MinhaNovaSenhaForte2026!' } });

    expect(screen.getByText(/Mínimo de 6 caracteres/)).toBeTruthy();
    expect(screen.getByText('As senhas conferem ✓')).toBeTruthy();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(auth.completeFirstAccessPassword).toHaveBeenCalledWith('MinhaNovaSenhaForte2026!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('exibe erro traduzido se completeFirstAccessPassword falhar', async () => {
    auth.completeFirstAccessPassword.mockRejectedValue(new Error('Password should be at least 6 characters'));
    render(<OnboardingPasswordView />);

    fireEvent.change(newPasswordInput(), { target: { value: 'SenhaValidaParaForm123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'SenhaValidaParaForm123' } });

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
    });
  });

  it('permite que o usuário saia da conta clicando em Sair da conta', async () => {
    render(<OnboardingPasswordView />);

    fireEvent.click(logoutButton());

    await waitFor(() => {
      expect(auth.logout).toHaveBeenCalled();
    });
  });
});
