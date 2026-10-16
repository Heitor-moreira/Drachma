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

  it('filters descriptions partially without case or accent sensitivity', () => {
    const result = filterRecentTransactions([
      { id: 'market', date: '2026-08-22', description: 'Mercado', amount: 120, entryType: 'EXPENSE', comment: '' },
      { id: 'spotify', date: '2026-08-21', description: 'Assinatura Spotify', amount: 21.9, entryType: 'EXPENSE', comment: '' },
    ], [], 'ALL', 'DESC', 'MERCÁ');

    expect(result.map(transaction => transaction.id)).toEqual(['market']);
  });

  it('sorts by creation date vs transaction date depending on dateCriteria', () => {
    const transactions = [
      { id: 't-created-early-date-late', date: '2026-08-25', createdAt: '2026-08-01T10:00:00.000Z', description: 'Item 1', amount: 50, entryType: 'EXPENSE' as const, comment: '' },
      { id: 't-created-late-date-early', date: '2026-08-10', createdAt: '2026-08-15T10:00:00.000Z', description: 'Item 2', amount: 30, entryType: 'EXPENSE' as const, comment: '' },
    ];

    // By CREATION_DATE DESC: t-created-late-date-early (Aug 15) comes before t-created-early-date-late (Aug 01)
    const byCreationDesc = filterRecentTransactions(transactions, [], 'ALL', 'DESC', '', 'CREATION_DATE');
    expect(byCreationDesc.map(t => t.id)).toEqual(['t-created-late-date-early', 't-created-early-date-late']);

    // By CREATION_DATE ASC: t-created-early-date-late (Aug 01) comes before t-created-late-date-early (Aug 15)
    const byCreationAsc = filterRecentTransactions(transactions, [], 'ALL', 'ASC', '', 'CREATION_DATE');
    expect(byCreationAsc.map(t => t.id)).toEqual(['t-created-early-date-late', 't-created-late-date-early']);

    // By TRANSACTION_DATE DESC: t-created-early-date-late (Aug 25) comes before t-created-late-date-early (Aug 10)
    const byTransactionDesc = filterRecentTransactions(transactions, [], 'ALL', 'DESC', '', 'TRANSACTION_DATE');
    expect(byTransactionDesc.map(t => t.id)).toEqual(['t-created-early-date-late', 't-created-late-date-early']);

    // By TRANSACTION_DATE ASC: t-created-late-date-early (Aug 10) comes before t-created-early-date-late (Aug 25)
    const byTransactionAsc = filterRecentTransactions(transactions, [], 'ALL', 'ASC', '', 'TRANSACTION_DATE');
    expect(byTransactionAsc.map(t => t.id)).toEqual(['t-created-late-date-early', 't-created-early-date-late']);
  });

  it('formats recurrence and installment occurrence labels after the description', () => {
    expect(getOccurrenceLabel({ id: 'installment', date: '2026-08-01', description: 'Mercado', amount: 20, entryType: 'EXPENSE', comment: '', isInstallment: true, installmentInfo: { current: 2, total: 3, purchaseId: 'purchase' } })).toBe('[2/3]');
    expect(getOccurrenceLabel({ id: 'recurrence', date: '2026-08-01', description: 'Conta', amount: 20, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 2, recurrenceIndex: 1, recurrenceTotal: 3 })).toBe('[2/3]');
  });
});
