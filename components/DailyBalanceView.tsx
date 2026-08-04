
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, DateRange, CreditCard, FinancialGroup } from '../types';
import { projectTransactions, getFinancialGroup } from '../finance';
import { 
  ArrowRightLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown
  , SlidersHorizontal
  , Grid3X3
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
  cards?: CreditCard[];
  onDayClick?: (date: string, group: FinancialGroup) => void;
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
    { key: FinancialGroup.PERSONAL_INCOME, label: 'Entrada', color: 'text-emerald-600', icon: '↙' },
    { key: FinancialGroup.PERSONAL_EXPENSE, label: 'Saída', color: 'text-rose-600', icon: '↗' },
    { key: FinancialGroup.SAVINGS, label: 'Economia', color: 'text-lime-600', icon: 'E' },
    { key: FinancialGroup.REIMBURSEMENT, label: 'Reembolso', color: 'text-cyan-600', icon: '↶' },
    { key: FinancialGroup.ADVANCE_TO_OTHERS, label: 'Adiantamento', color: 'text-orange-600', icon: '↔' }
  ];
  const dailyTypes = liteMode ? allDailyTypes.slice(0, 3) : allDailyTypes;

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
        amounts: dailyTypes.reduce((acc, item) => { acc[item.key] = dayTs.filter(t => getFinancialGroup(t) === item.key).reduce((sum, t) => sum + t.amount, 0); return acc; }, {} as Record<string, number>),
        balance: runningBalance
      });
    });

    return report;
  }, [transactions, dateRange, cards]);

  return (
    <div className="space-y-2 transition-colors duration-300">
      {/* Cabeçalho mensal */}
      <div className="border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="relative h-11 px-3 flex flex-nowrap items-center gap-1 overflow-visible bg-white dark:bg-slate-950">
          <div
            className="relative shrink-0"
            tabIndex={-1}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPeriodPickerOpen(false);
            }}
          >
            <button aria-label="Selecionar mês e ano" onClick={() => setIsPeriodPickerOpen(value => !value)} className="shrink-0 rounded-lg p-1 text-[#2687c5] hover:bg-[#e8f7e5]"><CalendarDays className="h-5 w-5" strokeWidth={2.5} /></button>
            {isPeriodPickerOpen && <div className="absolute left-0 top-10 z-20 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"><select aria-label="Mês" value={parseLocalDate(dateRange.start).getMonth()} onChange={e => { const d = parseLocalDate(dateRange.start); const month = Number(e.target.value); setDateRange({ start: formatLocalYYYYMMDD(new Date(d.getFullYear(), month, 1)), end: formatLocalYYYYMMDD(new Date(d.getFullYear(), month + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]">{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><select aria-label="Ano" value={parseLocalDate(dateRange.start).getFullYear()} onChange={e => { const year = Number(e.target.value); const d = parseLocalDate(dateRange.start); setDateRange({ start: formatLocalYYYYMMDD(new Date(year, d.getMonth(), 1)), end: formatLocalYYYYMMDD(new Date(year, d.getMonth() + 1, 0)) }); }} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-slate-800 dark:text-white dark:[color-scheme:dark]">{Array.from({ length: 11 }, (_, index) => parseLocalDate(dateRange.start).getFullYear() - 5 + index).map(year => <option key={year} value={year}>{year}</option>)}</select></div>}
          </div>
          <div className="mx-auto flex items-center gap-0.5">
            <button aria-label="Mês anterior" onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() - 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className="shrink-0 p-1"><ChevronLeft className="w-6 h-6" /></button>
            <span className="shrink-0 whitespace-nowrap text-xl font-black text-slate-800 dark:text-white">{MONTHS[parseLocalDate(dateRange.start).getMonth()]}/{String(parseLocalDate(dateRange.start).getFullYear()).slice(-2)}</span>
            <button aria-label="Próximo mês" onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() + 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className="shrink-0 p-1"><ChevronRight className="w-6 h-6" /></button>
          </div>
          <button aria-label="Abrir horizonte de saldos" onClick={onOpenHorizon} className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800"><Grid3X3 className="h-6 w-6" /></button>
        </div>
      </div>

      {/* Visualização de Planilha */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-hidden max-h-[calc(100vh-7.5rem)] custom-scrollbar">
          <table className="w-full table-fixed border-collapse" style={{ fontFamily: "'Courier New', Consolas, monospace" }}>
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="w-[12%] py-3 px-2 border-y-0 border-l-0 border-r border-slate-200 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-700/60 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px]">Dia</th>
                <th className="w-[58%] py-3 px-2 border-y-0 border-r border-slate-200 dark:border-slate-700"><div className="flex justify-center"><div className="relative flex items-center gap-1"><SlidersHorizontal className="w-4 h-4 text-slate-500" /><select aria-label="Filtrar por tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="min-w-0 max-w-[8rem] appearance-none bg-transparent pr-5 text-sm font-bold text-slate-700 outline-none dark:text-slate-200"><option value="ALL">Todas</option>{dailyTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-0 w-4 h-4 text-slate-500" /></div></div></th>
                <th className="w-[30%] p-2 border-y-0 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] whitespace-nowrap">Saldos</th>
              </tr>
            </thead>
            <tbody>
                {filteredAndSortedReport.map((day) => { const visibleTypes = typeFilter === 'ALL' ? dailyTypes : dailyTypes.filter(item => item.key === typeFilter); return visibleTypes.map((item, index) => <tr key={`${day.date}-${item.key}`} className="group">
                {index === 0 && <td rowSpan={visibleTypes.length} className="align-top p-2 pt-3 border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 text-center font-bold text-slate-700 dark:text-slate-300 text-sm transition-colors group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700/80">{day.day}</td>}
                <td onClick={() => onDayClick?.(day.date, item.key)} className="p-2 border border-slate-200 dark:border-slate-700 transition-colors group-hover:bg-slate-100/80 dark:group-hover:bg-slate-800/80 cursor-pointer"><div className="flex items-center justify-between gap-2"><span aria-label={item.label} className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10 ${item.color} font-black`}>{item.icon}</span><span className="text-right text-[clamp(11px,2.5vw,16px)] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{currencySymbol} {(day.amounts[item.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div></td>
                {index === 0 && <td rowSpan={visibleTypes.length} className={`p-2 border border-slate-200 dark:border-slate-700 text-right text-[clamp(9px,2.2vw,14px)] font-black whitespace-nowrap ${day.balance === 0 ? 'bg-amber-100 text-slate-900 dark:bg-amber-950/40 dark:text-amber-200' : day.balance > 0 ? 'bg-[#e8f7e5] text-[#238636] dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>{currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
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
