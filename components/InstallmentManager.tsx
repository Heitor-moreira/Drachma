
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { CreditCard, Edit2, Trash2, PieChart, TrendingUp, CalendarDays } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface Props {
  transactions: Transaction[];
  baseSalary: number;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
}

const InstallmentManager: React.FC<Props> = ({ transactions, baseSalary, onEdit, onDelete, currencySymbol }) => {
  const installmentGroups = useMemo(() => {
    const groups: Record<string, { name: string, total: number, current: number, amount: number, remaining: number, items: Transaction[] }> = {};
    
    transactions.filter(t => t.isInstallment && t.installmentInfo).forEach(t => {
      const pid = t.installmentInfo!.purchaseId;
      if (!groups[pid]) {
        groups[pid] = { name: t.description.split(' (')[0], total: t.installmentInfo!.total, current: 0, amount: t.amount, remaining: 0, items: [] };
      }
      groups[pid].items.push(t);
    });

    return Object.values(groups).map(g => {
      const sorted = g.items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const now = new Date();
      const currentIdx = sorted.findIndex(t => new Date(t.date) > now);
      return {
        ...g,
        current: currentIdx === -1 ? g.total : currentIdx,
        remaining: g.total - (currentIdx === -1 ? g.total : currentIdx)
      };
    });
  }, [transactions]);

  const monthlyImpact = installmentGroups.reduce((acc, g) => acc + g.amount, 0);
  const monthlyPerc = baseSalary > 0 ? (monthlyImpact / baseSalary) * 100 : 0;
  const annualImpact = installmentGroups.reduce((acc, g) => acc + (g.amount * g.remaining), 0);
  const annualSalary = baseSalary * 12;
  const annualPerc = annualSalary > 0 ? (annualImpact / annualSalary) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-2xl"><PieChart size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Comprometimento Mensal</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Compras Parceladas: {monthlyPerc.toFixed(1)}%</h4>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-rose-500">{currencySymbol} {monthlyImpact.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-between text-white transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#9ce492]/20 text-[#9ce492] rounded-2xl"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Peso no Orçamento Anual</p>
              <h4 className="text-2xl font-bold text-white">{annualPerc.toFixed(2)}%</h4>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-[#9ce492]">{currencySymbol} {annualImpact.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {installmentGroups.map((g, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group transition-all">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-all"><CreditCard size={24} /></div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">{g.name}</h5>
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${(g.current / g.total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap">
                   <span>Parcela {g.current} de {g.total}</span>
                   <span>{currencySymbol} {g.amount.toLocaleString('pt-BR')} / mês</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
               <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">Restante</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{g.remaining > 0 ? `${currencySymbol} ${(g.amount * g.remaining).toLocaleString('pt-BR')}` : 'Finalizado'}</p>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(g.items[0])} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                  <button onClick={() => onDelete(g.items[0].id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
               </div>
            </div>
          </div>
        ))}
      </div>
      {installmentGroups.length === 0 && (
        <div className="py-24 text-center">
           <CreditCard size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
           <p className="text-slate-400 dark:text-slate-600 font-bold">Nenhuma compra parcelada ativa.</p>
        </div>
      )}
    </div>
  );
};

export default InstallmentManager;
