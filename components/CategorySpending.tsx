
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category, DateRange } from '../types';
import { CATEGORY_COLORS } from '../constants';
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
      .filter(t => t.type === TransactionType.EXPENSE)
      .filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      })
      .forEach(t => {
        summary[t.category] = (summary[t.category] || 0) + t.amount;
      });

    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [transactions, dateRange]);

  const totalPeriod = categorySummary.reduce((acc, curr) => acc + curr[1], 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#9ce492]/20 rounded-lg text-slate-700 dark:text-[#9ce492]"><Layers size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">Gastos por Categoria</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Distribuição financeira no período</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
          <Calendar size={14} className="text-slate-400 dark:text-slate-500 ml-1" />
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-xs font-bold outline-none dark:text-slate-200" />
          <span className="text-slate-300 dark:text-slate-600">-</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-xs font-bold outline-none dark:text-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorySummary.map(([cat, amount]) => (
          <div key={cat} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: CATEGORY_COLORS[cat as Category] }}>{cat}</span>
              <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[cat as Category]}20`, border: `2px solid ${CATEGORY_COLORS[cat as Category]}` }}></div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{currencySymbol} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: CATEGORY_COLORS[cat as Category], width: `${(amount / totalPeriod) * 100}%` }}></div>
              </div>
              <p className="mt-1 text-right text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{((amount / totalPeriod) * 100).toFixed(1)}% do total</p>
            </div>
          </div>
        ))}
      </div>
      
      {categorySummary.length === 0 && (
        <div className="py-24 text-center">
           <Layers size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
           <p className="text-slate-400 dark:text-slate-600 font-bold">Nenhum gasto registrado neste período.</p>
        </div>
      )}
    </div>
  );
};

export default CategorySpending;
