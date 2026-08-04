import React, { useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Grid3X3 } from 'lucide-react';
import { CreditCard, DateRange, InitialBalance, Transaction, TransactionType } from '../types';
import { projectTransactions } from '../finance';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; initialBalance: InitialBalance; cards: CreditCard[]; currencySymbol: string; onBack: () => void; onAdd: () => void; }
const parseDate = (v: string) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const BalanceHorizonView: React.FC<Props> = ({ transactions, dateRange, setDateRange, initialBalance, cards, currencySymbol, onBack, onAdd }) => {
  const start = parseDate(dateRange.start);
  const rows = useMemo(() => {
    const end = new Date(start.getFullYear(), start.getMonth()+1, 0, 12);
    const projected = projectTransactions(transactions, '0000-01-01', formatDate(end), cards);
    let balance = initialBalance.amount + projected.filter(t => parseDate(t.date) < start).reduce((s,t) => s + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
    return Array.from({length:end.getDate()}, (_, i) => { const date = formatDate(new Date(start.getFullYear(), start.getMonth(), i+1, 12)); balance += projected.filter(t => t.date === date).reduce((s,t) => s + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0); return {day:i+1,balance}; });
  }, [transactions, dateRange, initialBalance, cards]);
  const monthLabel = start.toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  const moveMonth = (delta: number) => { const d = new Date(start.getFullYear(), start.getMonth()+delta, 1); setDateRange({ start: formatDate(d), end: formatDate(new Date(d.getFullYear(), d.getMonth()+1, 0)) }); };
  return <section className="min-h-full bg-white dark:bg-slate-950">
    <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
      <button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-white"><ArrowLeft size={22}/></button>
      <div className="flex items-center gap-1"><button onClick={() => moveMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={22}/></button><h1 className="min-w-[120px] text-center text-xl font-black capitalize text-slate-800 dark:text-white">{monthLabel}</h1><button onClick={() => moveMonth(1)} aria-label="Próximo mês"><ChevronRight size={22}/></button></div>
      <div className="flex items-center gap-2"><Grid3X3 className="text-[#35b784]" size={20}/><button onClick={onAdd} aria-label="Adicionar lançamento" className="rounded-full bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900"><Plus size={20}/></button></div>
    </header>
    <div className="overflow-hidden bg-white dark:bg-slate-900"><div className="grid grid-cols-[36%_64%] bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300"><span>Dia</span><span className="text-right">Saldo</span></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(r => <div key={r.day} className="grid grid-cols-[36%_64%] px-4 py-3 text-sm"><span className="font-bold text-slate-700 dark:text-slate-300">{r.day}</span><span className={`text-right font-black ${r.balance >= 0 ? 'text-[#35b784]' : 'text-rose-600'}`}>{currencySymbol} {r.balance.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>)}</div></div>
  </section>;
};
export default BalanceHorizonView;
