import React, { useMemo, useRef, useState } from 'react';
import { Transaction, DateRange, CreditCard, EntryType, InitialBalance } from '../types';
import { groupTransactionsByDate, projectTransactionsWithBalance, getTransactionEntryType } from '../utils/finance';
import { getCurrentMonthRange } from '../utils/currentPeriod';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import FilterPill from './FilterPill';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  initialBalance: InitialBalance;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
  cards?: CreditCard[];
  onDayClick?: (date: string, group: EntryType) => void;
  compactHeader?: boolean;
  onOpenHorizon?: () => void;
}

const formatLocalYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DailyBalanceView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, currencySymbol, cards = [], onDayClick, compactHeader = false, onOpenHorizon }) => {
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 430);
  const useCompactHeader = compactHeader || isNarrowViewport;
  const [typeFilter, setTypeFilter] = useState('ALL');
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  React.useEffect(() => {
    const updateViewport = () => setIsNarrowViewport(window.innerWidth <= 430);
    window.addEventListener('resize', updateViewport);
    updateViewport();
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const allDailyTypes = [
    { key: 'INCOME', label: 'Entrada', color: 'text-emerald-600', circle: 'bg-emerald-500', icon: 'INCOME' },
    { key: 'EXPENSE', label: 'Saída', color: 'text-rose-600', circle: 'bg-rose-500', icon: 'EXPENSE' },
    { key: 'SAVINGS', label: 'Economia', color: 'text-lime-600', circle: 'bg-lime-500', icon: 'E' },
    { key: 'CARD', label: 'Gasto com cartão', color: 'text-violet-600', circle: 'bg-violet-600', icon: 'C' },
  ];

  const moveMonth = (delta: number) => {
    const date = parseLocalDate(dateRange.start);
    date.setMonth(date.getMonth() + delta);
    const start = formatLocalYYYYMMDD(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = formatLocalYYYYMMDD(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    setDateRange({ start, end });
  };
  const goToCurrentMonth = () => setDateRange(getCurrentMonthRange());

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
    swipeStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
    const distanceY = (event.changedTouches[0]?.clientY ?? swipeStartY.current ?? 0) - (swipeStartY.current ?? 0);
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(distance) >= 50 && Math.abs(distance) > Math.abs(distanceY)) moveMonth(distance < 0 ? 1 : -1);
  };

  const filteredAndSortedReport = useMemo(() => {
    const start = parseLocalDate(dateRange.start);
    const end = parseLocalDate(dateRange.end);
    const projection = projectTransactionsWithBalance(transactions, dateRange.start, dateRange.end, cards);
    const projected = projection.transactions;
    const projectedByDate = groupTransactionsByDate(projected);
    let runningBalance = initialBalance.amount + projection.beforeStartBalanceDelta;

    const report: Array<{
      date: string;
      day: number;
      income: number;
      expense: number;
      amounts: Record<string, number>;
      balance: number;
    }> = [];

    const days: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      days.push(formatLocalYYYYMMDD(curr));
      curr.setDate(curr.getDate() + 1);
    }

    days.forEach(dateStr => {
      const dayTs = projectedByDate.get(dateStr) || [];
      const inc = dayTs.reduce((acc, t) => getTransactionEntryType(t) === 'INCOME' ? acc + t.amount : acc, 0);
      const exp = dayTs.reduce((acc, t) => getTransactionEntryType(t) !== 'INCOME' ? acc + t.amount : acc, 0);
      runningBalance = runningBalance + inc - exp;
      report.push({
        date: dateStr,
        day: parseLocalDate(dateStr).getDate(),
        income: inc,
        expense: exp,
        amounts: allDailyTypes.reduce((acc, item) => {
          acc[item.key] = dayTs.reduce((sum, t) => (item.key === 'CARD' ? getTransactionEntryType(t) === 'CARD' : getTransactionEntryType(t) === item.key) ? sum + t.amount : sum, 0);
          return acc;
        }, {} as Record<string, number>),
        balance: runningBalance
      });
    });

    return report;
  }, [transactions, dateRange, initialBalance, cards]);

  const renderedRows: React.ReactNode[] = [];
  filteredAndSortedReport.forEach(day => {
    const visibleTypes = typeFilter === 'ALL' ? allDailyTypes : allDailyTypes.filter(item => item.key === typeFilter);
    visibleTypes.forEach((item, index) => {
      const isLastType = index === visibleTypes.length - 1;
      renderedRows.push(
        <tr key={`${day.date}-${item.key}`} className="group">
          {index === 0 && <td rowSpan={visibleTypes.length} className={`align-top border-b-2 border-slate-300 p-2 pt-3 text-center font-normal text-sm dark:border-dark-app-border ${day.date === formatLocalYYYYMMDD(new Date()) ? 'bg-slate-900 text-white dark:bg-dark-app-border dark:text-white' : 'bg-app-surface-secondary text-slate-700 dark:bg-dark-app-day-column dark:text-dark-app-text-secondary'}`}>{day.day}</td>}
          <td className={`p-2 ${isLastType ? 'border-b-2 border-slate-300 dark:border-dark-app-border' : 'border-b border-slate-200 dark:border-dark-app-border'}`}>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <button type="button" onClick={() => onDayClick?.(day.date, item.key as EntryType)} aria-label={`Adicionar ${item.label} no dia ${day.day}`} className={`type-icon-label inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer ${item.circle} text-white font-bold`}>
                {item.icon === 'INCOME' ? <ArrowDownLeft size={15} strokeWidth={3} /> : item.icon === 'EXPENSE' ? <ArrowUpRight size={15} strokeWidth={3} /> : item.icon === 'E' ? <span>E</span> : <span>C</span>}
              </button>
              <button type="button" onClick={() => onDayClick?.(day.date, item.key as EntryType)} className="min-w-0 flex-1 truncate bg-transparent text-right text-base font-normal text-slate-700 dark:text-dark-app-text-secondary whitespace-nowrap">
                {currencySymbol} {(day.amounts[item.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </button>
            </div>
          </td>
          {index === 0 && <td rowSpan={visibleTypes.length} className={`align-top border-b-2 border-slate-300 p-2 text-right text-base font-normal whitespace-nowrap dark:border-dark-app-border ${day.balance === 0 ? 'app-saldo-neutral' : day.balance > 0 ? 'app-saldo-positive' : 'app-saldo-negative'}`}>{currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
        </tr>
      );
    });
  });

  return (
    <div className="touch-pan-y flex h-full min-h-0 flex-col space-y-0 transition-colors duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="border-b border-slate-100 dark:border-dark-app-border transition-colors">
        <div className="relative flex h-[76px] shrink-0 flex-nowrap items-center gap-1 overflow-visible bg-white px-4 py-4 dark:bg-dark-app-surface">
          <button aria-label="Ir para o mês atual" onClick={goToCurrentMonth} className="shrink-0 rounded-lg p-1 text-slate-900 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-slate-700"><CalendarDays className="h-6 w-6" strokeWidth={2.5} /></button>
          <div className="mx-auto flex items-center gap-0.5">
            <button aria-label="Mês anterior" onClick={() => moveMonth(-1)} className="shrink-0 p-1"><ChevronLeft className="w-6 h-6" /></button>
            <span className="shrink-0 whitespace-nowrap text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{MONTHS[parseLocalDate(dateRange.start).getMonth()]}/{String(parseLocalDate(dateRange.start).getFullYear()).slice(-2)}</span>
            <button aria-label="Próximo mês" onClick={() => moveMonth(1)} className="shrink-0 p-1"><ChevronRight className="w-6 h-6" /></button>
          </div>
          <button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800"><Grid3X3 className="h-6 w-6" /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-white shadow-sm dark:bg-dark-app-surface-secondary">
        <div className="h-full overflow-x-hidden overflow-y-auto custom-scrollbar">
          <table className="w-full table-fixed border-collapse ">
            <thead className="border-t border-b border-slate-200 dark:border-dark-app-border">
              <tr className="bg-white dark:bg-dark-app-surface-secondary">
                <th className="w-[12%] bg-white px-2 py-3 text-left text-base font-medium text-slate-700 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary">Dia</th>
                <th className="w-[44%] bg-white px-2 py-3 dark:bg-dark-app-surface-secondary">
                  <div className="flex justify-start">
                    <FilterPill typeFilter aria-label="Filtrar por tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="ALL">Todas</option>
                        {allDailyTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </FilterPill>
                  </div>
                </th>
                <th className="w-[44%] bg-white p-2 text-right text-base font-medium text-slate-700 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary whitespace-nowrap">Saldos</th>
              </tr>
            </thead>
            <tbody>
              {renderedRows}
              {filteredAndSortedReport.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-400 italic text-xs">Nenhum registro encontrado para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyBalanceView;
