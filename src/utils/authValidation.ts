export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;

export interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
}

export const validateNewPassword = (
  newPassword: string,
  confirmPassword?: string
): PasswordValidationResult => {
  if (!newPassword) {
    return { isValid: false, error: 'A senha é obrigatória.' };
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
