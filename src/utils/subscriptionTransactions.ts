import { Transaction, CreditCard } from '../types';
import { projectTransactions } from './finance';
import { normalizeTag } from './taggedTransactions';

export interface SubscriptionMonthSummary {
  totalAmount: number;
  activeCount: number;
  transactions: Transaction[];
  byCategory: Record<string, number>;
}

export const getSubscriptionSummaryForMonth = (
  transactions: Transaction[],
  cards: CreditCard[],
  year: number,
  month: number
): SubscriptionMonthSummary => {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const projected = projectTransactions(transactions, start, end, cards);
  
  const subscriptionTransactions = projected.filter(t => 
    t.tags && t.tags.some(tag => normalizeTag(tag) === 'assinatura')
  );

  let totalAmount = 0;
  const uniqueServices = new Set<string>();
  const byCategory: Record<string, number> = {};

  for (const t of subscriptionTransactions) {
    totalAmount += t.amount;
    uniqueServices.add(t.description.trim().toLowerCase());
    
    // Find category tag (any tag that is not 'assinatura')
    const categoryTag = t.tags?.find(tag => normalizeTag(tag) !== 'assinatura') || 'outros';
    const normalizedCategory = normalizeTag(categoryTag);
    byCategory[normalizedCategory] = (byCategory[normalizedCategory] || 0) + t.amount;
  }

  return {
    totalAmount,
    activeCount: uniqueServices.size,
    transactions: subscriptionTransactions.sort((a, b) => b.amount - a.amount),
    byCategory
  };
};
