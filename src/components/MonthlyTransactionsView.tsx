import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CreditCard, DateRange, EntryType, Transaction } from '../types';
import { getTransactionEntryType, projectTransactions } from '../utils/finance';
import FilterPill from './FilterPill';

interface Props { transactions: Transaction[]; dateRange: DateRange; setDateRange: (range: DateRange) => void; cards?: CreditCard[]; currencySymbol: string; initialType: EntryType; onBack: () => void; onAdd: (date: string) => void; onEdit: (transaction: Transaction) => void; }
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const parseDate = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (value: string) => { const date = parseDate(value); return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`; };

const MonthlyTransactionsView: React.FC<Props> = ({ transactions, dateRange, setDateRange, cards = [], currencySymbol, initialType, onBack, onAdd, onEdit }) => {
  const fallbackStart = new Date();
  const start = Number.isNaN(Date.parse(dateRange.start)) ? new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), 1, 12) : parseDate(dateRange.start);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
  const [typeFilter, setTypeFilter] = useState<EntryType | 'ALL'>(initialType);
  const types = [
    { key: 'INCOME' as const, label: 'Entradas', shortLabel: 'Entrada', circle: 'bg-emerald-500', icon: <ArrowDownLeft size={15} strokeWidth={3} /> },
    { key: 'EXPENSE' as const, label: 'Saídas', shortLabel: 'Saída', circle: 'bg-rose-500', icon: <ArrowUpRight size={15} strokeWidth={3} /> },
    { key: 'SAVINGS' as const, label: 'Economias', shortLabel: 'Economia', circle: 'bg-lime-500', icon: <span className="type-icon-label font-bold">E</span> },
    { key: 'CARD' as const, label: 'Gastos com cartão', shortLabel: 'Cartão', circle: 'bg-violet-600', icon: <span className="type-icon-label font-bold">C</span> },
  ];
  const typesByKey = Object.fromEntries(types.map(type => [type.key, type]));
  const monthlyTransactions = useMemo(() => projectTransactions(transactions, formatDate(start), formatDate(end), cards).filter(transaction => typeFilter === 'ALL' || getTransactionEntryType(transaction) === typeFilter).sort((a, b) => b.date.localeCompare(a.date)), [transactions, cards, dateRange, typeFilter]);
  const moveMonth = (delta: number) => { const next = new Date(start.getFullYear(), start.getMonth() + delta, 1, 12); setDateRange({ start: formatDate(next), end: formatDate(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12)) }); };
  return <section className="flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-3 py-4 dark:border-dark-app-border sm:px-4"><button type="button" onClick={onBack} aria-label="Voltar para Totais" className="rounded-xl p-1.5 text-slate-700 dark:text-dark-app-text-primary"><ArrowLeft size={26} /></button><div className="flex items-center gap-0.5"><button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior" className="rounded-xl p-1"><ChevronLeft size={26} /></button><span className="whitespace-nowrap text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">{MONTHS[start.getMonth()]}/{String(start.getFullYear()).slice(-2)}</span><button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês" className="rounded-xl p-1"><ChevronRight size={26} /></button></div><button type="button" onClick={() => onAdd(formatDate(new Date(start.getFullYear(), start.getMonth(), Math.min(new Date().getDate(), end.getDate()), 12)))} aria-label="Adicionar lançamento" className="rounded-xl p-1.5 text-slate-900 dark:text-dark-app-text-primary"><Plus size={30} /></button></header>
    <div className="border-t border-b border-slate-100 px-3 py-3 dark:border-dark-app-border sm:px-6"><FilterPill typeFilter aria-label="Filtrar por tipo" value={typeFilter} onChange={event => setTypeFilter(event.target.value as EntryType | 'ALL')}><option value="ALL">Todos</option>{types.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</FilterPill></div>
    <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-app-border">{monthlyTransactions.map(transaction => { const entryType = getTransactionEntryType(transaction); const item = typesByKey[entryType] || typesByKey.EXPENSE; const isIncome = entryType === 'INCOME'; return <button type="button" key={transaction.id} onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description || item.shortLabel}`} className="flex w-full items-center justify-between gap-4 border-y border-slate-100 px-6 py-5 text-left dark:border-dark-app-border"><div className="min-w-0"><div className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.circle} text-white`}>{item.icon}</span><h2 className="truncate text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{transaction.description || item.shortLabel}</h2></div><p className="mt-2 text-sm text-slate-500 dark:text-dark-app-text-secondary">{displayDate(transaction.date)}</p></div><div className="shrink-0 text-right"><p className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{isIncome ? '+' : '-'} {currencySymbol} {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="mt-1 text-sm text-slate-500 dark:text-dark-app-text-secondary">{item.shortLabel}</p></div></button>; })}{monthlyTransactions.length === 0 && <p className="p-10 text-center text-sm text-slate-400">Nenhum lançamento neste mês.</p>}</div>
  </section>;
};
export default MonthlyTransactionsView;
