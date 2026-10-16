export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;
export const PROVISIONAL_DEFAULT_PASSWORD = 'senhapadrao123';

export interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface PasswordValidationOptions {
  disallowDefaultPassword?: boolean;
}

export const validateNewPassword = (
  newPassword: string,
  confirmPassword?: string,
  options?: PasswordValidationOptions
): PasswordValidationResult => {
  if (!newPassword) {
    return { isValid: false, error: 'A senha é obrigatória.' };
  }

  if (options?.disallowDefaultPassword && newPassword === PROVISIONAL_DEFAULT_PASSWORD) {
    return {
      isValid: false,
      error: 'A nova senha não pode ser a senha padrão provisória.',
    };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { isValid: false, error: 'As senhas não conferem.' };
  }

  return { isValid: true, error: null };
};
