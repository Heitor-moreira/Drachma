import { describe, expect, it } from 'vitest';
import { filterTaggedTransactions, normalizeTag } from './taggedTransactions';

const base = { amount: 10, comment: '', entryType: 'EXPENSE' as const };

describe('filterTaggedTransactions', () => {
  it('normalizes displayed tag names to lowercase without the hash prefix', () => {
    expect(normalizeTag('#INVESTIMENTO')).toBe('investimento');
  });

  it('combines period, type and normalized tag and excludes untagged entries', () => {
    const result = filterTaggedTransactions([
      { ...base, id: 'match', date: '2026-08-20', description: 'Mercado', tags: [' Alimentação '] },
      { ...base, id: 'wrong-type', date: '2026-08-20', description: 'Entrada', entryType: 'INCOME', tags: ['alimentação'] },
      { ...base, id: 'wrong-tag', date: '2026-08-20', description: 'Lazer', tags: ['Lazer'] },
      { ...base, id: 'untagged', date: '2026-08-20', description: 'Sem tag' },
      { ...base, id: 'wrong-month', date: '2026-09-20', description: 'Fora', tags: ['alimentação'] },
    ], [], 2026, 7, 'EXPENSE', 'alimentação');
    expect(result.map(transaction => transaction.id)).toEqual(['match']);
  });

  it('filters tags partially without case or accent sensitivity', () => {
    const result = filterTaggedTransactions([
      { ...base, id: 'food', date: '2026-08-20', description: 'Mercado', tags: ['Alimentação'] },
      { ...base, id: 'fun', date: '2026-08-20', description: 'Cinema', tags: ['Lazer'] },
    ], [], 2026, 7, 'ALL', 'ALIMEN');

    expect(result.map(transaction => transaction.id)).toEqual(['food']);
  });

  it('includes tagged recurring projections and installments in the selected month', () => {
    const result = filterTaggedTransactions([{ ...base, id: 'recurring', date: '2026-07-20', description: 'Recorrente', tags: ['fixo'], recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 2 }], [], 2026, 7, 'ALL', 'ALL');
    expect(result.map(transaction => transaction.date)).toEqual(['2026-08-20']);
  });
});
