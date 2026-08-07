import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Grid2X2, Grid3X3 } from 'lucide-react';
import { CreditCard, DateRange, FinancialGroup, Transaction, TransactionType } from '../types';
import { getFinancialGroup, projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; cards: CreditCard[]; currencySymbol: string; onOpenHorizon: () => void; }
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TotalsView: React.FC<Props> = ({ transactions, dateRange, setDateRange, cards, currencySymbol, onOpenHorizon }) => {
  const start = parseDate(dateRange.start);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
  const totals = useMemo(() => {
    const projected = projectTransactions(transactions, formatDate(start), formatDate(end), cards);
    const sum = (predicate: (transaction: Transaction) => boolean) => projected.filter(predicate).reduce((total, transaction) => total + transaction.amount, 0);
    return {
      income: sum(t => getFinancialGroup(t) === FinancialGroup.PERSONAL_INCOME),
      expense: sum(t => getFinancialGroup(t) === FinancialGroup.PERSONAL_EXPENSE),
      daily: 0,
      savings: sum(t => getFinancialGroup(t) === FinancialGroup.SAVINGS),
      card: sum(t => t.paymentMethod === 'CREDIT_CARD'),
    };
  }, [transactions, cards, dateRange]);
  const moveMonth = (delta: number) => { const next = new Date(start.getFullYear(), start.getMonth() + delta, 1, 12); setDateRange({ start: formatDate(next), end: formatDate(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12)) }); };
  const money = (value: number) => `${currencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const rows = [
    { label: 'Entradas', value: totals.income, icon: <ArrowDownLeft size={16} strokeWidth={3} />, color: 'bg-emerald-500' },
    { label: 'Saídas', value: totals.expense, icon: <ArrowUpRight size={16} strokeWidth={3} />, color: 'bg-rose-500' },
    { label: 'Diários', value: totals.daily, icon: 'D', color: 'bg-pink-600' },
    { label: 'Economias', value: totals.savings, icon: 'E', color: 'bg-lime-500' },
    { label: 'Gastos com cartão', value: totals.card, icon: 'C', color: 'bg-violet-600' },
  ];
  return <section className="min-h-full bg-white dark:bg-dark-app-surface">
    <div className="border-b border-slate-100 transition-colors dark:border-dark-app-border"><div className="relative flex min-h-[76px] flex-nowrap items-center gap-1 overflow-visible bg-white px-4 py-4 dark:bg-dark-app-surface"><div className="relative shrink-0" tabIndex={-1} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPeriodPickerOpen(false); }}><button aria-label="Selecionar mês e ano" onClick={() => setIsPeriodPickerOpen(value => !value)} className="shrink-0 rounded-lg p-1 text-slate-900 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><CalendarDays className="h-6 w-6" strokeWidth={2.5} /></button>{isPeriodPickerOpen && <div className="absolute left-0 top-10 z-20 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-dark-app-border dark:bg-dark-app-surface"><select aria-label="Mês" value={start.getMonth()} onChange={e => { const month = Number(e.target.value); setDateRange({ start: formatDate(new Date(start.getFullYear(), month, 1)), end: formatDate(new Date(start.getFullYear(), month + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><select aria-label="Ano" value={start.getFullYear()} onChange={e => { const year = Number(e.target.value); setDateRange({ start: formatDate(new Date(year, start.getMonth(), 1)), end: formatDate(new Date(year, start.getMonth() + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{Array.from({ length: 11 }, (_, index) => start.getFullYear() - 5 + index).map(year => <option key={year} value={year}>{year}</option>)}</select></div>}</div><div className="mx-auto flex items-center gap-0.5"><button aria-label="Mês anterior" onClick={() => moveMonth(-1)} className="shrink-0 p-1"><ChevronLeft className="h-6 w-6" /></button><span className="shrink-0 whitespace-nowrap text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{MONTHS[start.getMonth()]}/{String(start.getFullYear()).slice(-2)}</span><button aria-label="Próximo mês" onClick={() => moveMonth(1)} className="shrink-0 p-1"><ChevronRight className="h-6 w-6" /></button></div><button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-50 dark:hover:bg-dark-app-surface-secondary"><Grid3X3 className="h-6 w-6" /></button></div></div>
    <div className="border-b border-slate-100 px-6 py-4 dark:border-dark-app-border"><h2 className="text-2xl font-normal text-slate-500 dark:text-dark-app-text-secondary">Movimentações do mês</h2></div>
    <div className="divide-y divide-slate-100 dark:divide-dark-app-border">{rows.map(row => <div key={row.label} className="flex items-center justify-between px-6 py-5"><div className="flex items-center gap-3 text-lg font-normal text-slate-800 dark:text-dark-app-text-primary"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${row.color} text-sm font-bold text-white`}>{row.icon}</span>{row.label}</div><span className="text-lg font-normal text-slate-800 dark:text-dark-app-text-primary">{money(row.value)}</span></div>)}<button onClick={onOpenHorizon} className="flex w-full items-center gap-3 px-6 py-5 text-left text-lg font-normal text-slate-800 dark:text-dark-app-text-primary"><Grid2X2 size={22} className="text-slate-500" /> Ver todas</button></div>
  </section>;
};
export default TotalsView;
