import React, { useMemo, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CreditCard, DateRange, InitialBalance, Transaction, TransactionType } from '../types';
import { projectTransactions } from '../finance';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  initialBalance: InitialBalance;
  cards: CreditCard[];
  currencySymbol: string;
  onBack: () => void;
  onAdd: () => void;
}

const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', '/');

const BalanceHorizonView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, cards, currencySymbol, onBack, onAdd }) => {
  const anchor = parseDate(dateRange.start);
  const months = useMemo(() => {
    const firstMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const lastMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 3, 0, 12);
    const projected = projectTransactions(transactions, '0000-01-01', formatDate(lastMonth), cards);
    let carriedBalance = initialBalance.amount + projected
      .filter(transaction => parseDate(transaction.date) < firstMonth)
      .reduce((sum, transaction) => sum + (transaction.type === TransactionType.INCOME ? transaction.amount : -transaction.amount), 0);

    return Array.from({ length: 3 }, (_, monthIndex) => {
      const month = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + monthIndex, 1, 12);
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const rows = Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const date = formatDate(new Date(month.getFullYear(), month.getMonth(), dayIndex + 1, 12));
        const total = projected.filter(transaction => transaction.date === date)
          .reduce((sum, transaction) => sum + (transaction.type === TransactionType.INCOME ? transaction.amount : -transaction.amount), 0);
        carriedBalance += total;
        return { day: dayIndex + 1, balance: carriedBalance };
      });
      return { month, rows };
    });
  }, [transactions, dateRange, initialBalance, cards]);

  const moveMonth = (delta: number) => {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1, 12);
    setDateRange({ start: formatDate(next), end: formatDate(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12)) });
  };
  const swipeStartX = useRef<number | null>(null);
  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => { swipeStartX.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (swipeStartX.current === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) >= 50) moveMonth(distance < 0 ? 1 : -1);
  };

  return <section className="min-h-full touch-pan-y bg-white dark:bg-slate-950" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-5 dark:border-slate-800">
      <button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-white"><ArrowLeft size={26} /></button>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Horizonte de saldos</h1>
      <button onClick={onAdd} aria-label="Adicionar lançamento" className="rounded-xl p-2 text-slate-900 dark:text-white"><Plus size={30} /></button>
    </header>

    <div className="flex items-center border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button onClick={() => moveMonth(-1)} aria-label="Meses anteriores" className="shrink-0 p-3 text-slate-700 dark:text-slate-200"><ChevronLeft size={24} /></button>
      <div className="grid min-w-0 flex-1 grid-cols-3 text-center text-xl font-black">
        {months.map((item, index) => <button key={formatDate(item.month)} onClick={() => index > 0 && moveMonth(index)} className={`py-5 ${index === 0 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>{monthName(item.month)}</button>)}
      </div>
      <button onClick={() => moveMonth(1)} aria-label="Próximos meses" className="shrink-0 p-3 text-slate-700 dark:text-slate-200"><ChevronRight size={24} /></button>
    </div>

    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
        {months.map((item, monthIndex) => <div key={formatDate(item.month)}>
          <div className="grid grid-cols-[38%_62%] bg-slate-100 px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300"><span>Dia</span><span className="text-right">Saldo</span></div>
          <div>{item.rows.map(row => <div key={`${monthIndex}-${row.day}`} className="grid grid-cols-[38%_62%] border-b border-slate-100 dark:border-slate-800"><span className="bg-slate-50 px-3 py-4 text-lg font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300">{row.day}</span><span className={`px-3 py-4 text-right text-lg font-black ${row.balance < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : row.balance === 0 ? 'bg-amber-100 text-slate-900 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-emerald-300 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100'}`}>{currencySymbol} {row.balance >= 1000 ? `${(row.balance / 1000).toFixed(2)}K` : row.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>)}</div>
        </div>)}
      </div>
    </div>
  </section>;
};

export default BalanceHorizonView;
