import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpLeft, ChevronDown, ChevronLeft, ChevronRight, Grid2X2, PiggyBank, Plus } from 'lucide-react';
import { CreditCard, FinancialGroup, Transaction, TransactionType } from '../types';
import { getFinancialGroup, projectTransactions } from '../finance';

interface Props { date: string; transactions: Transaction[]; cards?: CreditCard[]; currencySymbol: string; liteMode?: boolean; onBack: () => void; onAdd: (date: string) => void; onEdit: (transaction: Transaction) => void; }
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const DayTransactionsView: React.FC<Props> = ({ date, transactions, cards = [], currencySymbol, liteMode = false, onBack, onAdd, onEdit }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const types = [
    { key: FinancialGroup.PERSONAL_INCOME, label: 'Entrada', color: 'text-emerald-600', circle: 'bg-emerald-500', icon: <ArrowDownLeft size={18} strokeWidth={3} /> },
    { key: FinancialGroup.PERSONAL_EXPENSE, label: 'Saída', color: 'text-rose-600', circle: 'bg-rose-500', icon: <ArrowUpLeft size={18} strokeWidth={3} /> },
    { key: FinancialGroup.SAVINGS, label: 'Economia', color: 'text-lime-600', circle: 'bg-lime-500', icon: <PiggyBank size={18} strokeWidth={3} /> },
  ];
  const visibleTypes = liteMode ? types.slice(0, 3) : types;
  const dayTransactions = useMemo(() => {
    const projected = projectTransactions(transactions, selectedDate, selectedDate, cards);
    return projected.filter(transaction => typeFilter === 'ALL' || getFinancialGroup(transaction) === typeFilter);
  }, [transactions, selectedDate, cards, typeFilter]);
  const moveDay = (delta: number) => { const next = parseDate(selectedDate); next.setDate(next.getDate() + delta); setSelectedDate(formatDate(next)); };
  const selectedType = (transaction: Transaction) => visibleTypes.find(item => item.key === getFinancialGroup(transaction)) || visibleTypes[0];

  return <section className="flex min-h-full flex-col bg-white dark:bg-dark-app-surface">
    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-dark-app-border"><button onClick={onBack} aria-label="Voltar" className="rounded-xl p-2 text-slate-700 dark:text-dark-app-text-primary"><ArrowLeft size={26} /></button><div className="flex items-center gap-2"><button onClick={() => moveDay(-1)} aria-label="Dia anterior" className="rounded-xl p-2"><ChevronLeft size={26} /></button><span className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">{displayDate(parseDate(selectedDate))}</span><button onClick={() => moveDay(1)} aria-label="Próximo dia" className="rounded-xl p-2"><ChevronRight size={26} /></button></div><button onClick={() => onAdd(selectedDate)} aria-label="Adicionar lançamento" className="rounded-xl p-2 text-slate-900 dark:text-dark-app-text-primary"><Plus size={30} /></button></header>
    <div className="border-b border-slate-100 px-6 py-4 dark:border-dark-app-border"><div className="relative flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-dark-app-border"><Grid2X2 className="h-4 w-4 shrink-0 text-slate-500 dark:text-dark-app-text-secondary" /><select aria-label="Filtrar por tipo" value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="min-w-0 w-full appearance-none bg-transparent pr-6 text-base font-normal text-slate-700 outline-none dark:text-dark-app-text-primary"><option value="ALL">Todas</option>{visibleTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500 dark:text-dark-app-text-secondary" /></div></div>
    <div className="divide-y divide-slate-100 dark:divide-dark-app-border">{dayTransactions.map(transaction => { const item = selectedType(transaction); const isIncome = transaction.type === TransactionType.INCOME; return <button type="button" key={transaction.id} onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description || item.label}`} className="flex w-full items-center justify-between gap-4 border-y border-slate-100 px-6 py-5 text-left dark:border-dark-app-border"><div className="min-w-0"><div className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.circle} text-white`}>{item.icon}</span><h2 className="truncate text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{transaction.description || item.label}</h2></div><p className="mt-2 text-sm text-slate-500 dark:text-dark-app-text-secondary">{displayDate(parseDate(transaction.date))}</p></div><div className="shrink-0 text-right"><p className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{isIncome ? '+' : '-'} {currencySymbol} {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="mt-1 text-sm text-slate-500 dark:text-dark-app-text-secondary">{item.label}</p></div></button>; })}{dayTransactions.length === 0 && <p className="p-10 text-center text-sm text-slate-400">Nenhum lançamento neste dia.</p>}</div>
  </section>;
};
export default DayTransactionsView;
