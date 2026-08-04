import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CreditCard, DateRange, InitialBalance, Transaction, TransactionType } from '../types';
import { projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; initialBalance: InitialBalance; cards: CreditCard[]; currencySymbol: string; onBack: () => void; onAdd: () => void; }
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthLabel = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', '/');

const BalanceHorizonView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, cards, currencySymbol, onBack, onAdd }) => {
  const anchor = parseDate(dateRange.start);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(12);
  const months = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth() - 12, 1, 12);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 13, 0, 12);
    const projected = projectTransactions(transactions, '0000-01-01', formatDate(last), cards);
    let balance = initialBalance.amount + projected.filter(t => parseDate(t.date) < first).reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
    return Array.from({ length: 25 }, (_, index) => {
      const month = new Date(first.getFullYear(), first.getMonth() + index, 1, 12);
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const rows = Array.from({ length: days }, (_, dayIndex) => {
        const date = formatDate(new Date(month.getFullYear(), month.getMonth(), dayIndex + 1, 12));
        balance += projected.filter(t => t.date === date).reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
        return { day: dayIndex + 1, balance };
      });
      return { month, rows };
    });
  }, [transactions, dateRange, initialBalance, cards]);

  const monthWidth = () => scrollRef.current ? scrollRef.current.clientWidth / 3 : 0;
  const scrollToIndex = (index: number) => scrollRef.current?.scrollTo({ left: Math.max(0, Math.min(index, months.length - 3) * monthWidth()), behavior: 'smooth' });
  const moveMonth = (delta: number) => {
    const next = Math.max(0, Math.min(months.length - 3, activeIndex + delta));
    setActiveIndex(next);
    scrollToIndex(next);
  };

  useEffect(() => { const timer = window.setTimeout(() => scrollToIndex(12), 0); return () => window.clearTimeout(timer); }, []);
  const handleScroll = () => { const width = monthWidth(); if (!width) return; const index = Math.round((scrollRef.current?.scrollLeft ?? 0) / width); setActiveIndex(Math.max(0, Math.min(index, months.length - 3))); };

  const formatBalance = (balance: number) => {
    if (Math.abs(balance) >= 1000) {
      const abbreviated = balance / 1000;
      return `${abbreviated.toFixed(abbreviated % 1 === 0 ? 0 : 2).replace('.', ',')}K`;
    }
    return balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return <section className="min-h-full bg-white dark:bg-slate-950">
    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800"><button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-white"><ArrowLeft size={26} /></button><h1 className="text-2xl font-black text-slate-900 dark:text-white">Horizonte de saldos</h1><button onClick={onAdd} aria-label="Adicionar lançamento" className="rounded-xl p-2 text-slate-900 dark:text-white"><Plus size={30} /></button></header>
    <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x"><div className="flex min-w-0">{months.map((item, index) => <div key={formatDate(item.month)} className="w-1/3 min-w-[33.333333%] shrink-0 snap-start border-r border-slate-200 dark:border-slate-800"><div className={`border-b border-slate-200 py-2 text-center text-lg font-normal dark:border-slate-800 ${index === activeIndex ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'}`}>{monthLabel(item.month)}</div>{item.rows.map(row => <div key={`${index}-${row.day}`} className="grid grid-cols-[38%_62%] border-b border-slate-100 text-sm dark:border-slate-800"><span className="bg-slate-50 px-2 py-3 font-normal text-slate-700 dark:bg-slate-900 dark:text-slate-300">{row.day}</span><span className={`px-2 py-3 text-right font-normal ${row.balance === 0 ? 'bg-amber-100 text-slate-900 dark:bg-amber-950/40 dark:text-amber-200' : row.balance < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'bg-emerald-300 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100'}`}>{formatBalance(row.balance)}</span></div>)}</div>)}</div></div>
  </section>;
};
export default BalanceHorizonView;
