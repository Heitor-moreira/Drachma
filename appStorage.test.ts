import { describe, expect, it } from 'vitest';
import { normalizeSnapshot, validateSnapshot } from './appStorage';

describe('app storage contracts', () => {
  it('rejects imports without a transaction array', () => {
    expect(validateSnapshot({})).toBe(false);
    expect(() => normalizeSnapshot({})).toThrow('Arquivo inválido');
  });

  it('normalizes valid imported transactions without changing financial fields', () => {
    const result = normalizeSnapshot({ transactions: [{ id: '1', date: '2026-01-01', description: 'Teste', amount: 20, type: 'INCOME', comment: '' }] });
    expect(result.transactions?.[0].entryType).toBe('INCOME');
    expect(result.transactions?.[0].amount).toBe(20);
  });
});
