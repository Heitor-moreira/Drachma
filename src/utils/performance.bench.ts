import { bench, describe } from 'vitest';
import { createSnapshot } from './appStorage';
import { filterRecentTransactions } from './recentTransactions';
import { Transaction } from '../types';

const transactions: Transaction[] = Array.from({ length: 1000 }, (_, index) => ({
  id: `fixture-${index}`,
  date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
  description: `Lançamento de teste ${index}`,
  amount: index + 1,
  entryType: index % 4 === 0 ? 'INCOME' : index % 4 === 1 ? 'SAVINGS' : index % 4 === 2 ? 'CARD' : 'EXPENSE',
  comment: '',
  tags: index % 5 === 0 ? ['fixture', 'performance'] : [],
}));

const state = {
  transactions,
  subscriptions: [],
  initialBalance: { amount: 0, date: '2026-01-01' },
  salaryInfo: { gross: 0, discounts: [] },
  dateRange: { start: '2026-01-01', end: '2026-01-31' },
  settings: { currency: 'BRL' as const, userName: '', userPhoto: '', theme: 'light' as const },
  cards: [],
};

describe('Drachma etapa 4 performance measurements', () => {
  bench('filters and sorts 1000 recent transactions', () => {
    filterRecentTransactions(transactions, [], 'ALL', 'DESC', 'teste 99');
  });

  bench('serializes a 1000-transaction snapshot', () => {
    JSON.stringify(createSnapshot(state));
  });
});
