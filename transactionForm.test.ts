import { describe, expect, it } from 'vitest';
import { commitTag, normalizeTag, uniqueTags } from './components/TransactionForm';

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
