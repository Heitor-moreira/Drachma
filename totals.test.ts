import { describe, expect, test } from 'vitest';
import { calculatePerformance } from './components/TotalsView';

describe('calculatePerformance', () => {
  test('subtrai gastos com cartão junto das demais saídas', () => {
    expect(calculatePerformance({ income: 2534.83, expense: 342.46, savings: 998.09, card: 3926.54 })).toBeCloseTo(-2732.26);
  });
});
