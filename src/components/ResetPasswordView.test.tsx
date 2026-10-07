// @vitest-environment jsdom
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordView from './ResetPasswordView';

const auth = {
  updatePassword: vi.fn(),
  isLoading: false,
  session: null as any,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => auth,
}));

beforeEach(() => {
  auth.updatePassword = vi.fn().mockResolvedValue(undefined);
  auth.isLoading = false;
  auth.session = { user: { id: 'test-user-id' } };
  window.location.hash = '';
  window.location.search = '';
});

afterEach(cleanup);

const newPasswordInput = () => screen.getByLabelText('Nova senha') as HTMLInputElement;
const confirmPasswordInput = () => screen.getByLabelText('Confirmar nova senha') as HTMLInputElement;
const submitButton = () => screen.getByRole('button', { name: /Salvar nova senha/ });

describe('ResetPasswordView — Fluxo e validações', () => {
  it('exibe estado de carregamento quando a autenticação está carregando', () => {
    auth.isLoading = true;
    render(<ResetPasswordView />);
    expect(screen.getByText('Validando link de recuperação...')).toBeTruthy();
  });

  it('exibe aviso de link inválido/expirado quando não há sessão ativa', () => {
    auth.session = null;
    auth.isLoading = false;
    render(<ResetPasswordView />);
    expect(screen.getByText('Link inválido ou expirado')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voltar e solicitar novo link/ })).toBeTruthy();
  });

  it('exibe erro de URL quando o hash indica token expirado', () => {
    window.location.hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    render(<ResetPasswordView />);
    expect(screen.getByText('Link inválido ou expirado')).toBeTruthy();
  });

  it('renderiza o formulário normalmente quando há sessão ativa', () => {
    render(<ResetPasswordView />);
    expect(newPasswordInput()).toBeTruthy();
    expect(confirmPasswordInput()).toBeTruthy();
    expect(submitButton()).toBeTruthy();
  });

  it('exige senha com no mínimo 6 caracteres', async () => {
    render(<ResetPasswordView />);
    fireEvent.change(newPasswordInput(), { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: '123' } });
    fireEvent.click(submitButton());

    expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('exige que as senhas sejam idênticas', async () => {
    render(<ResetPasswordView />);
    fireEvent.change(newPasswordInput(), { target: { value: 'senha123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'senhaDiferente' } });
    fireEvent.click(submitButton());

    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('alterna a visibilidade da senha ao clicar no botão de olho', () => {
    render(<ResetPasswordView />);
    const toggleButton = screen.getByLabelText('Exibir nova senha');
    expect(newPasswordInput().type).toBe('password');

    fireEvent.click(toggleButton);
    expect(newPasswordInput().type).toBe('text');

    fireEvent.click(screen.getByLabelText('Ocultar nova senha'));
    expect(newPasswordInput().type).toBe('password');
  });

  it('chama updatePassword com sucesso e exibe mensagem de confirmação', async () => {
    render(<ResetPasswordView />);
    fireEvent.change(newPasswordInput(), { target: { value: 'novasenha123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'novasenha123' } });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(auth.updatePassword).toHaveBeenCalledWith('novasenha123');
      expect(screen.getByText('Senha atualizada!')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Ir para o login/ })).toBeTruthy();
    });
  });

  it('trata e traduz erro retornado pelo Supabase', async () => {
    auth.updatePassword = vi.fn().mockRejectedValue(new Error('Password should be at least 6 characters'));
    render(<ResetPasswordView />);
    fireEvent.change(newPasswordInput(), { target: { value: 'senhaValida123' } });
    fireEvent.change(confirmPasswordInput(), { target: { value: 'senhaValida123' } });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
    });
  });
});
