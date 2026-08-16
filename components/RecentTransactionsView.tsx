import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Repeat, CreditCard as CreditCardIcon } from 'lucide-react';
import { CreditCard, EntryType, Transaction } from '../types';
import { filterRecentTransactions } from '../recentTransactions';

interface Props {
  transactions: Transaction[];
  cards: CreditCard[];
  currencySymbol: string;
  onBack: () => void;
  onEdit: (transaction: Transaction) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const types: Array<{ key: EntryType; label: string; color: string; icon: React.ReactNode }> = [
  { key: 'INCOME', label: 'Entrada', color: 'bg-emerald-500', icon: <ArrowDownLeft size={16} strokeWidth={3} /> },
  { key: 'EXPENSE', label: 'Saída', color: 'bg-rose-500', icon: <ArrowUpRight size={16} strokeWidth={3} /> },
  { key: 'SAVINGS', label: 'Economia', color: 'bg-lime-500', icon: <span className="font-bold">E</span> },
  { key: 'CARD', label: 'Gasto com cartão', color: 'bg-violet-600', icon: <CreditCardIcon size={15} /> },
];

const displayDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

const RecentTransactionsView: React.FC<Props> = ({ transactions, cards, currencySymbol, onBack, onEdit }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [typeFilter, setTypeFilter] = useState<EntryType | 'ALL'>('ALL');
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const filteredTransactions = useMemo(() => filterRecentTransactions(transactions, cards, year, month, typeFilter), [transactions, cards, year, month, typeFilter]);
  const selectedType = types.find(type => type.key === typeFilter);
  const moveMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return <section className="flex h-full min-h-0 flex-col bg-white dark:bg-dark-app-surface">
    <header className="border-b border-slate-100 px-4 py-4 dark:border-dark-app-border">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} aria-label="Voltar para o menu" className="rounded-xl p-2 text-slate-700 dark:text-dark-app-text-primary"><ArrowLeft size={24} /></button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Lançamentos recentes</h1>
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex min-w-0 flex-1 items-center gap-1 rounded-full border border-slate-200 px-2 py-1 dark:border-dark-app-border" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPeriodPickerOpen(false); }}>
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior" className="shrink-0 rounded-lg p-1"><ChevronLeft size={19} /></button>
          <span className="min-w-0 flex-1 truncate text-center text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{MONTHS[month]}/{year}</span>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês" className="shrink-0 rounded-lg p-1"><ChevronRight size={19} /></button>
          <button type="button" aria-label="Selecionar mês e ano" onClick={() => setIsPeriodPickerOpen(value => !value)} className="shrink-0 rounded-lg p-1 text-slate-900 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-slate-700"><CalendarDays size={19} /></button>
          {isPeriodPickerOpen && <div className="absolute left-0 top-11 z-20 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-dark-app-border dark:bg-dark-app-surface"><select aria-label="Mês" value={month} onChange={event => setMonth(Number(event.target.value))} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{MONTHS.map((monthName, index) => <option key={monthName} value={index}>{monthName}</option>)}</select><select aria-label="Ano" value={year} onChange={event => setYear(Number(event.target.value))} className="rounded-lg bg-white p-1 font-bold text-slate-800 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary dark:[color-scheme:dark]">{Array.from({ length: 11 }, (_, index) => now.getFullYear() - 5 + index).map(optionYear => <option key={optionYear} value={optionYear}>{optionYear}</option>)}</select></div>}
        </div>
        <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 px-3 py-2 dark:border-dark-app-border">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selectedType?.color || 'border-2 border-slate-400'} text-white`}>{selectedType?.icon}</span>
        <select aria-label="Filtrar por tipo" value={typeFilter} onChange={event => setTypeFilter(event.target.value as EntryType | 'ALL')} className="min-w-0 w-full appearance-none bg-transparent pr-6 text-base font-normal text-slate-700 outline-none dark:text-dark-app-text-primary dark:[color-scheme:dark]"><option value="ALL">Todos</option>{types.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>
        <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500 dark:text-dark-app-text-secondary" />
      </div>
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-app-border">
      {filteredTransactions.map(transaction => {
        const entryType = getType(transaction.entryType);
        const type = types.find(item => item.key === entryType) || types[1];
        const isIncome = entryType === 'INCOME';
        const metadata = [transaction.recurrenceFrequency && transaction.recurrenceFrequency !== 'NONE' ? 'Recorrente' : '', transaction.isInstallment && transaction.installmentInfo ? `Parcela ${transaction.installmentInfo.current}/${transaction.installmentInfo.total}` : ''].filter(Boolean);
        return <button type="button" key={transaction.id} onClick={() => onEdit(transaction)} className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-app-surface-secondary">
          <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${type.color} text-white`}>{type.icon}</span>
          <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-base font-bold text-slate-800 dark:text-dark-app-text-primary">{transaction.description || type.label}</strong>{metadata.map(item => <span key={item} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-dark-app-text-secondary"><Repeat size={12} />{item}</span>)}</span><span className="mt-1 block text-sm text-slate-500 dark:text-dark-app-text-secondary">{displayDate(transaction.date)} · {type.label}</span>{transaction.tags?.length ? <span className="mt-2 flex flex-wrap gap-1">{transaction.tags.map(tag => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary">#{tag.replace(/^#/, '')}</span>)}</span> : null}</span>
          <span className="shrink-0 text-right"><strong className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{isIncome ? '+' : '-'} {currencySymbol} {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong><ChevronRight className="ml-auto mt-1 h-4 w-4 text-slate-300 dark:text-dark-app-text-secondary" /></span>
        </button>;
      })}
      {!filteredTransactions.length && <p className="p-10 text-center text-sm text-slate-500 dark:text-dark-app-text-secondary">Nenhum lançamento encontrado para os filtros selecionados.</p>}
    </div>
  </section>;
};

const getType = (entryType: EntryType): EntryType => entryType;

export default RecentTransactionsView;
