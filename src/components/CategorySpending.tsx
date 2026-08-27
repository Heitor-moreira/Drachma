
import React, { useMemo } from 'react';
import { Transaction, DateRange } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { getTransactionEntryType } from '../utils/finance';
import { Layers, Calendar } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  currencySymbol: string;
}

const CategorySpending: React.FC<Props> = ({ transactions, dateRange, setDateRange, currencySymbol }) => {
  const categorySummary = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    const summary: Record<string, number> = {};
    
    transactions
      .filter(t => getTransactionEntryType(t) === 'EXPENSE')
      .filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      })
      .forEach(t => {
        summary[t.entryType] = (summary[t.entryType] || 0) + t.amount;
        (t.tags || []).forEach(tag => { summary[`#${tag}`] = (summary[`#${tag}`] || 0) + t.amount; });
      });

    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [transactions, dateRange]);

  const totalPeriod = categorySummary.reduce((acc, curr) => acc + curr[1], 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-app-surface p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-app-border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#35b784]/20 rounded-lg text-slate-700 dark:text-[#35b784]"><Layers size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-dark-app-text-primary whitespace-nowrap">Gastos por Categoria</h3>
            <p className="text-xs text-slate-400 dark:text-dark-app-text-secondary">Distribuição financeira no período</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-app-surface-secondary p-2 rounded-xl border border-slate-200 dark:border-dark-app-border transition-colors">
          <Calendar size={14} className="text-slate-400 dark:text-dark-app-text-secondary ml-1" />
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs font-bold outline-none dark:text-dark-app-text-secondary" />
          <span className="text-slate-300 dark:text-dark-app-text-secondary">-</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs font-bold outline-none dark:text-dark-app-text-secondary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorySummary.map(([cat, amount]) => (
          <div key={cat} className="bg-white dark:bg-dark-app-surface p-6 rounded-3xl border border-slate-100 dark:border-dark-app-border hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#35b784' }}>{cat}</span>
              <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: '#35b78420', border: '2px solid #35b784' }}></div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary">{currencySymbol} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-2 w-full bg-slate-100 dark:bg-dark-app-surface-secondary h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: '#35b784', width: `${(amount / totalPeriod) * 100}%` }}></div>
              </div>
              <p className="mt-1 text-right text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase tracking-widest">{((amount / totalPeriod) * 100).toFixed(1)}% do total</p>
            </div>
          </div>
        ))}
      </div>
      
      {categorySummary.length === 0 && (
        <div className="py-24 text-center">
           <Layers size={48} className="mx-auto text-slate-200 dark:text-dark-app-text-secondary mb-4" />
           <p className="text-slate-400 dark:text-dark-app-text-secondary font-bold">Nenhum gasto registrado neste período.</p>
        </div>
      )}
    </div>
  );
};

export default CategorySpending;
