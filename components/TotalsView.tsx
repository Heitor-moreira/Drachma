import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { CreditCard, DateRange, FinancialGroup, Transaction } from '../types';
import { getFinancialGroup, projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; cards: CreditCard[]; currencySymbol: string; onOpenHorizon: () => void; }
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TotalsView: React.FC<Props> = ({ transactions, dateRange, setDateRange, cards, currencySymbol, onOpenHorizon }) => {
  const fallbackStart = new Date();
  const start = Number.isNaN(Date.parse(dateRange.start)) ? new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), 1, 12) : parseDate(dateRange.start);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
  const totals = useMemo(() => {
    const projected = projectTransactions(transactions, formatDate(start), formatDate(end), cards);
    const sum = (predicate: (transaction: Transaction) => boolean) => projected.filter(predicate).reduce((total, transaction) => total + transaction.amount, 0);
    return {
      income: sum(t => getFinancialGroup(t) === FinancialGroup.PERSONAL_INCOME),
      expense: sum(t => getFinancialGroup(t) === FinancialGroup.PERSONAL_EXPENSE),
      savings: sum(t => getFinancialGroup(t) === FinancialGroup.SAVINGS),
      card: sum(t => t.paymentMethod === 'CREDIT_CARD'),
    };
  }, [transactions, cards, dateRange]);
  const moveMonth = (delta: number) => { const next = new Date(start.getFullYear(), start.getMonth() + delta, 1, 12); setDateRange({ start: formatDate(next), end: formatDate(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12)) }); };
  const money = (value: number) => `${currencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const performance = totals.income - totals.expense - totals.savings;
  const savingsPercentage = totals.income > 0 ? Math.min(100, Math.max(0, (totals.savings / totals.income) * 100)) : 0;
  const symbol = (content: React.ReactNode, color: string) => <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>{content}</span>;
  const separator = <span className="text-sm font-bold text-dark-app-text-secondary">−</span>;
  return <section className="flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <div className="border-b border-slate-100 transition-colors dark:border-dark-app-border"><div className="relative flex min-h-[76px] flex-nowrap items-center gap-1 overflow-visible bg-white px-4 py-4 dark:bg-dark-app-surface"><div className="relative shrink-0" tabIndex={-1} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPeriodPickerOpen(false); }}><button aria-label="Selecionar mês e ano" onClick={() => setIsPeriodPickerOpen(value => !value)} className="shrink-0 rounded-lg p-1 text-slate-900 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><CalendarDays className="h-6 w-6" strokeWidth={2.5} /></button>{isPeriodPickerOpen && <div className="absolute left-0 top-10 z-20 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-dark-app-border dark:bg-dark-app-surface"><select aria-label="Mês" value={start.getMonth()} onChange={e => { const month = Number(e.target.value); setDateRange({ start: formatDate(new Date(start.getFullYear(), month, 1)), end: formatDate(new Date(start.getFullYear(), month + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><select aria-label="Ano" value={start.getFullYear()} onChange={e => { const year = Number(e.target.value); setDateRange({ start: formatDate(new Date(year, start.getMonth(), 1)), end: formatDate(new Date(year, start.getMonth() + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{Array.from({ length: 11 }, (_, index) => start.getFullYear() - 5 + index).map(year => <option key={year} value={year}>{year}</option>)}</select></div>}</div><div className="mx-auto flex items-center gap-0.5"><button aria-label="Mês anterior" onClick={() => moveMonth(-1)} className="shrink-0 p-1"><ChevronLeft className="h-6 w-6" /></button><span className="shrink-0 whitespace-nowrap text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{MONTHS[start.getMonth()]}/{String(start.getFullYear()).slice(-2)}</span><button aria-label="Próximo mês" onClick={() => moveMonth(1)} className="shrink-0 p-1"><ChevronRight className="h-6 w-6" /></button></div><button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-50 dark:hover:bg-dark-app-surface-secondary"><Grid3X3 className="h-6 w-6" /></button></div></div>
    <div className="border-b border-slate-100 px-6 py-4 dark:border-dark-app-border"><h2 className="text-base font-normal text-slate-500 dark:text-dark-app-text-secondary">Cálculos do mês</h2></div>
    <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-app-border">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">Performance</h3>
          <div className="mt-2 flex items-center gap-1">
            {symbol(<ArrowDownLeft size={14} strokeWidth={3} />, 'bg-emerald-500')}{separator}
            {symbol(<ArrowUpRight size={14} strokeWidth={3} />, 'bg-rose-500')}{separator}
            {symbol('E', 'bg-lime-500')}{separator}
            {symbol('C', 'bg-violet-600')}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{money(performance)}</p>
          <p className="text-sm font-normal text-slate-500 dark:text-dark-app-text-secondary">{performance >= 0 ? 'Sobrou dinheiro' : 'Faltou dinheiro'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">Economizado</h3>
          <div className="mt-2 flex items-center gap-2">
            {symbol('E', 'bg-lime-500')}
            <div className="h-3 w-32 rounded-full border-2 border-lime-500 p-0.5 dark:border-lime-400"><div className="h-full rounded-full bg-lime-500 dark:bg-lime-400" style={{ width: `${savingsPercentage}%` }} /></div>
            {symbol(<ArrowDownLeft size={14} strokeWidth={3} />, 'bg-emerald-500')}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{savingsPercentage.toFixed(0)}%</p>
          <p className="text-sm font-normal text-slate-500 dark:text-dark-app-text-secondary">Dentro da meta</p>
        </div>
      </div>
    </div>
  </section>;
};
export default TotalsView;
