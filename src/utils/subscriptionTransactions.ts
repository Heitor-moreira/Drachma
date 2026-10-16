import { Transaction, CreditCard, Subscription, SalaryInfo, SubscriptionCycle, SubscriptionPaymentType, SubscriptionStatus } from '../types';
import { projectTransactions, formatLocalDate } from './finance';
import { normalizeTag } from './taggedTransactions';
import { getNetSalary } from './salary';

export interface SubscriptionMonthSummary {
  totalAmount: number;
  activeCount: number;
  transactions: Transaction[];
  byCategory: Record<string, number>;
}

export interface SubscriptionMetrics {
  totalMonthly: number;
  annualProjection: number;
  incomePercentage: number | null;
  activeCount: number;
  totalCount: number;
}

export interface SubscriptionEvolutionMonth {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dez)
  monthLabel: string; // Ex: 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'
  yearLabel: string; // Ex: '2026'
  totalAmount: number;
  activeCount: number;
  isCurrentMonth: boolean;
}

export interface SubscriptionEvolution {
  months: SubscriptionEvolutionMonth[];
  maxAmount: number;
  minAmount: number;
  averageAmount: number;
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentageChange: number | null; // Variação vs mês anterior
}

export const normalizeSubscription = (sub: Partial<Subscription>): Subscription => {
  const id = sub.id || Math.random().toString(36).substring(2, 9);
  const name = sub.name?.trim() || 'Assinatura';
  const amount = typeof sub.amount === 'number' && !isNaN(sub.amount) ? Math.max(0, sub.amount) : 0;
  const dueDay = typeof sub.dueDay === 'number' && sub.dueDay >= 1 && sub.dueDay <= 31 ? Math.floor(sub.dueDay) : 1;
  const cycle: SubscriptionCycle = sub.cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';

  const paymentType: SubscriptionPaymentType =
    sub.paymentType === 'CREDIT_CARD' || (sub as { chargeType?: string }).chargeType === 'CARD'
      ? 'CREDIT_CARD'
      : 'DIRECT_DEBIT';

  let status: SubscriptionStatus = 'ACTIVE';
  if (sub.status === 'ACTIVE' || sub.status === 'PAUSED' || sub.status === 'CANCELED') {
    status = sub.status;
  } else if ((sub.status as unknown as string) === 'CANCELLED') {
    status = 'CANCELED';
  } else if (sub.isActive !== undefined) {
    status = sub.isActive ? 'ACTIVE' : 'PAUSED';
  }

  const isActive = status === 'ACTIVE';
  const startDate = sub.startDate || sub.createdAt?.slice(0, 10);

  return {
    id,
    name,
    amount,
    dueDay,
    cycle,
    paymentType,
    cardId: paymentType === 'CREDIT_CARD' ? sub.cardId : undefined,
    status,
    isActive,
    billingMonth: sub.billingMonth ?? (cycle === 'YEARLY' ? 1 : undefined),
    startDate,
    lastGeneratedDate: sub.lastGeneratedDate,
    pausedAt: sub.pausedAt,
    canceledAt: sub.canceledAt,
    serviceKey: sub.serviceKey,
    category: sub.category,
    userId: sub.userId,
    version: sub.version,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
    deletedAt: sub.deletedAt
  };
};

export const getSubscriptionMetrics = (
  subscriptions: Subscription[],
  salaryInfo?: SalaryInfo,
  baseSalary?: number
): SubscriptionMetrics => {
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE' && !s.deletedAt);

  const totalMonthly = activeSubs.reduce((acc, sub) => {
    return acc + (sub.cycle === 'YEARLY' ? sub.amount / 12 : sub.amount);
  }, 0);

  const annualProjection = activeSubs.reduce((acc, sub) => {
    return acc + (sub.cycle === 'YEARLY' ? sub.amount : sub.amount * 12);
  }, 0);

  const netSalary = getNetSalary(salaryInfo, baseSalary);
  const incomePercentage = netSalary > 0 ? (totalMonthly / netSalary) * 100 : null;

  return {
    totalMonthly,
    annualProjection,
    incomePercentage,
    activeCount: activeSubs.length,
    totalCount: subscriptions.filter(s => !s.deletedAt).length
  };
};

export const generateSubscriptionTransactions = (
  subscriptions: Subscription[],
  existingTransactions: Transaction[],
  today: Date = new Date()
): Transaction[] => {
  const todayStr = formatLocalDate(today);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const newTransactions: Transaction[] = [];
  const existingIds = new Set(existingTransactions.map(t => t.id));

  for (const rawSub of subscriptions) {
    const sub = normalizeSubscription(rawSub);
    if (sub.status !== 'ACTIVE' || sub.deletedAt) continue;

    if (sub.cycle === 'YEARLY') {
      const billingMonth = sub.billingMonth ?? 1;
      if (currentMonth + 1 !== billingMonth) {
        continue;
      }
    }

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const effectiveDay = Math.min(sub.dueDay, lastDayOfMonth);
    const chargeDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

    if (chargeDate > todayStr) {
      continue;
    }

    const startLimit = (sub.startDate || sub.createdAt || '').slice(0, 10);
    if (startLimit && chargeDate < startLimit) {
      continue;
    }

    const deterministicId = `sub-${sub.id}-${chargeDate}`;
    if (existingIds.has(deterministicId)) {
      continue;
    }

    const newTx: Transaction = {
      id: deterministicId,
      date: chargeDate,
      description: sub.name,
      amount: sub.amount,
      entryType: sub.paymentType === 'CREDIT_CARD' ? 'CARD' : 'EXPENSE',
      cardId: sub.paymentType === 'CREDIT_CARD' ? sub.cardId : undefined,
      tags: ['assinatura', ...(sub.category ? [sub.category] : [])],
      comment: 'Cobrança automática de assinatura',
      subscriptionId: sub.id,
      createdAt: new Date().toISOString()
    };

    newTransactions.push(newTx);
    existingIds.add(deterministicId);
  }

  return newTransactions;
};

export const getDueSubscriptionTransactions = generateSubscriptionTransactions;

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

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const getSubscriptionEvolution = (
  subscriptions: Subscription[],
  transactions: Transaction[] = [],
  monthsCount: number = 6,
  referenceDate: Date = new Date()
): SubscriptionEvolution => {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const months: SubscriptionEvolutionMonth[] = [];

  const activeSubs = subscriptions
    .map(normalizeSubscription)
    .filter(s => s.status === 'ACTIVE' && !s.deletedAt);

  for (let i = monthsCount - 1; i >= 0; i--) {
    const targetDate = new Date(refYear, refMonth - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const isCurrentMonth = i === 0;

    // Filter subscription-linked transactions in this month
    const matchingTransactions = transactions.filter(t => {
      if (t.deletedAt) return false;
      const isLinked = Boolean(t.subscriptionId) || Boolean(t.tags && t.tags.some(tag => normalizeTag(tag) === 'assinatura'));
      if (!isLinked) return false;

      const dateStr = t.date || '';
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length < 2) return false;
      const tYear = parseInt(parts[0], 10);
      const tMonth = parseInt(parts[1], 10) - 1;
      return tYear === year && tMonth === month;
    });

    let totalAmount = 0;
    let activeCount = 0;

    if (matchingTransactions.length > 0) {
      totalAmount = matchingTransactions.reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
      const uniqueEntities = new Set(
        matchingTransactions.map(t => t.subscriptionId || t.description.trim().toLowerCase())
      );
      activeCount = uniqueEntities.size;
    } else {
      for (const sub of activeSubs) {
        const isCharged =
          sub.cycle === 'MONTHLY' ||
          (sub.cycle === 'YEARLY' && (sub.billingMonth ?? 1) === month + 1);

        if (isCharged) {
          totalAmount += sub.amount;
          activeCount += 1;
        }
      }
    }

    months.push({
      year,
      month,
      monthLabel: MONTH_LABELS[month],
      yearLabel: String(year),
      totalAmount: Math.round(totalAmount * 100) / 100,
      activeCount,
      isCurrentMonth
    });
  }

  const amounts = months.map(m => m.totalAmount);
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
  const totalSum = amounts.reduce((acc, val) => acc + val, 0);
  const averageAmount = amounts.length > 0 ? Math.round((totalSum / amounts.length) * 100) / 100 : 0;

  const currentMonthTotal = months[months.length - 1]?.totalAmount ?? 0;
  const previousMonthTotal = months.length >= 2 ? months[months.length - 2].totalAmount : 0;
  const percentageChange =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  return {
    months,
    maxAmount,
    minAmount,
    averageAmount,
    currentMonthTotal,
    previousMonthTotal,
    percentageChange
  };
};
