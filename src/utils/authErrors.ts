export interface TranslateAuthErrorOptions {
  context?: 'oauth' | 'recovery' | 'login';
}

export const translateAuthError = (err: any, options?: TranslateAuthErrorOptions): string => {
  const message = typeof err === 'string' ? err : String(err?.message || err?.error_description || '');

  // 1. Mapeamentos específicos do Google OAuth
  if (
    message.includes('provider is not enabled') ||
    message.includes('Unsupported provider') ||
    message.includes('provider_disabled')
  ) {
    return 'Login com Google indisponível no momento. Use e-mail e senha ou contate o administrador.';
  }

  if (
    message.includes('Signups not allowed') ||
    message.includes('signup_disabled') ||
    message.includes('signups_not_allowed')
  ) {
    return 'Esta conta Google não tem acesso ao Drachma. Solicite acesso ou entre com o e-mail cadastrado.';
  }

  if (
    message.includes('user cancelled') ||
    message.includes('The user denied') ||
    message.includes('user_denied') ||
    (options?.context === 'oauth' && message.includes('access_denied'))
  ) {
    return 'Login com Google cancelado.';
  }

  if (message.includes('user_banned')) {
    return 'Conta bloqueada. Contate o administrador.';
  }

  if (
    message.includes('oauth_provider_error') ||
    (options?.context === 'oauth' && (message.includes('server_error') || message.includes('validation_failed')))
  ) {
    return 'Não foi possível concluir o login com o Google. Tente novamente.';
  }

  // 2. Mapeamentos de credenciais e e-mail
  if (
    message.includes('Invalid login credentials') ||
    message.includes('invalid_credentials')
  ) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
  }
  if (message.includes('User not found')) {
    return 'Usuário não encontrado.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (
    message.includes('rate limit') ||
    message.includes('over_email_send_rate_limit')
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
  }
  if (message.includes('Supabase não configurado')) {
    return 'Serviço de autenticação não configurado no momento.';
  }
  if (
    message.includes('Auth session missing') ||
    message.includes('session missing') ||
    message.includes('session_missing')
  ) {
    return 'Link de recuperação inválido ou expirado. Solicite um novo e-mail de recuperação.';
  }
  if (
    message.includes('same password') ||
    message.includes('same_password') ||
    message.includes('New password should be different')
  ) {
    return 'Escolha uma senha diferente da anterior.';
  }
  if (message.includes('weak_password')) {
    return 'A senha informada é considerada fraca. Escolha uma senha mais segura.';
  }
  if (
    message.includes('otp_expired') ||
    message.includes('Email link is invalid or has expired') ||
    message.includes('Token has expired')
  ) {
    return 'Este link de recuperação expirou. Solicite um novo e-mail.';
  }
  if (message.includes('access_denied')) {
    return 'Acesso não autorizado ou link inválido. Solicite uma nova recuperação.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // 3. Fallback: Nunca exibir JSON ou mensagens cruas com objetos
  const trimmed = message.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.includes('"error":') || trimmed.includes('"error_code":')) {
    return 'Ocorreu um erro ao processar. Tente novamente.';
  }

  return message || 'Ocorreu um erro ao processar. Tente novamente.';
};
