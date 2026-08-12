import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreditCard, Transaction } from '../types';
import { getTransactionEntryType, projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; cards: CreditCard[]; currencySymbol: string; initialYear: number; onBack: () => void; }

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const SavedAnnualView: React.FC<Props> = ({ transactions, cards, currencySymbol, initialYear, onBack }) => {
  const [year, setYear] = useState(initialYear);
  const yearBounds = { min: new Date().getFullYear() - 5, max: new Date().getFullYear() + 5 };
  const annualData = useMemo(() => {
    const start = new Date(year, 0, 1, 12);
    const end = new Date(year, 11, 31, 12);
    const projected = projectTransactions(transactions, formatDate(start), formatDate(end), cards);
    const total = (month: number, type: 'INCOME' | 'SAVINGS') => projected
      .filter(transaction => { const date = new Date(`${transaction.date}T12:00:00`); return date.getMonth() === month && getTransactionEntryType(transaction) === type; })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const months = MONTHS.map((name, month) => ({ name, income: total(month, 'INCOME'), savings: total(month, 'SAVINGS') }));
    return { months, income: months.reduce((sum, month) => sum + month.income, 0), savings: months.reduce((sum, month) => sum + month.savings, 0) };
  }, [cards, transactions, year]);
  const percentage = annualData.income > 0 ? Math.min(100, Math.max(0, (annualData.savings / annualData.income) * 100)) : 0;
  const money = (value: number) => `${currencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const symbol = (content: React.ReactNode, color: string) => <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>{content}</span>;
  const progress = (value: number, income: number) => income > 0 ? Math.min(100, Math.max(0, (value / income) * 100)) : 0;

  return <section className="flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <header className="flex min-h-[76px] items-center gap-2 border-b border-slate-100 px-4 py-4 dark:border-dark-app-border">
      <button type="button" onClick={onBack} aria-label="Voltar para Totais" className="rounded-lg p-1 text-slate-800 dark:text-dark-app-text-primary"><ArrowLeft className="h-6 w-6" /></button>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">Economizado</h1>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-dark-app-border">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-dark-app-border dark:bg-dark-app-surface-secondary">
          <button type="button" aria-label="Ano anterior" disabled={year <= yearBounds.min} onClick={() => setYear(value => Math.max(yearBounds.min, value - 1))} className="rounded-full p-1 text-slate-700 disabled:opacity-30 dark:text-dark-app-text-primary"><ChevronLeft className="h-6 w-6" /></button>
          <span className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{year}</span>
          <button type="button" aria-label="Próximo ano" disabled={year >= yearBounds.max} onClick={() => setYear(value => Math.min(yearBounds.max, value + 1))} className="rounded-full p-1 text-slate-700 disabled:opacity-30 dark:text-dark-app-text-primary"><ChevronRight className="h-6 w-6" /></button>
        </div>
      </div>
      <div className="border-b border-slate-100 px-6 py-5 dark:border-dark-app-border">
        <p className="text-sm font-bold text-slate-500 dark:text-dark-app-text-secondary">Total no ano</p>
        <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-dark-app-text-primary">{percentage.toFixed(0)}%</p>
        <div className="mt-5 flex items-center gap-2">
          {symbol('E', 'bg-lime-500')}
          <div className="h-4 min-w-0 flex-1 rounded-full border-2 border-lime-500 p-0.5 dark:border-lime-400"><div className="h-full rounded-full bg-lime-500 dark:bg-lime-400" style={{ width: `${percentage}%` }} /></div>
          {symbol(<ArrowDownLeft size={14} strokeWidth={3} />, 'bg-emerald-500')}
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div><p className="text-base font-bold text-slate-700 dark:text-dark-app-text-secondary">Economias</p><p className="text-base text-slate-800 dark:text-dark-app-text-primary">{money(annualData.savings)}</p></div>
          <div className="text-right"><p className="text-base font-bold text-slate-700 dark:text-dark-app-text-secondary">Entradas</p><p className="text-base text-slate-800 dark:text-dark-app-text-primary">{money(annualData.income)}</p></div>
        </div>
      </div>
      <div className="border-b border-slate-100 px-6 py-5 dark:border-dark-app-border"><h2 className="text-base font-bold text-slate-500 dark:text-dark-app-text-secondary">Total por mês</h2></div>
      {annualData.months.map(month => { const monthPercentage = progress(month.savings, month.income); return <div key={month.name} className="border-b border-slate-100 px-6 py-5 dark:border-dark-app-border">
        <div className="flex items-center justify-between"><h3 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">{month.name}</h3><span className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">{monthPercentage.toFixed(0)}%</span></div>
        <div className="mt-4 flex items-center gap-2">{symbol('E', 'bg-lime-500')}<div className="h-4 min-w-0 flex-1 rounded-full border-2 border-lime-500 p-0.5 dark:border-lime-400"><div className="h-full rounded-full bg-lime-500 dark:bg-lime-400" style={{ width: `${monthPercentage}%` }} /></div>{symbol(<ArrowDownLeft size={14} strokeWidth={3} />, 'bg-emerald-500')}</div>
        <div className="mt-3 flex items-start justify-between gap-4"><div><p className="text-base font-bold text-slate-500 dark:text-dark-app-text-secondary">Economias</p><p className="text-base text-slate-800 dark:text-dark-app-text-primary">{money(month.savings)}</p></div><div className="text-right"><p className="text-base font-bold text-slate-500 dark:text-dark-app-text-secondary">Entradas</p><p className="text-base text-slate-800 dark:text-dark-app-text-primary">{money(month.income)}</p></div></div>
      </div>; })}
    </div>
  </section>;
};

export default SavedAnnualView;
