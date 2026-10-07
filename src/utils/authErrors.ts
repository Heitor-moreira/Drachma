export const translateAuthError = (err: any): string => {
  const message = typeof err === 'string' ? err : String(err?.message || '');

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

  return message || 'Ocorreu um erro ao processar. Tente novamente.';
};
