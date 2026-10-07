import { describe, expect, it } from 'vitest';
import { filterTaggedTransactions, normalizeTag, sortTagTotals, transactionHasTag } from './taggedTransactions';

const base = { amount: 10, comment: '', entryType: 'EXPENSE' as const };

describe('filterTaggedTransactions', () => {
  it('normalizes displayed tag names to lowercase without the hash prefix', () => {
    expect(normalizeTag('#INVESTIMENTO')).toBe('investimento');
  });

  it('combines period, type and normalized tag and excludes untagged entries', () => {
    const result = filterTaggedTransactions([
      { ...base, id: 'match', date: '2026-08-20', description: 'Mercado', tags: [' Alimentação '] },
      { ...base, id: 'wrong-type', date: '2026-08-20', description: 'Entrada', entryType: 'INCOME', tags: ['alimentação'] },
      { ...base, id: 'wrong-tag', date: '2026-08-20', description: 'Lazer', tags: ['Lazer'] },
      { ...base, id: 'untagged', date: '2026-08-20', description: 'Sem tag' },
      { ...base, id: 'wrong-month', date: '2026-09-20', description: 'Fora', tags: ['alimentação'] },
    ], [], 2026, 7, 'EXPENSE', 'alimentação');
    expect(result.map(transaction => transaction.id)).toEqual(['match']);
  });

  it('filters tags partially without case or accent sensitivity', () => {
    const result = filterTaggedTransactions([
      { ...base, id: 'food', date: '2026-08-20', description: 'Mercado', tags: ['Alimentação'] },
      { ...base, id: 'fun', date: '2026-08-20', description: 'Cinema', tags: ['Lazer'] },
    ], [], 2026, 7, 'ALL', 'ALIMEN');

    expect(result.map(transaction => transaction.id)).toEqual(['food']);
  });

  it('includes tagged recurring projections and installments in the selected month', () => {
    const result = filterTaggedTransactions([{ ...base, id: 'recurring', date: '2026-07-20', description: 'Recorrente', tags: ['fixo'], recurrenceFrequency: 'MONTHLY', recurrenceEndMode: 'COUNT', recurrenceCount: 2 }], [], 2026, 7, 'ALL', 'ALL');
    expect(result.map(transaction => transaction.date)).toEqual(['2026-08-20']);
  });
});

describe('transactionHasTag', () => {
  it('returns true when a transaction tag matches exactly, ignoring case, accents and hash', () => {
    const transaction = { ...base, id: '1', date: '2026-08-20', description: 'Feira', tags: ['#Alimentação'] };
    expect(transactionHasTag(transaction, 'alimentacao')).toBe(true);
    expect(transactionHasTag(transaction, '#ALIMENTAÇÃO')).toBe(true);
  });

  it('does not match partial tags (e.g. casa vs casamento)', () => {
    const transaction = { ...base, id: '2', date: '2026-08-20', description: 'Presente', tags: ['casamento'] };
    expect(transactionHasTag(transaction, 'casa')).toBe(false);

    const transactionShort = { ...base, id: '3', date: '2026-08-20', description: 'Reforma', tags: ['casa'] };
    expect(transactionHasTag(transactionShort, 'casamento')).toBe(false);
  });

  it('returns false for transactions with no tags or invalid target tag', () => {
    const transactionNoTags = { ...base, id: '4', date: '2026-08-20', description: 'Sem tags' };
    expect(transactionHasTag(transactionNoTags, 'alimentacao')).toBe(false);
    expect(transactionHasTag({ ...transactionNoTags, tags: [] }, 'alimentacao')).toBe(false);
    expect(transactionHasTag({ ...transactionNoTags, tags: ['lazer'] }, '')).toBe(false);
    expect(transactionHasTag({ ...transactionNoTags, tags: ['lazer'] }, '   ')).toBe(false);
  });
});

describe('sortTagTotals', () => {
  const sampleTags = [
    { name: 'mercado', total: -500 },
    { name: 'salario', total: 3000 },
    { name: 'investimento', total: -150 },
    { name: 'freela', total: 800 },
    { name: 'lazer', total: -150 },
  ];

  it('sorts alphabetically in ascending order', () => {
    const sorted = sortTagTotals(sampleTags, 'alpha', 'asc');
    expect(sorted.map(t => t.name)).toEqual(['freela', 'investimento', 'lazer', 'mercado', 'salario']);
  });

  it('sorts alphabetically in descending order', () => {
    const sorted = sortTagTotals(sampleTags, 'alpha', 'desc');
    expect(sorted.map(t => t.name)).toEqual(['salario', 'mercado', 'lazer', 'investimento', 'freela']);
  });

  it('sorts by signed value in descending order (highest positive first, tie-breaking alphabetically)', () => {
    const sorted = sortTagTotals(sampleTags, 'value', 'desc');
    expect(sorted.map(t => ({ name: t.name, total: t.total }))).toEqual([
      { name: 'salario', total: 3000 },
      { name: 'freela', total: 800 },
      { name: 'investimento', total: -150 },
      { name: 'lazer', total: -150 },
      { name: 'mercado', total: -500 },
    ]);
  });

  it('sorts by signed value in ascending order (most negative first, tie-breaking alphabetically)', () => {
    const sorted = sortTagTotals(sampleTags, 'value', 'asc');
    expect(sorted.map(t => ({ name: t.name, total: t.total }))).toEqual([
      { name: 'mercado', total: -500 },
      { name: 'investimento', total: -150 },
      { name: 'lazer', total: -150 },
      { name: 'freela', total: 800 },
      { name: 'salario', total: 3000 },
    ]);
  });

  it('does not mutate the input array', () => {
    const original = [...sampleTags];
    sortTagTotals(sampleTags, 'value', 'desc');
    expect(sampleTags).toEqual(original);
  });
});
