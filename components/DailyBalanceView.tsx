
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, DateRange } from '../types';
import { 
  ArrowRightLeft,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
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

const DailyBalanceView: React.FC<Props> = ({ transactions, dateRange, setDateRange, currencySymbol }) => {
  // Para a visão de planilha, a ordem padrão é cronológica (mais antigo no topo)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const filteredAndSortedReport = useMemo(() => {
    const start = parseLocalDate(dateRange.start);
    const end = parseLocalDate(dateRange.end);
    
    // Saldo inicial acumulado de todas as transações antes da data de início
    let runningBalance = transactions
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
      const dayTs = transactions.filter(t => t.date === dateStr);
      const inc = dayTs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const exp = dayTs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      runningBalance = runningBalance + inc - exp;
      report.push({
        date: dateStr,
        day: parseLocalDate(dateStr).getDate(),
        income: inc,
        expense: exp,
        balance: runningBalance
      });
    });

    if (sortOrder === 'DESC') report.reverse();
    return report;
  }, [transactions, dateRange, sortOrder]);

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Filtros e Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme/20 rounded-lg text-slate-700 dark:text-theme"><ArrowRightLeft size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Extrato Diário</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Fluxo de caixa em formato de planilha</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              className="bg-transparent text-xs font-bold outline-none dark:text-slate-200" 
            />
            <span className="text-slate-300 dark:text-slate-600">até</span>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              className="bg-transparent text-xs font-bold outline-none dark:text-slate-200" 
            />
          </div>
          <button 
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')} 
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-bold dark:text-slate-200"
          >
            {sortOrder === 'DESC' ? <ArrowDownNarrowWide size={16} /> : <ArrowUpNarrowWide size={16} />}
            {sortOrder === 'DESC' ? 'Mais recente' : 'Cronológico'}
          </button>
        </div>
      </div>

      {/* Visualização de Planilha */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full border-collapse" style={{ fontFamily: "'Courier New', Consolas, monospace" }}>
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-12">Dia</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Entrada</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Saída</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 uppercase text-[10px] w-min whitespace-nowrap">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReport.map((day) => (
                <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300 text-xs">
                    {day.day}
                  </td>
                  <td className={`p-2 border border-slate-200 dark:border-slate-700 text-center text-xs bg-yellow-50/30 dark:bg-yellow-900/10 whitespace-nowrap ${day.income > 0 ? 'text-emerald-600 dark:text-emerald-500 font-medium' : 'text-slate-400'}`}>
                    {day.income > 0 ? `${currencySymbol} ${day.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className={`p-2 border border-slate-200 dark:border-slate-700 text-center text-xs bg-yellow-50/30 dark:bg-yellow-900/10 whitespace-nowrap ${day.expense > 0 ? 'text-rose-600 dark:text-rose-500 font-medium' : 'text-slate-400'}`}>
                    {day.expense > 0 ? `${currencySymbol} ${day.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className={`p-2 border border-slate-200 dark:border-slate-700 text-center text-xs font-bold bg-yellow-50/30 dark:bg-yellow-900/10 whitespace-nowrap ${day.balance >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400'}`}>
                    {currencySymbol} {day.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
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
