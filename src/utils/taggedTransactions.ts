import { CreditCard, EntryType, Transaction } from '../types';
import { getTransactionEntryType, projectTransactions } from './finance';

export type TaggedTypeFilter = EntryType | 'ALL';

export const normalizeTag = (tag: string) => tag.trim().replace(/^#/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export const uniqueTransactionTags = (transactions: Transaction[]) => Array.from(new Set(transactions.flatMap(transaction => (transaction.tags || []).map(normalizeTag)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const filterTaggedTransactions = (transactions: Transaction[], cards: CreditCard[], year: number, month: number, type: TaggedTypeFilter, tag: string) => {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  const selectedTag = normalizeTag(tag);
  return projectTransactions(transactions, start, end, cards)
    .filter(transaction => transaction.tags?.some(item => !selectedTag || selectedTag === 'all' || normalizeTag(item).includes(selectedTag)))
    .filter(transaction => type === 'ALL' || getTransactionEntryType(transaction) === type)
    .sort((a, b) => b.date.localeCompare(a.date));
};

export const transactionHasTag = (transaction: Transaction, targetTag: string): boolean => {
  const normalizedTarget = normalizeTag(targetTag);
  if (!normalizedTarget) return false;
  return Boolean(transaction.tags?.some(tag => normalizeTag(tag) === normalizedTarget));
};

export const sortTagTotals = (
  tags: { name: string; total: number }[],
  mode: 'alpha' | 'value',
  direction: 'asc' | 'desc'
): { name: string; total: number }[] => {
  return [...tags].sort((a, b) => {
    if (mode === 'value') {
      if (a.total !== b.total) {
        return direction === 'desc' ? b.total - a.total : a.total - b.total;
      }
      return a.name.localeCompare(b.name);
    }
    return direction === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
  });
};
