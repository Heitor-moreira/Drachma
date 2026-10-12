import { describe, it, expect } from 'vitest';
import { translateAuthError } from './authErrors';

describe('authErrors — translateAuthError', () => {
  describe('Padrões de login e recuperação por e-mail', () => {
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
      ['Failed to fetch', 'Erro de conexão. Verifique sua internet e tente novamente.'],
    ])('traduz "%s" para "%s"', (raw, expected) => {
      expect(translateAuthError(new Error(raw))).toBe(expected);
    });
  });

  describe('Google OAuth e provedores externos', () => {
    it('traduz provider is not enabled e Unsupported provider', () => {
      expect(translateAuthError('Unsupported provider: provider is not enabled')).toBe(
        'Login com Google indisponível no momento. Use e-mail e senha ou contate o administrador.'
      );
      expect(translateAuthError(new Error('validation_failed: provider is not enabled'))).toBe(
        'Login com Google indisponível no momento. Use e-mail e senha ou contate o administrador.'
      );
      expect(translateAuthError('provider_disabled')).toBe(
        'Login com Google indisponível no momento. Use e-mail e senha ou contate o administrador.'
      );
    });

    it('traduz Signups not allowed e signup_disabled', () => {
      expect(translateAuthError('Signups not allowed for this instance')).toBe(
        'Esta conta Google não tem acesso ao Drachma. Solicite acesso ou entre com o e-mail cadastrado.'
      );
      expect(translateAuthError(new Error('signup_disabled'))).toBe(
        'Esta conta Google não tem acesso ao Drachma. Solicite acesso ou entre com o e-mail cadastrado.'
      );
    });

    it('traduz cancelamento do usuário no OAuth', () => {
      expect(translateAuthError('access_denied', { context: 'oauth' })).toBe(
        'Login com Google cancelado.'
      );
      expect(translateAuthError(new Error('user cancelled'))).toBe(
        'Login com Google cancelado.'
      );
      expect(translateAuthError('The user denied the request')).toBe(
        'Login com Google cancelado.'
      );
      expect(translateAuthError('user_denied')).toBe(
        'Login com Google cancelado.'
      );
    });

    it('traduz access_denied em recuperação de senha vs oauth', () => {
      expect(translateAuthError('access_denied', { context: 'recovery' })).toBe(
        'Acesso não autorizado ou link inválido. Solicite uma nova recuperação.'
      );
      expect(translateAuthError('access_denied')).toBe(
        'Acesso não autorizado ou link inválido. Solicite uma nova recuperação.'
      );
    });

    it('traduz user_banned', () => {
      expect(translateAuthError('user_banned')).toBe(
        'Conta bloqueada. Contate o administrador.'
      );
    });

    it('traduz falha genérica de provedor oauth', () => {
      expect(translateAuthError('oauth_provider_error')).toBe(
        'Não foi possível concluir o login com o Google. Tente novamente.'
      );
      expect(translateAuthError('server_error', { context: 'oauth' })).toBe(
        'Não foi possível concluir o login com o Google. Tente novamente.'
      );
    });
  });

  describe('Proteção contra vazamento de JSON cru', () => {
    it('nunca repassa mensagens em formato JSON cru ou com tags de erro de servidor', () => {
      expect(translateAuthError('{"code": 400, "message": "unknown error"}')).toBe(
        'Ocorreu um erro ao processar. Tente novamente.'
      );
      expect(translateAuthError('{"error": "something_bad"}')).toBe(
        'Ocorreu um erro ao processar. Tente novamente.'
      );
      expect(translateAuthError('[{"error_code": 500}]')).toBe(
        'Ocorreu um erro ao processar. Tente novamente.'
      );
    });

    it('retorna mensagem original limpa caso não encontre padrão conhecido', () => {
      expect(translateAuthError('Mensagem personalizada legível')).toBe('Mensagem personalizada legível');
    });

    it('retorna mensagem genérica para strings vazias', () => {
      expect(translateAuthError('')).toBe('Ocorreu um erro ao processar. Tente novamente.');
      expect(translateAuthError(null)).toBe('Ocorreu um erro ao processar. Tente novamente.');
    });
  });
});
