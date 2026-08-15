import { describe, expect, it } from 'vitest';
import { getRecurrenceDate, getTransactionEntryType, projectTransactions } from './finance';
import { FinancialGroup, TransactionType } from './types';

describe('finance contracts', () => {
  it('preserves legacy classification while exposing EntryType', () => {
    expect(getTransactionEntryType({ id: 'income', date: '2026-01-01', description: '', amount: 1, entryType: 'EXPENSE', type: TransactionType.INCOME, comment: '' })).toBe('EXPENSE');
    expect(getTransactionEntryType({ id: 'saving', date: '2026-01-01', description: '', amount: 1, financialGroup: FinancialGroup.SAVINGS, comment: '' } as never)).toBe('SAVINGS');
  });

  it('projects a counted recurrence including the original occurrence', () => {
    const transaction = { id: 'recurring', date: '2026-01-01', description: 'Teste', amount: 10, entryType: 'EXPENSE' as const, comment: '', recurrenceFrequency: 'MONTHLY' as const, recurrenceEndMode: 'COUNT' as const, recurrenceCount: 2 };
    expect(projectTransactions([transaction], '2026-01-01', '2026-04-30')).toHaveLength(3);
  });

  it('keeps month-end recurrence dates valid', () => {
    expect(getRecurrenceDate('2026-01-31', 'MONTHLY', 1)).toBe('2026-02-28');
  });
});
