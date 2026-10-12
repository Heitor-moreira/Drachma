import { Subscription } from '../types';
import { formatLocalDate } from './finance';

export * from './subscriptionTransactions';

/**
 * Calculates the next occurrence date (YYYY-MM-DD) for a subscription on or after a given date.
 */
export const getNextDueDate = (sub: Subscription, fromDate: Date = new Date()): string => {
  const currentYear = fromDate.getFullYear();
  const currentMonth = fromDate.getMonth(); // 0-11
  const fromDateStr = formatLocalDate(fromDate);

  if (sub.cycle === 'YEARLY') {
    const billingMonth = (sub.billingMonth ?? 1) - 1; // 0-11
    // Try current year
    const daysInMonthThisYear = new Date(currentYear, billingMonth + 1, 0).getDate();
    const dayThisYear = Math.min(sub.dueDay, daysInMonthThisYear);
    const dateThisYear = `${currentYear}-${String(billingMonth + 1).padStart(2, '0')}-${String(dayThisYear).padStart(2, '0')}`;
    
    if (dateThisYear >= fromDateStr) {
      return dateThisYear;
    }
    // Next year
    const daysInMonthNextYear = new Date(currentYear + 1, billingMonth + 1, 0).getDate();
    const dayNextYear = Math.min(sub.dueDay, daysInMonthNextYear);
    return `${currentYear + 1}-${String(billingMonth + 1).padStart(2, '0')}-${String(dayNextYear).padStart(2, '0')}`;
  }

  // MONTHLY
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayThisMonth = Math.min(sub.dueDay, daysInCurrentMonth);
  const dateThisMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayThisMonth).padStart(2, '0')}`;

  if (dateThisMonth >= fromDateStr) {
    return dateThisMonth;
  }

  // Next month
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();
  const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
  const dayNextMonth = Math.min(sub.dueDay, daysInNextMonth);
  return `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNextMonth).padStart(2, '0')}`;
};

/**
 * Sorts subscriptions by their next due occurrence date.
 */
export const sortByNextDue = (subscriptions: Subscription[], fromDate: Date = new Date()): Subscription[] => {
  return [...subscriptions].sort((a, b) => {
    // Active ones first
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;

    const nextA = getNextDueDate(a, fromDate);
    const nextB = getNextDueDate(b, fromDate);
    if (nextA !== nextB) {
      return nextA.localeCompare(nextB);
    }
    return a.dueDay - b.dueDay;
  });
};
