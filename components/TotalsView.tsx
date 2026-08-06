import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Grid2X2 } from 'lucide-react';
import { CreditCard, DateRange, FinancialGroup, Transaction, TransactionType } from '../types';
import { getFinancialGroup, projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; cards: CreditCard[]; currencySymbol: string; onOpenHorizon: () => void; }
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };

const TotalsView: React.FC<Props> = ({ transactions, dateRange, setDateRange, cards, currencySymbol, onOpenHorizon }) => {
  const start = parseDate(dateRange.start);
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
  return <section className="min-h-full bg-white dark:bg-[#2f333b]">
    <header className="flex h-20 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-700"><button aria-label="Selecionar mês" className="relative rounded-lg p-1 text-slate-900 dark:text-white"><CalendarDays size={30} /><span className="absolute inset-x-0 bottom-1 text-xs font-bold">{start.getDate()}</span></button><div className="flex items-center gap-3"><button aria-label="Mês anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={25} /></button><span className="text-2xl font-bold text-slate-900 dark:text-white">{start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')}</span><button aria-label="Próximo mês" onClick={() => moveMonth(1)}><ChevronRight size={25} /></button></div><button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="text-amber-300"><Grid2X2 size={30} /></button></header>
    <div className="border-b border-slate-100 py-24 dark:border-slate-700"><h2 className="px-6 text-2xl font-normal text-slate-500 dark:text-slate-300">Movimentações do mês</h2></div>
    <div className="divide-y divide-slate-100 dark:divide-slate-700">{rows.map(row => <div key={row.label} className="flex items-center justify-between px-6 py-5"><div className="flex items-center gap-3 text-lg font-normal text-slate-800 dark:text-slate-100"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${row.color} text-sm font-bold text-white`}>{row.icon}</span>{row.label}</div><span className="text-lg font-normal text-slate-800 dark:text-slate-100">{money(row.value)}</span></div>)}<button onClick={onOpenHorizon} className="flex w-full items-center gap-3 px-6 py-5 text-left text-lg font-normal text-slate-800 dark:text-slate-100"><Grid2X2 size={22} className="text-slate-500" /> Ver todas</button></div>
  </section>;
};
export default TotalsView;
