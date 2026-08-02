
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, DateRange, CreditCard, FinancialGroup } from '../types';
import { projectTransactions, getFinancialGroup } from '../finance';
import { 
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown
  , SlidersHorizontal
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

const DailyBalanceView: React.FC<Props> = ({ transactions, dateRange, setDateRange, currencySymbol, cards = [], onDayClick, liteMode = false, compactHeader = false }) => {
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
    <div className="space-y-6 transition-colors duration-300">
      {/* Cabeçalho mensal */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className={useCompactHeader ? 'p-2 flex flex-nowrap items-center justify-between gap-1 overflow-hidden border-b border-slate-100 dark:border-slate-800' : 'p-2 sm:p-4 grid grid-cols-[auto_auto_auto_auto_auto] items-center justify-between gap-0 sm:flex sm:flex-wrap sm:justify-between sm:gap-2 border-b border-slate-100 dark:border-slate-800'}>
          <Calendar className={useCompactHeader ? 'w-4 h-4 shrink-0 text-slate-500' : 'w-4 h-4 sm:w-5 sm:h-5 text-slate-500'} />
          <button onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() - 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className={useCompactHeader ? 'shrink-0 p-0.5' : 'justify-self-center p-1 sm:p-2'}><ChevronLeft className={useCompactHeader ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} /></button>
          <span className={useCompactHeader ? 'shrink-0 whitespace-nowrap text-base font-black text-slate-800 dark:text-white' : 'justify-self-center text-base sm:text-xl font-black text-slate-800 dark:text-white'}>{MONTHS[parseLocalDate(dateRange.start).getMonth()]}/{String(parseLocalDate(dateRange.start).getFullYear()).slice(-2)}</span>
          <button onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() + 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className={useCompactHeader ? 'shrink-0 p-0.5' : 'justify-self-center p-1 sm:p-2'}><ChevronRight className={useCompactHeader ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} /></button>
          <div className={useCompactHeader ? 'relative flex min-w-0 shrink items-center gap-0.5' : 'relative justify-self-end flex min-w-0 items-center gap-1 sm:gap-2'}><SlidersHorizontal className={useCompactHeader ? 'w-4 h-4 shrink-0 text-slate-500' : 'w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 text-slate-500'} /><select aria-label="Filtrar por tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={useCompactHeader ? 'min-w-0 max-w-[8rem] appearance-none pr-5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none' : 'min-w-0 max-w-full appearance-none pr-4 sm:pr-7 text-sm sm:text-lg font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none'}><option value="ALL">Todas</option>{dailyTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select><ChevronDown className={useCompactHeader ? 'w-4 h-4 pointer-events-none absolute right-0 text-slate-500' : 'w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none absolute right-0 text-slate-500'} /></div>
        </div>
      </div>

      {/* Visualização de Planilha */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-hidden max-h-[70vh] custom-scrollbar">
          <table className="w-full table-fixed border-collapse" style={{ fontFamily: "'Courier New', Consolas, monospace" }}>
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                <th className="w-[12%] p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px]">Dia</th>
                <th className="w-[38%] p-2 border border-slate-300 dark:border-slate-700 text-left font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px]">Tipo</th>
                <th className="w-[25%] p-2 border border-slate-300 dark:border-slate-700 text-right font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] whitespace-nowrap">Valor</th>
                <th className="w-[25%] p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] whitespace-nowrap">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReport.map((day) => { const visibleTypes = typeFilter === 'ALL' ? dailyTypes : dailyTypes.filter(item => item.key === typeFilter); return visibleTypes.map((item, index) => <tr key={`${day.date}-${item.key}`} onClick={() => onDayClick?.(day.date, item.key)} className="cursor-pointer">
                {index === 0 && <td rowSpan={visibleTypes.length} className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">{day.day}</td>}
                <td className="p-2 border border-slate-200 dark:border-slate-700 text-left text-sm transition-colors hover:bg-slate-100/80 active:bg-slate-200/80 dark:hover:bg-slate-800/80 dark:active:bg-slate-700/80"><div className="flex min-w-0 items-center gap-2 whitespace-nowrap"><span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 ${item.color} font-black`}>{item.icon}</span><span className={`${item.color} truncate`}>{item.label}</span></div></td>
                <td className="p-2 border border-slate-200 dark:border-slate-700 text-right text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{currencySymbol} {(day.amounts[item.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                {index === 0 && <td rowSpan={visibleTypes.length} className={`p-2 border border-slate-200 dark:border-slate-700 text-right text-sm font-black whitespace-nowrap ${day.balance >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400'}`}>{currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
              </tr>); })}
              {filteredAndSortedReport.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 italic text-xs">
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
