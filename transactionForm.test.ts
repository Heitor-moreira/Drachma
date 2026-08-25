import { describe, expect, it } from 'vitest';
import { commitTag, getTransactionOccurrenceLabel, normalizeTag, uniqueTags } from './components/TransactionForm';

describe('transaction form tags', () => {
  it('keeps multiple words and normalizes only when committed', () => {
    expect(normalizeTag('  Viagem   São Paulo  ')).toBe('viagem são paulo');
    expect(commitTag([], '  Viagem   São Paulo  ')).toEqual(['viagem são paulo']);
  });

  it('does not add an empty tag when the input contains only spaces', () => {
    expect(commitTag(['mercado mensal'], '   ')).toEqual(['mercado mensal']);
  });

  it('deduplicates tags by case, accents, and spacing', () => {
    expect(uniqueTags(['São Paulo', 'sao  paulo', 'MERCADO mensal'])).toEqual(['são paulo', 'mercado mensal']);
  });
});

describe('transaction form occurrence label', () => {
  it('shows the current installment after the description', () => {
    expect(getTransactionOccurrenceLabel({ id: 'installment', date: '2026-08-01', description: 'Mercado', amount: 10, entryType: 'EXPENSE', comment: '', isInstallment: true, installmentInfo: { current: 2, total: 3, purchaseId: 'purchase' } })).toBe('[2/3]');
  });

  it('shows the first finite recurrence occurrence in the modal', () => {
    expect(getTransactionOccurrenceLabel({ id: 'recurrence', date: '2026-08-01', description: 'Conta', amount: 10, entryType: 'EXPENSE', comment: '', recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 3 })).toBe('[1/4]');
  });
});
