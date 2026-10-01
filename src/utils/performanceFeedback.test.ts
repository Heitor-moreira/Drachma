import { describe, it, expect } from 'vitest';
import { getPerformanceVerdict } from './performanceFeedback';

describe('getPerformanceVerdict', () => {
  it('returns neutro when there are no movements', () => {
    const verdict = getPerformanceVerdict(0, 0, 0);
    expect(verdict.text).toBe('Sem movimentações no período');
    expect(verdict.colorClass).toBe('text-slate-400');
  });

  it('returns excelente for savings > 15%', () => {
    const verdict = getPerformanceVerdict(160, 1000, 0);
    expect(verdict.text).toBe('Excelente: sobra financeira consistente');
    expect(verdict.colorClass).toBe('text-emerald-500');
  });

  it('returns moderado for savings > 5% and <= 15%', () => {
    const verdict = getPerformanceVerdict(100, 1000, 0);
    expect(verdict.text).toBe('Mês no azul com folga');
    expect(verdict.colorClass).toBe('text-emerald-600');
  });

  it('returns equilibrado for savings 0% to 5%', () => {
    const verdict = getPerformanceVerdict(30, 1000, 0);
    expect(verdict.text).toBe('Atenção: saldo positivo, mas margem apertada');
    expect(verdict.colorClass).toBe('text-amber-500');
  });

  it('returns deficit leve for savings < 0% and >= -10%', () => {
    const verdict = getPerformanceVerdict(-50, 1000, 0);
    expect(verdict.text).toBe('Atenção: gastos superaram as entradas');
    expect(verdict.colorClass).toBe('text-rose-500');
  });

  it('returns deficit alto for savings < -10%', () => {
    const verdict = getPerformanceVerdict(-150, 1000, 0);
    expect(verdict.text).toBe('Alerta crítico: rombo no caixa do mês');
    expect(verdict.colorClass).toBe('text-rose-600');
  });

  it('returns special veredict when performance is close to zero but savings are high', () => {
    // 2% performance, 15% savings
    const verdict1 = getPerformanceVerdict(20, 1000, 150);
    expect(verdict1.text).toBe('Equilibrado: boa parte da renda foi destinada a economias');
    expect(verdict1.colorClass).toBe('text-emerald-500');

    // -2% performance, 20% savings
    const verdict2 = getPerformanceVerdict(-20, 1000, 200);
    expect(verdict2.text).toBe('Equilibrado: boa parte da renda foi destinada a economias');
    expect(verdict2.colorClass).toBe('text-emerald-500');
  });
});
