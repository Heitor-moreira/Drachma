import { CreditCard, EntryType, Transaction } from './types';
import { getTransactionEntryType, projectTransactions } from './finance';

export const filterRecentTransactions = (
  transactions: Transaction[],
  cards: CreditCard[],
  year: number,
  month: number,
  type: EntryType | 'ALL'
) => {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return projectTransactions(transactions, start, end, cards)
    .filter(transaction => type === 'ALL' || getTransactionEntryType(transaction) === type)
    .sort((a, b) => b.date.localeCompare(a.date));
};
