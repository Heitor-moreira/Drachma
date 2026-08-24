import { CreditCard, EntryType, Transaction } from './types';
import { getTransactionEntryType, projectTransactions } from './finance';

export type RecentSortDirection = 'ASC' | 'DESC';

export const normalizeDescriptionSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export const filterRecentTransactions = (
  transactions: Transaction[],
  cards: CreditCard[],
  type: EntryType | 'ALL',
  direction: RecentSortDirection = 'DESC',
  descriptionSearch = ''
) => {
  const normalizedSearch = normalizeDescriptionSearch(descriptionSearch.trim());
  const result = projectTransactions(transactions, '0000-01-01', '9999-12-31', cards)
    .filter(transaction => type === 'ALL' || getTransactionEntryType(transaction) === type)
    .filter(transaction => !normalizedSearch || normalizeDescriptionSearch(transaction.description).includes(normalizedSearch))
    .sort((a, b) => {
      const aDate = a.createdAt || a.date;
      const bDate = b.createdAt || b.date;
      const comparison = aDate.localeCompare(bDate);
      return direction === 'DESC' ? -comparison : comparison;
    });
  return result;
};

export const getOccurrenceLabel = (transaction: Transaction) => {
  if (transaction.isInstallment && transaction.installmentInfo) return `[${transaction.installmentInfo.current}/${transaction.installmentInfo.total}]`;
  if (transaction.recurrenceIndex !== undefined && transaction.recurrenceTotal !== undefined) return `[${transaction.recurrenceIndex + 1}/${transaction.recurrenceTotal}]`;
  return '';
};
