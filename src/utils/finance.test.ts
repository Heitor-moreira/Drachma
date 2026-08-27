import { describe, expect, it } from 'vitest';
import { getRecurrenceDate, getTransactionEntryType, groupTransactionsByDate, projectTransactions, projectTransactionsWithBalance } from './finance';
import { FinancialGroup, Transaction, TransactionType } from '../types';

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

  it('groups projected transactions by date without changing their order', () => {
    const projected: Transaction[] = [
      { id: 'a', date: '2026-01-02', description: 'A', amount: 10 },
      { id: 'b', date: '2026-01-01', description: 'B', amount: 20 },
      { id: 'c', date: '2026-01-02', description: 'C', amount: 30 },
    ] as never;

    const grouped = groupTransactionsByDate(projected);

    expect([...grouped.keys()]).toEqual(['2026-01-02', '2026-01-01']);
    expect(grouped.get('2026-01-02')?.map(transaction => transaction.id)).toEqual(['a', 'c']);
    expect(grouped.get('2026-01-01')?.map(transaction => transaction.id)).toEqual(['b']);
  });

  it('preserves all transactions when grouping mixed financial entries', () => {
    const projected = [
      { id: 'income', date: '2026-01-01', description: 'Entrada', amount: 100, entryType: 'INCOME', comment: '' },
      { id: 'expense', date: '2026-01-01', description: 'Saída', amount: 40, entryType: 'EXPENSE', comment: '' },
      { id: 'saving', date: '2026-01-03', description: 'Economia', amount: 20, entryType: 'SAVINGS', comment: '' },
      { id: 'card', date: '2026-01-05', description: 'Cartão', amount: 10, entryType: 'CARD', comment: '' },
    ] as Transaction[];
    const grouped = groupTransactionsByDate(projected);

    expect([...grouped.values()].flat()).toEqual(projected);
    expect(grouped.get('2026-01-02')).toBeUndefined();
    expect(grouped.get('2026-01-01')?.map(transaction => transaction.entryType)).toEqual(['INCOME', 'EXPENSE']);
  });

  it('returns the same interval projection and the accumulated impact before its start', () => {
    const transactions = [
      { id: 'income', date: '2026-01-01', description: 'Entrada', amount: 100, entryType: 'INCOME' as const, comment: '' },
      { id: 'expense', date: '2026-01-02', description: 'Saída', amount: 40, entryType: 'EXPENSE' as const, comment: '' },
      { id: 'recurring', date: '2025-12-01', description: 'Recorrente', amount: 10, entryType: 'EXPENSE' as const, comment: '', recurrenceFrequency: 'MONTHLY' as const, recurrenceEndMode: 'COUNT' as const, recurrenceCount: 2 },
    ];
    const result = projectTransactionsWithBalance(transactions, '2026-01-01', '2026-02-28');
    const expected = projectTransactions(transactions, '2026-01-01', '2026-02-28');

    expect(result.transactions).toEqual(expected);
    expect(result.beforeStartBalanceDelta).toBe(-10);
  });
});
