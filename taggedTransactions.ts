import { CreditCard, EntryType, Transaction } from './types';
import { getTransactionEntryType, projectTransactions } from './finance';

export type TaggedTypeFilter = EntryType | 'ALL';

export const normalizeTag = (tag: string) => tag.trim().replace(/^#/, '').toLocaleLowerCase();

export const uniqueTransactionTags = (transactions: Transaction[]) => Array.from(new Set(transactions.flatMap(transaction => (transaction.tags || []).map(normalizeTag)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const filterTaggedTransactions = (transactions: Transaction[], cards: CreditCard[], year: number, month: number, type: TaggedTypeFilter, tag: string) => {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  const selectedTag = normalizeTag(tag);
  return projectTransactions(transactions, start, end, cards)
    .filter(transaction => transaction.tags?.some(item => !selectedTag || selectedTag === 'all' || normalizeTag(item) === selectedTag))
    .filter(transaction => type === 'ALL' || getTransactionEntryType(transaction) === type)
    .sort((a, b) => b.date.localeCompare(a.date));
};
