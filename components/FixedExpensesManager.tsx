
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { getTransactionEntryType } from '../finance';
import { Landmark, Edit2, Trash2, PieChart, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  baseSalary: number;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const FixedExpensesManager: React.FC<Props> = ({ transactions, baseSalary, onEdit, onDelete }) => {
  const fixedTs = useMemo(() => {
    // Filtra transações fixas e pega apenas a ocorrência mais recente de cada descrição para não duplicar no mensal
    const latestFixed: Record<string, Transaction> = {};
    transactions.filter(t => t.isFixed && getTransactionEntryType(t) === 'EXPENSE').forEach(t => {
      if (!latestFixed[t.description] || new Date(t.date) > new Date(latestFixed[t.description].date)) {
        latestFixed[t.description] = t;
      }
    });
    return Object.values(latestFixed);
  }, [transactions]);

  const monthlyTotal = fixedTs.reduce((acc, t) => acc + t.amount, 0);
  const monthlyPerc = baseSalary > 0 ? (monthlyTotal / baseSalary) * 100 : 0;
  const annualTotal = monthlyTotal * 12;
  const annualSalary = baseSalary * 12;
  const annualPerc = annualSalary > 0 ? (annualTotal / annualSalary) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-900 p-8 rounded-[32px] text-white shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={14} /> Custos de Segurança</p>
            <h4 className="text-3xl font-bold">{monthlyPerc.toFixed(1)}% <small className="text-sm font-bold opacity-50 uppercase">do mensal</small></h4>
            <p className="mt-4 font-bold text-indigo-100">R$ {monthlyTotal.toLocaleString('pt-BR')} <span className="text-xs font-normal opacity-50">/ mês fixo</span></p>
          </div>
          <div className="p-4 bg-white/10 rounded-3xl"><Zap size={40} className="text-[#35b784]" /></div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><PieChart size={20} /></div>
            <span className="text-sm font-bold text-slate-700">Projeção de Gastos Fixos Anuais</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-slate-900">R$ {annualTotal.toLocaleString('pt-BR')}</span>
            <span className="mb-1 text-xs font-bold text-[#35b784]">{annualPerc.toFixed(1)}% do salário anual</span>
          </div>
          <div className="mt-4 h-2 w-full bg-slate-100 rounded-full">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(annualPerc, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {fixedTs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
             <Landmark size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">Nenhum gasto fixo cadastrado.</p>
          </div>
        ) : (
          fixedTs.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all group">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-bold">FX</div>
                 <div>
                   <h5 className="font-bold text-slate-800">{t.description}</h5>
                   <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">{t.entryType}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <span className="font-bold text-slate-800">R$ {t.amount.toLocaleString('pt-BR')}</span>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(t)} className="p-2 text-indigo-400 hover:bg-slate-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(t.id)} className="p-2 text-rose-300 hover:bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FixedExpensesManager;
