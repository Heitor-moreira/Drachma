import { describe, expect, it } from 'vitest';
import { getCurrentMonthRange } from './currentPeriod';

describe('getCurrentMonthRange', () => {
  it('returns the first and last day of the provided current month', () => {
    expect(getCurrentMonthRange(new Date(2026, 7, 20))).toEqual({ start: '2026-08-01', end: '2026-08-31' });
  });
});
