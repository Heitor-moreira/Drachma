import { describe, expect, it } from 'vitest';
import { filterRecentTransactions } from './recentTransactions';

describe('filterRecentTransactions', () => {
  it('filters by selected month and type while sorting newest first', () => {
    const result = filterRecentTransactions([
      { id: 'old', date: '2026-08-02', description: 'Saída', amount: 20, entryType: 'EXPENSE', comment: '' },
      { id: 'new', date: '2026-08-20', description: 'Entrada', amount: 40, entryType: 'INCOME', comment: '' },
      { id: 'other-month', date: '2026-09-01', description: 'Fora', amount: 30, entryType: 'INCOME', comment: '' },
    ], [], 2026, 7, 'INCOME');

    expect(result.map(transaction => transaction.id)).toEqual(['new']);
  });
});
