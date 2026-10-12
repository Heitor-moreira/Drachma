import { describe, expect, it } from 'vitest';
import {
  normalizeSubscription,
  generateSubscriptionTransactions,
  getSubscriptionMetrics,
  getSubscriptionSummaryForMonth
} from './subscriptionTransactions';
import { getNextDueDate, sortByNextDue } from './subscriptions';
import { Subscription, Transaction, SalaryInfo, CreditCard } from '../types';

describe('Subscription domain and transactions', () => {
  describe('normalizeSubscription', () => {
    it('normalizes legacy subscription with isActive=true', () => {
      const legacy: Partial<Subscription> = {
        id: 'sub-legacy-1',
        name: 'Netflix',
        amount: 55.9,
        isActive: true
      };
      const normalized = normalizeSubscription(legacy);
      expect(normalized.id).toBe('sub-legacy-1');
      expect(normalized.name).toBe('Netflix');
      expect(normalized.amount).toBe(55.9);
      expect(normalized.status).toBe('ACTIVE');
      expect(normalized.isActive).toBe(true);
      expect(normalized.dueDay).toBe(1);
      expect(normalized.cycle).toBe('MONTHLY');
      expect(normalized.paymentType).toBe('DIRECT_DEBIT');
    });

    it('normalizes legacy subscription with isActive=false to PAUSED', () => {
      const legacy: Partial<Subscription> = {
        name: 'Disney+',
        amount: 33.9,
        isActive: false
      };
      const normalized = normalizeSubscription(legacy);
      expect(normalized.status).toBe('PAUSED');
      expect(normalized.isActive).toBe(false);
    });

    it('handles CREDIT_CARD and clamp limits', () => {
      const raw: Partial<Subscription> = {
        name: 'Prime Video',
        amount: 19.9,
        dueDay: 31,
        cycle: 'YEARLY',
        billingMonth: 7,
        paymentType: 'CREDIT_CARD',
        cardId: 'card-123',
        status: 'ACTIVE'
      };
      const normalized = normalizeSubscription(raw);
      expect(normalized.dueDay).toBe(31);
      expect(normalized.cycle).toBe('YEARLY');
      expect(normalized.billingMonth).toBe(7);
      expect(normalized.paymentType).toBe('CREDIT_CARD');
      expect(normalized.cardId).toBe('card-123');
    });
  });

  describe('generateSubscriptionTransactions', () => {
    const today = new Date(2026, 9, 15); // 2026-10-15

    it('generates deterministic transaction for active subscription due today or earlier in current month', () => {
      const sub: Subscription = {
        id: 'netflix-1',
        name: 'Netflix',
        amount: 55.9,
        dueDay: 10,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-01-01'
      };

      const generated = generateSubscriptionTransactions([sub], [], today);
      expect(generated).toHaveLength(1);
      expect(generated[0].id).toBe('sub-netflix-1-2026-10-10');
      expect(generated[0].date).toBe('2026-10-10');
      expect(generated[0].amount).toBe(55.9);
      expect(generated[0].entryType).toBe('EXPENSE');
      expect(generated[0].cardId).toBeUndefined();
      expect(generated[0].subscriptionId).toBe('netflix-1');
      expect(generated[0].tags).toContain('assinatura');
    });

    it('generates CARD entryType with cardId when paymentType is CREDIT_CARD', () => {
      const sub: Subscription = {
        id: 'spotify-1',
        name: 'Spotify',
        amount: 21.9,
        dueDay: 5,
        cycle: 'MONTHLY',
        paymentType: 'CREDIT_CARD',
        cardId: 'nubank-card',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-01-01'
      };

      const generated = generateSubscriptionTransactions([sub], [], today);
      expect(generated).toHaveLength(1);
      expect(generated[0].entryType).toBe('CARD');
      expect(generated[0].cardId).toBe('nubank-card');
    });

    it('is strictly idempotent: does not generate if deterministic transaction already exists', () => {
      const sub: Subscription = {
        id: 'chatgpt-1',
        name: 'ChatGPT',
        amount: 100,
        dueDay: 1,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-01-01'
      };

      const existing: Transaction = {
        id: 'sub-chatgpt-1-2026-10-01',
        date: '2026-10-01',
        description: 'ChatGPT',
        amount: 100,
        entryType: 'EXPENSE',
        comment: ''
      };

      const generated = generateSubscriptionTransactions([sub], [existing], today);
      expect(generated).toHaveLength(0);
    });

    it('does not generate transaction if due day has not arrived yet in the current month', () => {
      const sub: Subscription = {
        id: 'sub-future',
        name: 'Gympass',
        amount: 89.9,
        dueDay: 25, // today is 15th
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-01-01'
      };

      const generated = generateSubscriptionTransactions([sub], [], today);
      expect(generated).toHaveLength(0);
    });

    it('does not generate retroactive transaction before subscription startDate/creation', () => {
      const sub: Subscription = {
        id: 'sub-new',
        name: 'Midjourney',
        amount: 60,
        dueDay: 5, // due on 5th
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-10-12' // created on 12th, after the 5th
      };

      const generated = generateSubscriptionTransactions([sub], [], today);
      expect(generated).toHaveLength(0);
    });

    it('does not generate for PAUSED or CANCELED subscriptions', () => {
      const pausedSub: Subscription = {
        id: 'sub-paused',
        name: 'Amazon Prime',
        amount: 19.9,
        dueDay: 5,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'PAUSED',
        isActive: false
      };

      const generated = generateSubscriptionTransactions([pausedSub], [], today);
      expect(generated).toHaveLength(0);
    });

    it.each([
      { year: 2026, month: 1, day: 28, expected: '2026-02-28' },
      { year: 2026, month: 3, day: 31, expected: '2026-04-30' },
      { year: 2026, month: 0, day: 31, expected: '2026-01-31' }
    ])('clamps due day $day to the calendar length for $expected', ({ year, month, day, expected }) => {
      const sub: Subscription = {
        id: `sub-${expected}`,
        name: 'Serviço',
        amount: 10,
        dueDay: day,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: `${year}-01-01`
      };

      const lastDateOfMonth = new Date(year, month + 1, 0);
      const generated = generateSubscriptionTransactions([sub], [], lastDateOfMonth);
      expect(generated).toHaveLength(1);
      expect(generated[0].date).toBe(expected);
      expect(generated[0].id).toBe(`sub-${sub.id}-${expected}`);
    });

    it('does not duplicate an ID when a subscription appears more than once in the input', () => {
      const sub: Subscription = {
        id: 'duplicate-sub',
        name: 'Spotify',
        amount: 21.9,
        dueDay: 5,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true,
        startDate: '2026-01-01'
      };

      const generated = generateSubscriptionTransactions([sub, sub], [], today);
      expect(generated).toHaveLength(1);
      expect(generated.map(transaction => transaction.id)).toEqual(['sub-duplicate-sub-2026-10-05']);
    });

    it('yearly subscription only generates in its billingMonth', () => {
      // today is October (month 10)
      const yearlyNovember: Subscription = {
        id: 'sub-yearly-nov',
        name: 'Amazon Prime Anual',
        amount: 166.8,
        dueDay: 10,
        cycle: 'YEARLY',
        billingMonth: 11,
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      };

      const yearlyOctober: Subscription = {
        id: 'sub-yearly-oct',
        name: 'Domínio Anual',
        amount: 80,
        dueDay: 10,
        cycle: 'YEARLY',
        billingMonth: 10,
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      };

      const genNov = generateSubscriptionTransactions([yearlyNovember], [], today);
      expect(genNov).toHaveLength(0);

      const genOct = generateSubscriptionTransactions([yearlyOctober], [], today);
      expect(genOct).toHaveLength(1);
      expect(genOct[0].id).toBe('sub-sub-yearly-oct-2026-10-10');
    });
  });

  describe('getSubscriptionMetrics', () => {
    const subs: Subscription[] = [
      {
        id: '1',
        name: 'Netflix',
        amount: 50,
        dueDay: 10,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      },
      {
        id: '2',
        name: 'Amazon Anual',
        amount: 120, // 120 / 12 = 10 por mês
        dueDay: 15,
        cycle: 'YEARLY',
        billingMonth: 6,
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      },
      {
        id: '3',
        name: 'Pausada',
        amount: 200,
        dueDay: 1,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'PAUSED',
        isActive: false
      }
    ];

    it('calculates total monthly and annual projection correctly ignoring paused subs', () => {
      const salaryInfo: SalaryInfo = {
        gross: 6000,
        discounts: [{ id: '1', name: 'INSS', amount: 1000, type: 'VALUE' }]
      }; // net = 5000

      const metrics = getSubscriptionMetrics(subs, salaryInfo);
      expect(metrics.activeCount).toBe(2);
      expect(metrics.totalMonthly).toBe(60); // 50 + 10
      expect(metrics.annualProjection).toBe(720); // 50 * 12 + 120
      expect(metrics.incomePercentage).toBeCloseTo((60 / 5000) * 100);
    });

    it('returns null incomePercentage when salary is not defined or zero', () => {
      const metrics = getSubscriptionMetrics(subs, undefined, 0);
      expect(metrics.incomePercentage).toBeNull();
    });
  });

  describe('getNextDueDate and sortByNextDue', () => {
    it('clamps due day to end of month for short months', () => {
      const subDay31: Subscription = {
        id: 'sub-31',
        name: 'Cloud',
        amount: 20,
        dueDay: 31,
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      };

      // From February 1, 2026 (non-leap year, 28 days)
      const feb1 = new Date(2026, 1, 1);
      const nextDue = getNextDueDate(subDay31, feb1);
      expect(nextDue).toBe('2026-02-28');
    });

    it('sorts subscriptions by chronological next due date', () => {
      const fromDate = new Date(2026, 9, 12); // Oct 12, 2026
      const sub1: Subscription = {
        id: '1',
        name: 'Spotify',
        amount: 20,
        dueDay: 5, // Next due is Nov 5
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      };
      const sub2: Subscription = {
        id: '2',
        name: 'Netflix',
        amount: 50,
        dueDay: 20, // Next due is Oct 20
        cycle: 'MONTHLY',
        paymentType: 'DIRECT_DEBIT',
        status: 'ACTIVE',
        isActive: true
      };

      const sorted = sortByNextDue([sub1, sub2], fromDate);
      expect(sorted[0].id).toBe('2'); // Oct 20 comes before Nov 5
      expect(sorted[1].id).toBe('1');
    });
  });
});
