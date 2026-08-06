import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CreditCard, DateRange, InitialBalance, Transaction, TransactionType } from '../types';
import { projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; initialBalance: InitialBalance; cards: CreditCard[]; currencySymbol: string; onBack: () => void; onAdd: (date?: string) => void; }
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthLabel = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', '/');

const BalanceHorizonView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, cards, currencySymbol, onBack, onAdd }) => {
  const anchor = parseDate(dateRange.start);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ x: number; y: number; axis: 'x' | 'y' | null }>({ x: 0, y: 0, axis: null });
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

  return <section className="flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-dark-app-border"><button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-dark-app-text-primary"><ArrowLeft size={26} /></button><h1 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Horizonte de saldos</h1><button onClick={() => onAdd(formatDate(months[activeIndex]?.month ?? anchor))} aria-label="Adicionar lançamento" className="rounded-xl p-2 text-slate-900 dark:text-dark-app-text-primary"><Plus size={30} /></button></header>
    <div ref={scrollRef} onScroll={handleScroll} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto"><div className="flex min-h-full" style={{ width: `${months.length * 100 / 3}%` }}>{months.map((item, index) => <div key={formatDate(item.month)} style={{ width: `${100 / months.length}%` }} className="min-w-0 shrink-0 border-r border-slate-200 dark:border-dark-app-border"><div className={`border-b border-slate-200 py-2 text-center text-lg font-normal dark:border-dark-app-border ${index === activeIndex ? 'bg-slate-900 text-white dark:bg-white dark:text-[#1E293B]' : 'bg-white text-slate-900 dark:bg-dark-app-surface dark:text-dark-app-text-primary'}`}>{monthLabel(item.month)}</div>{item.rows.map(row => <div key={`${index}-${row.day}`} className="grid grid-cols-[38%_62%] border-b border-slate-100 text-base dark:border-dark-app-border"><span className="bg-slate-50 px-2 py-3 font-normal text-slate-700 dark:bg-dark-app-surface dark:text-dark-app-text-secondary">{row.day}</span><span className={`px-2 py-3 text-right font-normal ${row.balance === 0 ? 'app-saldo-neutral' : row.balance < 0 ? 'app-saldo-negative' : 'app-saldo-positive'}`}>{formatBalance(row.balance)}</span></div>)}</div>)}</div></div>
  </section>;
};
export default BalanceHorizonView;
