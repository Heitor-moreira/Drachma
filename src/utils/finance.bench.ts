import { bench, describe } from 'vitest';
import { groupTransactionsByDate, projectTransactions, projectTransactionsWithBalance } from './finance';
import { Transaction } from '../types';

const transactions: Transaction[] = [
  { id: 'income', date: '2024-01-15', description: 'Salário', amount: 5000, entryType: 'INCOME', comment: '', recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 24 },
  { id: 'expense', date: '2024-01-05', description: 'Aluguel', amount: 1800, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 24 },
  { id: 'weekly', date: '2024-01-07', description: 'Feira', amount: 120, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'WEEKLY', recurrenceEndMode: 'COUNT', recurrenceCount: 104, recurrenceExcludedDates: ['2024-02-04'] },
  { id: 'daily', date: '2024-01-01', description: 'Transporte', amount: 10, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'DAILY', recurrenceEndMode: 'COUNT', recurrenceCount: 365 },
  { id: 'saving', date: '2024-01-20', description: 'Reserva', amount: 500, entryType: 'SAVINGS', comment: '', recurrenceFrequency: 'YEARLY', recurrenceEndMode: 'COUNT', recurrenceCount: 2 },
  { id: 'card', date: '2024-01-25', description: 'Compra cartão', amount: 300, entryType: 'CARD', comment: '', cardId: 'card-1', isInstallment: true, installmentInfo: { current: 1, total: 3, purchaseId: 'purchase-1' } },
];
const projected = projectTransactions(transactions, '2024-01-01', '2026-12-31');

const groupTransactionsByDateReference = (items: Transaction[], date: string) => items.filter(transaction => transaction.date === date);

describe('finance performance baseline', () => {
  bench('projects the deterministic financial fixture', () => {
    projectTransactions(transactions.map(transaction => ({ ...transaction })), '2024-01-01', '2026-12-31', [{ id: 'card-1', name: 'Cartão', bank: 'Teste', type: 'CREDIT', dueDay: 10, closingDay: 1, limit: 10000, color: '#000000', isActive: true }]);
  });

  bench('projects the fixture with an incremental balance result', () => {
    projectTransactionsWithBalance(transactions.map(transaction => ({ ...transaction })), '2024-01-01', '2026-12-31');
  });

  bench('groups the projected fixture by date', () => {
    groupTransactionsByDate(projected);
  });

  bench('scans the projected fixture for one date (baseline reference)', () => {
    groupTransactionsByDateReference(projected, '2025-06-15');
  });
});
