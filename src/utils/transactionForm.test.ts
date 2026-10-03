import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TransactionForm, { commitTag, getTransactionOccurrenceLabel, normalizeTag, TRANSACTION_CLOSE_DELAY_MS, TRANSACTION_SUBMIT_DELAY_MS, uniqueTags } from '../components/TransactionForm';

describe('transaction form timing', () => {
  it('keeps submit and close delays below the previous perceived-latency budget', () => {
    expect(TRANSACTION_SUBMIT_DELAY_MS).toBeLessThan(220);
    expect(TRANSACTION_CLOSE_DELAY_MS).toBeLessThan(260);
    expect(TRANSACTION_SUBMIT_DELAY_MS).toBeLessThan(TRANSACTION_CLOSE_DELAY_MS);
  });
});

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

describe('transaction form description field', () => {
  it('does not enforce rigid 80px height and uses leading-normal on description textarea', () => {
    const html = renderToStaticMarkup(React.createElement(TransactionForm, {
      onAdd: () => undefined,
      onClose: () => undefined,
      currencySymbol: 'R$',
      initialData: {
        id: '1',
        description: 'Formatura Helô (parcelas 3, 4 e 5)',
        amount: 231.24,
        entryType: 'EXPENSE',
        date: '2026-07-14',
        comment: ''
      }
    }));

    // Form must not enforce rigid !h-[80px]
    expect(html).not.toContain('!h-[80px]');
    expect(html).toContain('min-h-[80px]');

    // Container should allow auto height
    expect(html).toContain('!h-auto min-h-[80px]');

    // Textarea should have leading-normal
    expect(html).toContain('leading-normal');
    expect(html).toContain('Formatura Helô (parcelas 3, 4 e 5)');
  });
});
