import { describe, it, expect } from 'vitest';
import { translateAuthError } from './authErrors';

describe('authErrors — translateAuthError', () => {
  it.each([
    ['Invalid login credentials', 'E-mail ou senha incorretos.'],
    ['invalid_credentials', 'E-mail ou senha incorretos.'],
    ['Email not confirmed', 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'],
    ['User not found', 'Usuário não encontrado.'],
    ['Password should be at least 6 characters', 'A senha deve ter no mínimo 6 caracteres.'],
    ['over_email_send_rate_limit', 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.'],
    ['Supabase não configurado.', 'Serviço de autenticação não configurado no momento.'],
    ['Auth session missing', 'Link de recuperação inválido ou expirado. Solicite um novo e-mail de recuperação.'],
    ['same password', 'Escolha uma senha diferente da anterior.'],
    ['weak_password', 'A senha informada é considerada fraca. Escolha uma senha mais segura.'],
    ['otp_expired', 'Este link de recuperação expirou. Solicite um novo e-mail.'],
    ['access_denied', 'Acesso não autorizado ou link inválido. Solicite uma nova recuperação.'],
    ['Failed to fetch', 'Erro de conexão. Verifique sua internet e tente novamente.'],
  ])('traduz "%s" para "%s"', (raw, expected) => {
    expect(translateAuthError(new Error(raw))).toBe(expected);
  });

  it('retorna mensagem original caso não encontre padrão conhecido', () => {
    expect(translateAuthError('Mensagem personalizada')).toBe('Mensagem personalizada');
  });
});
