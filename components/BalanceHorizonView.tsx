import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { CreditCard, DateRange, FinancialGroup, InitialBalance, Transaction } from '../types';
import { getTransactionEntryType, projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; initialBalance: InitialBalance; cards: CreditCard[]; currencySymbol: string; onBack: () => void; onAdd: (group: FinancialGroup | 'CARD', date: string) => void; onDayClick?: (date: string) => void; }
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => formatDate(new Date());
const monthLabel = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', '/');

const BalanceHorizonView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, cards, currencySymbol, onBack, onAdd, onDayClick }) => {
  const anchor = parseDate(dateRange.start);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ x: number; y: number; axis: 'x' | 'y' | null }>({ x: 0, y: 0, axis: null });
  const currentYear = new Date().getFullYear();
  const selectedMonthIndex = (anchor.getFullYear() - (currentYear - 5)) * 12 + anchor.getMonth();
  const horizonStartIndex = Math.max(0, Math.min(11 * 12 - 3, selectedMonthIndex));
  const [activeIndex, setActiveIndex] = useState(horizonStartIndex);
  const [addMenuDate, setAddMenuDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const months = useMemo(() => {
    const first = new Date(currentYear - 5, 0, 1, 12);
    const last = new Date(currentYear + 6, 0, 0, 12);
    const projected = projectTransactions(transactions, '0000-01-01', formatDate(last), cards);
    const transactionDates = new Set(projected.map(t => t.date));
    let balance = initialBalance.amount + projected.filter(t => parseDate(t.date) < first).reduce((sum, t) => sum + (getTransactionEntryType(t) === 'INCOME' ? t.amount : -t.amount), 0);
    return Array.from({ length: 11 * 12 }, (_, index) => {
      const month = new Date(first.getFullYear(), first.getMonth() + index, 1, 12);
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const rows = Array.from({ length: days }, (_, dayIndex) => {
        const date = formatDate(new Date(month.getFullYear(), month.getMonth(), dayIndex + 1, 12));
        balance += projected.filter(t => t.date === date).reduce((sum, t) => sum + (getTransactionEntryType(t) === 'INCOME' ? t.amount : -t.amount), 0);
        return { day: dayIndex + 1, balance, hasTransactions: transactionDates.has(date) };
      });
      return { month, rows };
    });
  }, [transactions, currentYear, initialBalance, cards]);

  const monthWidth = () => scrollRef.current ? scrollRef.current.clientWidth / 3 : 0;
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => scrollRef.current?.scrollTo({ left: Math.max(0, Math.min(index, months.length - 3) * monthWidth()), behavior });
  const moveMonth = (delta: number) => {
    const next = Math.max(0, Math.min(months.length - 3, activeIndex + delta));
    setActiveIndex(next);
    scrollToIndex(next);
  };

  useLayoutEffect(() => { scrollToIndex(horizonStartIndex, 'auto'); }, [horizonStartIndex, months.length]);
  const handleScroll = () => { const width = monthWidth(); if (!width) return; const index = Math.round((scrollRef.current?.scrollLeft ?? 0) / width); setActiveIndex(Math.max(0, Math.min(index, months.length - 3))); };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { const touch = event.touches[0]; gestureRef.current = { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0, axis: null }; };
  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    const gesture = gestureRef.current;
    if (!gesture.axis) {
      const dx = Math.abs(touch.clientX - gesture.x);
      const dy = Math.abs(touch.clientY - gesture.y);
      if (Math.max(dx, dy) < 8) return;
      gesture.axis = dx > dy ? 'x' : 'y';
    }
    if (gesture.axis === 'x') event.preventDefault();
  };

  const formatBalance = (balance: number) => {
    if (Math.abs(balance) >= 1000) {
      const abbreviated = balance / 1000;
      return `${abbreviated.toFixed(abbreviated % 1 === 0 ? 0 : 2).replace('.', ',')}K`;
    }
    return balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return <section className="relative flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-dark-app-border"><button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-dark-app-text-primary"><ArrowLeft size={26} /></button><h1 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Horizonte de saldos</h1><button onClick={() => setAddMenuDate(formatDate(months[activeIndex]?.month ?? anchor))} aria-label="Adicionar lançamento" className="rounded-xl p-2 text-slate-900 dark:text-dark-app-text-primary"><Plus size={30} /></button></header>
    <div ref={scrollRef} onScroll={handleScroll} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto"><div className="flex min-h-full" style={{ width: `${months.length * 100 / 3}%` }}>{months.map((item, index) => <div key={formatDate(item.month)} style={{ width: `${100 / months.length}%` }} className="min-w-0 shrink-0 border-r border-slate-200 dark:border-dark-app-border"><div className={`border-b border-slate-200 py-2 text-center text-lg font-normal dark:border-dark-app-border ${index === activeIndex ? 'bg-slate-900 text-white dark:bg-white dark:text-[#1E293B]' : 'bg-white text-slate-900 dark:bg-dark-app-surface dark:text-dark-app-text-primary'}`}>{monthLabel(item.month)}</div>{item.rows.map(row => { const rowDate = formatDate(new Date(item.month.getFullYear(), item.month.getMonth(), row.day, 12)); const isSelected = selectedDate === rowDate; const isToday = today() === rowDate; return <div key={`${index}-${row.day}`} className="grid grid-cols-[38%_62%] border-b border-slate-200 text-base dark:border-dark-app-border"><button type="button" style={{ outline: 'none', boxShadow: 'none' }} onClick={() => { setSelectedDate(rowDate); onDayClick?.(rowDate); }} className={`px-2 py-3 text-left font-normal outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${isSelected || isToday ? 'border-r-0 bg-slate-900 text-white dark:bg-slate-900 dark:text-white' : row.hasTransactions ? 'border-r border-slate-200 bg-slate-100 text-slate-700 dark:border-dark-app-border dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary' : 'border-r border-slate-200 bg-slate-50 text-slate-700 dark:border-dark-app-border dark:bg-dark-app-surface dark:text-dark-app-text-secondary'}`}>{row.day}</button><button type="button" onClick={() => setAddMenuDate(rowDate)} className={`px-2 py-3 text-right font-normal ${row.balance === 0 ? 'app-saldo-neutral' : row.balance < 0 ? 'app-saldo-negative' : 'app-saldo-positive'}`}>{formatBalance(row.balance)}</button></div>; })}</div>)}</div></div>
    {addMenuDate && <div className="absolute inset-0 z-30 flex items-end bg-slate-900/40 backdrop-blur-sm"><div className="w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-dark-app-surface"><div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-dark-app-border"><h2 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Adicionar</h2><button onClick={() => setAddMenuDate(null)} aria-label="Fechar" className="rounded-xl p-2 text-slate-500"><X size={28} /></button></div>{[{ label: 'Entrada', description: 'Salário, comissão, vales', group: FinancialGroup.PERSONAL_INCOME, icon: <ArrowDownLeft size={22} />, color: 'bg-emerald-500' }, { label: 'Saída', description: 'Gastos fixos, boletos, aluguel', group: FinancialGroup.PERSONAL_EXPENSE, icon: <ArrowUpRight size={22} />, color: 'bg-rose-600' }, { label: 'Economia', description: 'Reserva, investimento', group: FinancialGroup.SAVINGS, icon: <span className="text-2xl font-bold">E</span>, color: 'bg-lime-500' }, { label: 'Gasto com cartão', description: 'Gastos ou total da fatura', group: 'CARD' as const, icon: <span className="text-2xl font-bold">C</span>, color: 'bg-violet-600' }].map(option => <button type="button" key={option.label} onClick={() => { onAdd(option.group, addMenuDate); setAddMenuDate(null); }} className="flex w-full items-center gap-4 border-b border-slate-100 px-6 py-5 text-left dark:border-dark-app-border"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${option.color} text-white`}>{option.icon}</span><span><strong className="block text-base font-bold text-slate-900 dark:text-dark-app-text-primary">{option.label}</strong><span className="mt-1 block text-sm text-slate-500 dark:text-dark-app-text-secondary">{option.description}</span></span></button>)}</div></div>}
  </section>;
};
export default BalanceHorizonView;
