import { describe, expect, it } from 'vitest';
import { getLatestDataEvent, normalizeSnapshot, validateSnapshot } from './appStorage';

describe('app storage contracts', () => {
  it('rejects imports without a transaction array', () => {
    expect(validateSnapshot({})).toBe(false);
    expect(() => normalizeSnapshot({})).toThrow('Arquivo inválido');
  });

  it('normalizes valid imported transactions without changing financial fields', () => {
    const result = normalizeSnapshot({ transactions: [{ id: '1', date: '2026-01-01', description: 'Teste', amount: 20, type: 'INCOME', comment: '' }] });
    expect(result.transactions?.[0].entryType).toBe('INCOME');
    expect(result.transactions?.[0].amount).toBe(20);
  });

  it('keeps the most recent data event', () => {
    expect(getLatestDataEvent(
      { type: 'IMPORT', timestamp: '2026-08-15T08:30:00.000Z' },
      { type: 'SAVE', timestamp: '2026-08-15T08:35:00.000Z' },
    )).toEqual({ type: 'SAVE', timestamp: '2026-08-15T08:35:00.000Z' });
  });

  it('supports deletion as a successful data event', () => {
    expect(getLatestDataEvent(undefined, { type: 'DELETE', timestamp: '2026-08-15T08:40:00.000Z' })).toEqual({
      type: 'DELETE',
      timestamp: '2026-08-15T08:40:00.000Z',
    });
  });

  it('preserves the latest event when reading a snapshot', () => {
    const result = normalizeSnapshot({
      transactions: [],
      lastDataEvent: { type: 'IMPORT', timestamp: '2026-08-15T08:30:00.000Z' },
    });
    expect(result.lastDataEvent).toEqual({ type: 'IMPORT', timestamp: '2026-08-15T08:30:00.000Z' });
  });
});
