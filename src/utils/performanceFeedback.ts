export function getPerformanceVerdict(
  performance: number,
  income: number,
  savings: number
): { text: string; colorClass: string } {
  if (income === 0 && performance === 0 && savings === 0) {
    return {
      text: 'Sem movimentações no período',
      colorClass: 'text-slate-400',
    };
  }

  const baseForCalculation = income > 0 ? income : 1;
  const performancePercentage = (performance / baseForCalculation) * 100;
  const savingsPercentage = (savings / baseForCalculation) * 100;

  // Refinamento Contextual (Cruzamento com Economias)
  // "Performance próxima de zero, mas % Economizado alto"
  if (
    performancePercentage >= -5 &&
    performancePercentage <= 5 &&
    savingsPercentage >= 10
  ) {
    return {
      text: 'Equilibrado: boa parte da renda foi destinada a economias',
      colorClass: 'text-emerald-500',
    };
  }

  if (performancePercentage > 15) {
    return {
      text: 'Excelente: sobra financeira consistente',
      colorClass: 'text-emerald-500',
    };
  }

  if (performancePercentage > 5) {
    return {
      text: 'Mês no azul com folga',
      colorClass: 'text-emerald-600',
    };
  }

  if (performancePercentage >= 0) {
    return {
      text: 'Atenção: saldo positivo, mas margem apertada',
      colorClass: 'text-amber-500',
    };
  }

  if (performancePercentage >= -10) {
    return {
      text: 'Atenção: gastos superaram as entradas',
      colorClass: 'text-rose-500',
    };
  }

  return {
    text: 'Alerta crítico: rombo no caixa do mês',
    colorClass: 'text-rose-600',
  };
}
