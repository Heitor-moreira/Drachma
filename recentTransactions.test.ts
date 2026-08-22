import { describe, expect, it } from 'vitest';
import { filterRecentTransactions, getOccurrenceLabel } from './recentTransactions';

describe('filterRecentTransactions', () => {
  it('filters by type while sorting by creation date descending by default', () => {
    const result = filterRecentTransactions([
      { id: 'old', date: '2026-08-02', createdAt: '2026-08-01T10:00:00.000Z', description: 'Saída', amount: 20, entryType: 'EXPENSE', comment: '' },
      { id: 'new', date: '2026-08-20', createdAt: '2026-08-03T10:00:00.000Z', description: 'Entrada', amount: 40, entryType: 'INCOME', comment: '' },
      { id: 'other-date', date: '2026-09-01', createdAt: '2026-08-02T10:00:00.000Z', description: 'Fora', amount: 30, entryType: 'INCOME', comment: '' },
    ], [], 'INCOME', 'DESC');

    expect(result.map(transaction => transaction.id)).toEqual(['new', 'other-date']);
  });

  it('supports ascending creation-date order', () => {
    const result = filterRecentTransactions([
      { id: 'old', date: '2026-08-02', createdAt: '2026-08-01T10:00:00.000Z', description: 'Saída', amount: 20, entryType: 'EXPENSE', comment: '' },
      { id: 'new', date: '2026-08-20', createdAt: '2026-08-03T10:00:00.000Z', description: 'Entrada', amount: 40, entryType: 'INCOME', comment: '' },
    ], [], 'ALL', 'ASC');

    expect(result.map(transaction => transaction.id)).toEqual(['old', 'new']);
  });

  it('formats recurrence and installment occurrence labels after the description', () => {
    expect(getOccurrenceLabel({ id: 'installment', date: '2026-08-01', description: 'Mercado', amount: 20, entryType: 'EXPENSE', comment: '', isInstallment: true, installmentInfo: { current: 2, total: 3, purchaseId: 'purchase' } })).toBe('[2/3]');
    expect(getOccurrenceLabel({ id: 'recurrence', date: '2026-08-01', description: 'Conta', amount: 20, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 2, recurrenceIndex: 1, recurrenceTotal: 3 })).toBe('[2/3]');
  });
});
