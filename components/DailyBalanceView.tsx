
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

const DailyBalanceView: React.FC<Props> = ({ transactions, dateRange, setDateRange, currencySymbol, cards = [], onDayClick }) => {
  // Para a visão de planilha, a ordem padrão é cronológica (mais antigo no topo)
  const [typeFilter, setTypeFilter] = useState('ALL');
  const dailyTypes = [
    { key: FinancialGroup.PERSONAL_INCOME, label: 'Entrada', color: 'text-emerald-600', icon: '↙' },
    { key: FinancialGroup.PERSONAL_EXPENSE, label: 'Saída', color: 'text-rose-600', icon: '↗' },
    { key: FinancialGroup.SAVINGS, label: 'Economia', color: 'text-lime-600', icon: 'E' },
    { key: FinancialGroup.REIMBURSEMENT, label: 'Reembolso', color: 'text-cyan-600', icon: '↶' },
    { key: FinancialGroup.ADVANCE_TO_OTHERS, label: 'Adiantamento', color: 'text-orange-600', icon: '↔' }
  ];

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
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
          <Calendar size={20} className="text-slate-500" />
          <button onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() - 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className="p-2"><ChevronLeft size={20} /></button>
          <span className="text-xl font-black text-slate-800 dark:text-white">{MONTHS[parseLocalDate(dateRange.start).getMonth()]}/{String(parseLocalDate(dateRange.start).getFullYear()).slice(-2)}</span>
          <button onClick={() => { const d = parseLocalDate(dateRange.start); d.setMonth(d.getMonth() + 1); const start = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth(), 1)); const end = formatLocalYYYYMMDD(new Date(d.getFullYear(), d.getMonth() + 1, 0)); setDateRange({ start, end }); }} className="p-2"><ChevronRight size={20} /></button>
          <div className="relative flex items-center gap-2"><SlidersHorizontal size={18} className="text-slate-500" /><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="appearance-none pr-7 text-lg font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"><option value="ALL">Todas</option>{dailyTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select><ChevronDown size={18} className="pointer-events-none absolute right-0 text-slate-500" /></div>
        </div>
      </div>

      {/* Visualização de Planilha */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full border-collapse" style={{ fontFamily: "'Courier New', Consolas, monospace" }}>
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-12">Dia</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-left font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Tipo</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-right font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Valor</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReport.map((day) => { const visibleTypes = typeFilter === 'ALL' ? dailyTypes : dailyTypes.filter(item => item.key === typeFilter); return visibleTypes.map((item, index) => <tr key={`${day.date}-${item.key}`} onClick={() => onDayClick?.(day.date, item.key)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${day.balance < 0 ? 'bg-rose-50/40' : day.balance < 500 ? 'bg-amber-50/40' : ''}`}>
                {index === 0 && <td rowSpan={visibleTypes.length} className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">{day.day}</td>}
                <td className="p-2 border border-slate-200 dark:border-slate-700 text-left text-sm"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-current/10 ${item.color} font-black mr-2`}>{item.icon}</span><span className={item.color}>{item.label}</span></td>
                <td className="p-2 border border-slate-200 dark:border-slate-700 text-right text-sm font-bold text-slate-700 dark:text-slate-300">{currencySymbol} {(day.amounts[item.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                {index === 0 && <td rowSpan={visibleTypes.length} className={`p-2 border border-slate-200 dark:border-slate-700 text-right text-sm font-black ${day.balance >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400'}`}>{currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>}
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
