
import React, { useEffect, useRef, useState } from 'react';
import { Transaction, CreditCard as CreditCardModel } from '../types';
import { Calendar, Tag, MessageSquare, Repeat, CreditCard, Bookmark, ArrowDownLeft, ArrowUpRight, Trash2, X, ChevronDown, Pencil, RotateCcw } from 'lucide-react';

interface Props {
  onAdd: (transactions: Transaction[]) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  currencySymbol: string;
  cards?: CreditCardModel[];
  availableTags?: string[];
  initialDate?: string;
  initialFinancialGroup?: 'CARD' | 'INCOME' | 'EXPENSE' | 'SAVINGS';
}

// Helper to format date as YYYY-MM-DD in local time
const formatLocalYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatCurrency = (value: string, currencySymbol: string) => {
  const number = Number(value || 0);
  return `${currencySymbol} ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const normalizeTag = (value: string) => value.trim().toUpperCase();

type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type RecurrenceEndMode = 'INFINITE' | 'COUNT';

const TransactionForm: React.FC<Props> = ({ onAdd, onClose, onDelete, initialData, currencySymbol, cards = [], availableTags = [], initialDate, initialFinancialGroup }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(initialData?.date || initialDate || formatLocalYYYYMMDD(new Date()));
  const [committedTags, setCommittedTags] = useState<string[]>(initialData?.tags?.map(normalizeTag) || []);
  const [tagsText, setTagsText] = useState('');
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  type EntryKind = 'INCOME' | 'EXPENSE' | 'SAVINGS' | 'CARD';
  const startingGroup = initialData?.entryType || initialFinancialGroup;
  const initialKind: EntryKind = initialData?.entryType || (startingGroup === 'CARD' ? 'CARD' : startingGroup === 'SAVINGS' ? 'SAVINGS' : startingGroup === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
  const [entryKind, setEntryKind] = useState<EntryKind>(initialKind);
  const [cardId, setCardId] = useState(initialData?.cardId || '');
  const currentTagQuery = tagsText.trim().toLowerCase();
  const normalizedAvailableTags = availableTags.map(normalizeTag);
  const suggestedTags = normalizedAvailableTags.filter(tag => !committedTags.includes(tag) && (!currentTagQuery || tag.toLowerCase().includes(currentTagQuery))).slice(0, 8);
  const allTags = Array.from(new Set([...committedTags, ...(tagsText.trim() ? [normalizeTag(tagsText)] : [])]));
  const handleTagInput = (value: string) => {
    if (/\s$/.test(value)) {
      const tag = normalizeTag(value);
      if (tag && !committedTags.includes(tag)) setCommittedTags(prev => [...prev, tag]);
      setTagsText('');
      return;
    }
    setTagsText(value.toUpperCase());
  };
  const kindMeta = { INCOME: { label: 'Entrada', color: 'text-emerald-600', pill: '#d1fae5', button: 'bg-emerald-500', icon: ArrowDownLeft }, EXPENSE: { label: 'Saída', color: 'text-rose-600', pill: '#ffe4e6', button: 'bg-rose-500', icon: ArrowUpRight }, SAVINGS: { label: 'Economia', color: 'text-lime-600', pill: '#ecfccb', button: 'bg-lime-500', icon: ArrowDownLeft }, CARD: { label: 'Gasto com cartão', color: 'text-violet-600', pill: '#ede9fe', button: 'bg-violet-600', icon: CreditCard } }[entryKind];
  const selectKind = (kind: EntryKind) => { setEntryKind(kind); };
  const KindIcon = kindMeta.icon;
  
  // Regra específica: Observações nunca devem vir pré-preenchidas
  const [comment, setComment] = useState('');
  
  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(initialData?.isInstallment || false);
  const [installmentCount, setInstallmentCount] = useState(initialData?.installmentInfo?.total || 1);
  
  const [isRepeatMenuOpen, setIsRepeatMenuOpen] = useState(false);
  const [isEndMenuOpen, setIsEndMenuOpen] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(initialData?.recurrenceFrequency || (initialData?.isFixed ? 'MONTHLY' : 'NONE'));
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<RecurrenceEndMode>(initialData?.recurrenceEndMode || 'INFINITE');
  const [recurrenceCount, setRecurrenceCount] = useState(initialData?.recurrenceCount || 1);
  const recurrenceTitle = recurrenceFrequency === 'NONE' ? 'Não repete' : 'Repetições';
  const recurrenceFrequencyLabel = recurrenceFrequency === 'DAILY' ? 'Repete todo dia' : recurrenceFrequency === 'WEEKLY' ? 'Repete toda semana' : recurrenceFrequency === 'MONTHLY' ? 'Repete todo mês' : recurrenceFrequency === 'YEARLY' ? 'Repete todo ano' : 'Não repete';

  useEffect(() => {
    if (!initialData && !window.matchMedia('(pointer: coarse)').matches) amountInputRef.current?.focus({ preventScroll: true });
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);

    const valAmount = parseFloat(amount);
    const purchaseId = initialData?.installmentInfo?.purchaseId || Math.random().toString(36).substr(2, 9);
    const newTransactions: Transaction[] = [];
    
    // Parse input date (YYYY-MM-DD)
    const [y, m, d] = date.split('-').map(Number);
    const desiredDay = d;

    if (initialData) {
      // Edição
      window.setTimeout(() => onAdd([{
        ...initialData, 
        description, 
        amount: valAmount, 
        entryType: entryKind,
        date, 
        comment, 
        isFixed: entryKind !== 'INCOME' ? recurrenceFrequency !== 'NONE' : false,
        recurrenceFrequency: entryKind !== 'INCOME' ? recurrenceFrequency : 'NONE',
        recurrenceEndMode: entryKind !== 'INCOME' ? recurrenceEndMode : 'INFINITE',
        recurrenceCount: entryKind !== 'INCOME' && recurrenceEndMode === 'COUNT' ? recurrenceCount : undefined,
        tags: allTags,
        cardId: entryKind === 'CARD' ? cardId : undefined
      }]), 220);
      window.setTimeout(onClose, 260);
      return;
    }

    // Criação (Novo Lançamento)
    let totalToCreate = 1;
    let interval = 1;
    
    if (entryKind !== 'INCOME') {
      if (isInstallment) {
        totalToCreate = installmentCount;
        interval = 1;
      } else if (recurrenceFrequency !== 'NONE') {
        totalToCreate = 1;
        interval = 1;
      }
    }

    for (let i = 0; i < totalToCreate; i++) {
      const targetMonthIndex = (m - 1) + (i * interval);
      const currentDate = new Date(y, targetMonthIndex, 1, 12, 0, 0);
      const lastDayOfTargetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      currentDate.setDate(Math.min(desiredDay, lastDayOfTargetMonth));
      const formattedDate = formatLocalYYYYMMDD(currentDate);
      
      newTransactions.push({
        id: Math.random().toString(36).substr(2, 9),
        description: isInstallment ? `${description} (${i + 1}/${installmentCount})` : description,
        amount: valAmount,
        entryType: entryKind,
        tags: allTags,
        cardId: entryKind === 'CARD' ? cardId : undefined,
        date: formattedDate,
        comment: comment.trim(),
        isFixed: entryKind !== 'INCOME' ? recurrenceFrequency !== 'NONE' : false,
        recurrenceFrequency: entryKind !== 'INCOME' ? recurrenceFrequency : 'NONE',
        recurrenceEndMode: entryKind !== 'INCOME' ? recurrenceEndMode : 'INFINITE',
        recurrenceCount: entryKind !== 'INCOME' && recurrenceEndMode === 'COUNT' ? recurrenceCount : undefined,
        isInstallment: entryKind !== 'INCOME' && isInstallment,
        installmentInfo: (entryKind !== 'INCOME' && isInstallment) ? { 
          current: i + 1, 
          total: installmentCount, 
          purchaseId 
        } : undefined
      });
    }

    window.setTimeout(() => onAdd(newTransactions), 220);
    window.setTimeout(onClose, 260);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col space-y-0 divide-y divide-slate-200 dark:divide-dark-app-border">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-app-border pb-4"><input ref={amountInputRef} inputMode="decimal" value={formatCurrency(amount, currencySymbol)} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setAmount((Number(digits || 0) / 100).toFixed(2)); }} className="w-3/4 text-3xl font-bold bg-transparent outline-none dark:text-dark-app-text-primary" aria-label="Valor" required /><button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={24} /></button></div>
      <div className="relative flex min-h-[68px] w-full cursor-pointer items-center justify-between py-3" aria-label="Selecionar tipo de lançamento"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${kindMeta.button} text-white`} aria-hidden="true">{entryKind === 'SAVINGS' ? <span className="text-2xl font-bold">E</span> : <KindIcon size={21} strokeWidth={3} />}</div><span className={`text-lg font-bold ${kindMeta.color}`}>{kindMeta.label}</span></div><ChevronDown size={18} className={kindMeta.color} /><select aria-label="Tipo de lançamento" value={entryKind} onChange={e => selectKind(e.target.value as EntryKind)} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option><option value="SAVINGS">Economia</option><option value="CARD">Gasto com cartão</option></select></div>

      {entryKind === 'CARD' && <div className="relative flex min-h-[68px] items-center gap-3 py-3"><CreditCard size={20} className="text-slate-500 shrink-0" /><select value={isInstallment ? String(installmentCount) : 'NONE'} onChange={e => { const value = e.target.value; setIsInstallment(value !== 'NONE'); if (value !== 'NONE') setInstallmentCount(Number(value)); }} className="w-auto max-w-full appearance-none pr-8 text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary bg-transparent border-0 outline-none"><option value="NONE">Não parcela</option>{Array.from({ length: 11 }, (_, index) => <option key={index + 2} value={index + 2}>{index + 2} parcelas</option>)}</select><ChevronDown size={18} className="pointer-events-none absolute right-1 text-slate-500" /></div>}

      <div className="min-h-[68px] py-3">
        <div>
          <div className="flex items-center gap-3"><Pencil size={20} className="text-slate-500" /><input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full px-0 py-2 bg-transparent border-0 outline-none focus:ring-0 dark:text-dark-app-text-primary" 
            placeholder="Descrição" 
          /></div>
        </div>
      </div>

      {/* Data */}
      <div className="min-h-[68px] py-3">
        <div className="relative flex min-h-11 items-center justify-between"><div className="flex items-center gap-3"><Calendar size={20} className="text-slate-500" /><label className="text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">Data</label></div><span className="mr-7 text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">{date.split('-').reverse().join('/')}</span><input aria-label="Data do lançamento" type="date" value={date} onChange={e => setDate(e.target.value)} className="absolute right-0 top-0 h-full w-44 cursor-pointer opacity-0" /><ChevronDown size={18} className="pointer-events-none absolute right-1 text-slate-500" /></div>
      </div>

      <div className="relative py-3">
        <button type="button" onClick={() => { setIsRepeatMenuOpen(prev => !prev); setIsEndMenuOpen(false); }} className="flex min-h-[68px] w-full items-center gap-3 text-left">
          <Repeat size={20} className="shrink-0 text-slate-500" />
          <span className="text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">{recurrenceTitle}</span>
          <ChevronDown size={18} className="pointer-events-none text-slate-500" />
          <span className="ml-auto" />
        </button>
        {isRepeatMenuOpen && (
          <div className="fixed inset-0 z-40 flex items-end bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-dark-app-surface">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-dark-app-border">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Repetir</h2>
                <button onClick={() => setIsRepeatMenuOpen(false)} aria-label="Fechar" className="rounded-xl p-2 text-slate-500"><X size={28} /></button>
              </div>
              {[
                ['DAILY', 'Todo dia'],
                ['WEEKLY', 'Toda semana'],
                ['MONTHLY', 'Todo mês'],
                ['YEARLY', 'Todo ano'],
                ['NONE', 'Não repetir'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setRecurrenceFrequency(value as RecurrenceFrequency);
                  setIsRepeatMenuOpen(false);
                  if (value !== 'NONE') {
                    setRecurrenceEndMode('INFINITE');
                    setRecurrenceCount(1);
                  }
                }}
                  className="flex w-full items-center justify-between border-b border-slate-100 px-6 py-5 text-left dark:border-dark-app-border"
                >
                  <span className="text-base font-bold text-slate-900 dark:text-dark-app-text-primary">{label}</span>
                  <ChevronDown size={18} className="text-slate-400 opacity-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {recurrenceFrequency !== 'NONE' && (
        <div className="relative py-3">
          <button type="button" onClick={() => setIsEndMenuOpen(prev => !prev)} className="flex min-h-[68px] w-full items-center gap-3 text-left">
            <RotateCcw size={20} className="shrink-0 text-slate-500" />
            <span className="text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">Repetições</span>
            <ChevronDown size={18} className="pointer-events-none text-slate-500" />
            {recurrenceEndMode === 'COUNT' ? (
              <div className="ml-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-dark-app-border dark:bg-dark-app-surface-secondary">
                <button type="button" aria-label="Diminuir repetições" onMouseDown={e => e.preventDefault()} onClick={() => setRecurrenceCount(prev => Math.max(1, prev - 1))} className="text-2xl font-bold leading-none text-slate-700 dark:text-dark-app-text-primary">-</button>
                <span className="min-w-8 text-center text-lg font-bold text-slate-700 dark:text-dark-app-text-primary">{recurrenceCount}</span>
                <button type="button" aria-label="Aumentar repetições" onMouseDown={e => e.preventDefault()} onClick={() => setRecurrenceCount(prev => prev + 1)} className="text-2xl font-bold leading-none text-slate-700 dark:text-dark-app-text-primary">+</button>
              </div>
            ) : (
              <span className="ml-auto text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">A perder de vista</span>
            )}
          </button>
          {isEndMenuOpen && (
            <div className="fixed inset-0 z-40 flex items-end bg-slate-900/40 backdrop-blur-sm">
              <div className="w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-dark-app-surface">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-dark-app-border">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Até quando</h2>
                  <button onClick={() => setIsEndMenuOpen(false)} aria-label="Fechar" className="rounded-xl p-2 text-slate-500"><X size={28} /></button>
                </div>
                {[
                  ['INFINITE', 'A perder de vista'],
                  ['COUNT', 'Definir número de vezes'],
                ].map(([value, label]) => (
                  <div key={value} className="border-b border-slate-100 px-6 py-5 dark:border-dark-app-border">
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setRecurrenceEndMode(value as RecurrenceEndMode);
                        if (value === 'COUNT') setRecurrenceCount(prev => Math.max(1, prev));
                        setIsEndMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-base font-bold text-slate-900 dark:text-dark-app-text-primary">{label}</span>
                      <ChevronDown size={18} className="text-slate-400 opacity-0" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="relative min-h-[68px] py-3">
          <div className="flex items-center gap-3"><Tag size={20} className="shrink-0 text-slate-500" /><label className="text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">Tags</label><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{committedTags.map(tag => <button key={tag} type="button" onClick={() => setCommittedTags(prev => prev.filter(item => item !== tag))} style={{ backgroundColor: kindMeta.pill }} className={`px-2.5 py-1 rounded-full text-xs font-bold ${kindMeta.color}`}>{tag}</button>)}<input value={tagsText} onFocus={() => setIsTagsFocused(true)} onBlur={() => setTimeout(() => setIsTagsFocused(false), 100)} onChange={e => handleTagInput(e.target.value)} placeholder={committedTags.length === 0 ? 'Adicionar tags' : ''} className="min-w-0 flex-1 px-0 py-2 text-base bg-transparent border-0 outline-none dark:text-dark-app-text-primary" style={{ fontSize: '16px' }} /></div></div>
        {isTagsFocused && suggestedTags.length > 0 && <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-dark-app-border bg-white dark:bg-dark-app-surface-secondary shadow-lg overflow-hidden">{suggestedTags.map(tag => <button key={tag} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setCommittedTags(prev => [...prev, tag]); setTagsText(''); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-theme/10 dark:text-dark-app-text-secondary">{tag}</button>)}</div>}
      </div>
      {/* Observações mantidas apenas no modelo, fora do modal básico */}
      <div className="hidden">
        <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1 flex items-center gap-1">Observações</label>
        <textarea 
          rows={2} 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          className="w-full px-4 py-2 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-xl outline-none resize-none dark:text-dark-app-text-primary" 
          placeholder="Detalhes extras..."
        ></textarea>
      </div>

      {/* Botões de Ação */}
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {initialData && (
          <button type="button" aria-label="Excluir lançamento" title="Excluir lançamento" onClick={() => { if (window.confirm('Excluir este lançamento?')) { onDelete?.(initialData.id); onClose(); } }} className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 px-4 text-white shadow-lg transition-all active:scale-95 hover:bg-rose-700"><Trash2 size={22} strokeWidth={2.5} /></button>
        )}
        {initialData && <button type="button" onClick={onClose} className="min-h-14 flex-1 rounded-2xl bg-slate-200 px-4 py-4 font-bold text-slate-600 transition-all active:scale-95 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary">Cancelar</button>}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`min-h-14 flex-[2] rounded-2xl px-4 py-4 ${kindMeta.button} text-white font-bold shadow-lg transition-all active:scale-95 ${isSubmitting ? 'animate-pulse translate-y-3 opacity-0 duration-200' : ''}`}
        >
          {isSubmitting ? 'CARREGANDO…' : initialData ? 'Salvar' : `ADICIONAR ${kindMeta.label.toUpperCase()}`}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
