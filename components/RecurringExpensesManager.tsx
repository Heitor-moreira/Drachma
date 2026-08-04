
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Landmark, Edit2, Trash2, PieChart, ShieldCheck, Zap, Repeat } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  baseSalary: number;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
}

const RecurringExpensesManager: React.FC<Props> = ({ transactions, baseSalary, onEdit, onDelete, currencySymbol }) => {
  const recurringTs = useMemo(() => {
    // Filtra transações fixas/recorrentes e agrupa pela descrição mais recente
    const latestRecurring: Record<string, Transaction> = {};
    transactions.filter(t => t.isFixed && t.type === TransactionType.EXPENSE).forEach(t => {
      if (!latestRecurring[t.description] || new Date(t.date) > new Date(latestRecurring[t.description].date)) {
        latestRecurring[t.description] = t;
      }
    });
    return Object.values(latestRecurring);
  }, [transactions]);

  const monthlyTotal = recurringTs.reduce((acc, t) => acc + t.amount, 0);
  const monthlyPerc = baseSalary > 0 ? (monthlyTotal / baseSalary) * 100 : 0;
  const annualTotal = monthlyTotal * 12;
  const annualSalary = baseSalary * 12;
  const annualPerc = annualSalary > 0 ? (annualTotal / annualSalary) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-900 dark:bg-indigo-950 p-8 rounded-[32px] text-white shadow-xl flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] font-bold text-indigo-300 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Repeat size={14} /> Custo de Estilo de Vida</p>
            <h4 className="text-4xl font-bold">{monthlyPerc.toFixed(1)}% <small className="text-sm font-bold opacity-50 uppercase">do mensal</small></h4>
            <p className="mt-4 font-bold text-indigo-100">{currencySymbol} {monthlyTotal.toLocaleString('pt-BR')} <span className="text-xs font-normal opacity-50">/ mês recorrente</span></p>
          </div>
          <div className="p-4 bg-white/10 rounded-3xl"><Zap size={40} className="text-[#9ce492]" /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg"><PieChart size={20} /></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Projeção Recorrente Anual</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{currencySymbol} {annualTotal.toLocaleString('pt-BR')}</span>
            <span className="mb-1 text-xs font-bold text-[#9ce492]">{annualPerc.toFixed(1)}% do salário anual</span>
          </div>
          <div className="mt-4 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(annualPerc, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {recurringTs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
             <Repeat size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
             <p className="text-slate-400 dark:text-slate-600 font-bold">Nenhuma compra recorrente cadastrada.</p>
          </div>
        ) : (
          recurringTs.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">RC</div>
                 <div>
                   <h5 className="font-bold text-slate-800 dark:text-slate-200">{t.description}</h5>
                   <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">{t.category}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <span className="font-bold text-slate-800 dark:text-slate-200">{currencySymbol} {t.amount.toLocaleString('pt-BR')}</span>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(t)} className="p-2 text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(t.id)} className="p-2 text-rose-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Trash2 size={16} /></button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringExpensesManager;
