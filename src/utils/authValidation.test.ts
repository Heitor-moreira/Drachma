import { describe, it, expect } from 'vitest';
import { validateNewPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './authValidation';

describe('authValidation — validateNewPassword', () => {
  it('rejeita senha vazia', () => {
    const res = validateNewPassword('');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('A senha é obrigatória.');
  });

  it('rejeita senha menor que MIN_PASSWORD_LENGTH', () => {
    const res = validateNewPassword('12345');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(`A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
  });

  it('rejeita senha maior que MAX_PASSWORD_LENGTH', () => {
    const longPassword = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);
    const res = validateNewPassword(longPassword);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(`A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);
  });

  it('rejeita quando confirmação não confere', () => {
    const res = validateNewPassword('senhaForte123', 'outraSenha456');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('As senhas não conferem.');
  });

  it('aprova senha válida e que confere', () => {
    const res = validateNewPassword('senhaForte123', 'senhaForte123');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeNull();
  });
});
