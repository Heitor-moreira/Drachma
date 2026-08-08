
import React, { useMemo, useRef, useState } from 'react';
import { Transaction, TransactionType, DateRange, CreditCard, FinancialGroup } from '../types';
import { projectTransactions, getFinancialGroup } from '../finance';
import { 
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown
  , SlidersHorizontal
  , Grid3X3
  , Grid2X2
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
  cards?: CreditCard[];
  onDayClick?: (date: string, group: FinancialGroup | 'CARD') => void;
  liteMode?: boolean;
  compactHeader?: boolean;
  onOpenHorizon?: () => void;
}

// Helper to handle dates locally without UTC shifts
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

const DailyBalanceView: React.FC<Props> = ({ transactions, dateRange, setDateRange, currencySymbol, cards = [], onDayClick, liteMode = false, compactHeader = false, onOpenHorizon }) => {
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 430);
  const useCompactHeader = compactHeader || isNarrowViewport;

  React.useEffect(() => {
    const updateViewport = () => setIsNarrowViewport(window.innerWidth <= 430);
    window.addEventListener('resize', updateViewport);
    updateViewport();
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Para a visão de planilha, a ordem padrão é cronológica (mais antigo no topo)
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const allDailyTypes = [
    { key: FinancialGroup.PERSONAL_INCOME, label: 'Entrada', color: 'text-emerald-600', circle: 'bg-emerald-500', icon: 'INCOME' },
    { key: FinancialGroup.PERSONAL_EXPENSE, label: 'Saída', color: 'text-rose-600', circle: 'bg-rose-500', icon: 'EXPENSE' },
    { key: FinancialGroup.SAVINGS, label: 'Economia', color: 'text-lime-600', circle: 'bg-lime-500', icon: 'E' },
    { key: 'CARD', label: 'Gasto com cartão', color: 'text-violet-600', circle: 'bg-violet-600', icon: 'C' },
  ];
  const dailyTypes = liteMode ? allDailyTypes : allDailyTypes;
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const moveMonth = (delta: number) => {
    const date = parseLocalDate(dateRange.start);
    date.setMonth(date.getMonth() + delta);
    const start = formatLocalYYYYMMDD(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = formatLocalYYYYMMDD(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    setDateRange({ start, end });
  };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { swipeStartX.current = event.touches[0]?.clientX ?? null; swipeStartY.current = event.touches[0]?.clientY ?? null; };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
    const distanceY = (event.changedTouches[0]?.clientY ?? swipeStartY.current ?? 0) - (swipeStartY.current ?? 0);
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(distance) >= 50 && Math.abs(distance) > Math.abs(distanceY)) moveMonth(distance < 0 ? 1 : -1);
  };

  React.useEffect(() => {
    if (liteMode && typeFilter !== 'ALL' && !dailyTypes.some(item => item.key === typeFilter)) {
      setTypeFilter('ALL');
    }
  }, [liteMode, dailyTypes, typeFilter]);

  const filteredAndSortedReport = useMemo(() => {
    const start = parseLocalDate(dateRange.start);
    const end = parseLocalDate(dateRange.end);
    
    const projected = projectTransactions(transactions, '0000-01-01', dateRange.end, cards);
    let runningBalance = projected
      .filter(t => parseLocalDate(t.date) < start)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

    const report: any[] = [];
    const days: string[] = [];
    
    const curr = new Date(start);
    while (curr <= end) {
      days.push(formatLocalYYYYMMDD(curr));
      curr.setDate(curr.getDate() + 1);
    }

    days.forEach(dateStr => {
      const dayTs = projected.filter(t => t.date === dateStr);
      const inc = dayTs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const exp = dayTs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      runningBalance = runningBalance + inc - exp;
      report.push({
        date: dateStr,
        day: parseLocalDate(dateStr).getDate(),
        income: inc,
        expense: exp,
        amounts: dailyTypes.reduce((acc, item) => { acc[item.key] = dayTs.filter(t => item.key === 'CARD' ? t.paymentMethod === 'CREDIT_CARD' : getFinancialGroup(t) === item.key).reduce((sum, t) => sum + t.amount, 0); return acc; }, {} as Record<string, number>),
        balance: runningBalance
      });
    });

    return report;
  }, [transactions, dateRange, cards]);

  return (
    <div className="touch-pan-y space-y-0 transition-colors duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Cabeçalho mensal */}
      <div className="border-b border-slate-100 dark:border-dark-app-border transition-colors">
          <div className="relative flex min-h-[76px] flex-nowrap items-center gap-1 overflow-visible bg-white px-4 py-4 dark:bg-dark-app-surface">
          <div
            className="relative shrink-0"
            tabIndex={-1}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPeriodPickerOpen(false);
            }}
          >
            <button aria-label="Selecionar mês e ano" onClick={() => setIsPeriodPickerOpen(value => !value)} className="shrink-0 rounded-lg p-1 text-slate-900 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-slate-700"><CalendarDays className="h-6 w-6" strokeWidth={2.5} /></button>
            {isPeriodPickerOpen && <div className="absolute left-0 top-10 z-20 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-dark-app-border dark:bg-dark-app-surface"><select aria-label="Mês" value={parseLocalDate(dateRange.start).getMonth()} onChange={e => { const d = parseLocalDate(dateRange.start); const month = Number(e.target.value); setDateRange({ start: formatLocalYYYYMMDD(new Date(d.getFullYear(), month, 1)), end: formatLocalYYYYMMDD(new Date(d.getFullYear(), month + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><select aria-label="Ano" value={parseLocalDate(dateRange.start).getFullYear()} onChange={e => { const year = Number(e.target.value); const d = parseLocalDate(dateRange.start); setDateRange({ start: formatLocalYYYYMMDD(new Date(year, d.getMonth(), 1)), end: formatLocalYYYYMMDD(new Date(year, d.getMonth() + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{Array.from({ length: 11 }, (_, index) => parseLocalDate(dateRange.start).getFullYear() - 5 + index).map(year => <option key={year} value={year}>{year}</option>)}</select></div>}
          </div>
          <div className="mx-auto flex items-center gap-0.5">
            <button aria-label="Mês anterior" onClick={() => moveMonth(-1)} className="shrink-0 p-1"><ChevronLeft className="w-6 h-6" /></button>
            <span className="shrink-0 whitespace-nowrap text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{MONTHS[parseLocalDate(dateRange.start).getMonth()]}/{String(parseLocalDate(dateRange.start).getFullYear()).slice(-2)}</span>
            <button aria-label="Próximo mês" onClick={() => moveMonth(1)} className="shrink-0 p-1"><ChevronRight className="w-6 h-6" /></button>
          </div>
          <button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800"><Grid3X3 className="h-6 w-6" /></button>
        </div>
      </div>

      {/* Visualização de Planilha */}
      <div className="bg-white dark:bg-dark-app-surface-secondary shadow-sm overflow-hidden">
        <div className="overflow-x-hidden max-h-[calc(100dvh-7.5rem)] custom-scrollbar">
          <table className="w-full table-fixed border-collapse ">
            <thead className="border-b border-slate-200 dark:border-dark-app-border">
              <tr className="bg-white dark:bg-dark-app-surface-secondary">
                <th className="w-[12%] py-3 px-2 bg-white text-left font-normal text-slate-700 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary uppercase text-xs">Dia</th>
                <th className="w-[58%] bg-white px-2 py-3 dark:bg-dark-app-surface-secondary"><div className="flex justify-start"><div className="relative flex min-w-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-dark-app-border"><Grid2X2 className="h-4 w-4 shrink-0 text-slate-500 dark:text-dark-app-text-secondary" /><select aria-label="Filtrar por tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="min-w-0 w-full appearance-none bg-transparent pr-5 text-base font-normal text-slate-700 outline-none dark:text-dark-app-text-primary"><option value="ALL">Todas</option>{dailyTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500 dark:text-dark-app-text-secondary" /></div></div></th>
                <th className="w-[30%] p-2 bg-white text-right font-normal text-slate-700 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary uppercase text-lg whitespace-nowrap">Saldos</th>
              </tr>
            </thead>
            <tbody>
                {filteredAndSortedReport.map((day) => { const visibleTypes = typeFilter === 'ALL' ? dailyTypes : dailyTypes.filter(item => item.key === typeFilter); return visibleTypes.map((item, index) => <tr key={`${day.date}-${item.key}`} className="group">
                {index === 0 && <td rowSpan={visibleTypes.length} className="align-top p-2 pt-3 border-b border-slate-200 bg-slate-100/70 text-center font-normal text-slate-700 dark:border-dark-app-border dark:bg-dark-app-surface-secondary/70 dark:text-dark-app-text-secondary text-sm">{day.day}</td>}
                <td className="p-2 border-b border-slate-200 dark:border-dark-app-border"><div className="flex min-w-0 items-center justify-between gap-2"><button type="button" onClick={() => onDayClick?.(day.date, item.key as FinancialGroup)} aria-label={`Adicionar ${item.label} no dia ${day.day}`} className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer ${item.circle} text-base text-white font-bold`}>{item.icon === 'INCOME' ? <ArrowDownLeft size={18} strokeWidth={3} /> : item.icon === 'EXPENSE' ? <ArrowUpRight size={18} strokeWidth={3} /> : item.icon === 'E' ? <span>E</span> : <span>C</span>}</button><button type="button" onClick={() => onDayClick?.(day.date, item.key as FinancialGroup)} className="min-w-0 flex-1 truncate bg-transparent text-right text-base font-normal text-slate-700 dark:text-dark-app-text-secondary whitespace-nowrap">{currencySymbol} {(day.amounts[item.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</button></div></td>
                {index === 0 && <td rowSpan={visibleTypes.length} className={`p-2 border-b border-slate-200 dark:border-dark-app-border text-right text-base font-normal whitespace-nowrap ${day.balance === 0 ? 'app-saldo-neutral' : day.balance > 0 ? 'app-saldo-positive' : 'app-saldo-negative'}`}>{currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
              </tr>); })}
              {filteredAndSortedReport.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-400 italic text-xs">
                    Nenhum registro encontrado para este período.
                  </td>
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
