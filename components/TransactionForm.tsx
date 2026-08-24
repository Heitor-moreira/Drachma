
import React, { useEffect, useRef, useState } from 'react';
import { Transaction, CreditCard as CreditCardModel } from '../types';
import { Calendar, Tag, MessageSquare, Repeat, Bookmark, ArrowDownLeft, ArrowUpRight, Trash2, X, ChevronDown, Pencil, RotateCcw } from 'lucide-react';

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

export const normalizeTag = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const tagKey = (value: string) => normalizeTag(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
export const uniqueTags = (tags: string[]) => {
  const result: string[] = [];
  tags.forEach(tag => {
    const normalized = normalizeTag(tag);
    if (normalized && !result.some(existing => tagKey(existing) === tagKey(normalized))) result.push(normalized);
  });
  return result;
};
export const commitTag = (tags: string[], value: string) => {
  const normalized = normalizeTag(value);
  return normalized ? uniqueTags([...tags, normalized]) : uniqueTags(tags);
};

type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type RecurrenceEndMode = 'INFINITE' | 'COUNT';

const TransactionForm: React.FC<Props> = ({ onAdd, onClose, onDelete, initialData, currencySymbol, cards = [], availableTags = [], initialDate, initialFinancialGroup }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(initialData?.date || initialDate || formatLocalYYYYMMDD(new Date()));
  const [committedTags, setCommittedTags] = useState<string[]>(uniqueTags(initialData?.tags || []));
  const [tagsText, setTagsText] = useState('');
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  const isTagComposingRef = useRef(false);
  type EntryKind = 'INCOME' | 'EXPENSE' | 'SAVINGS' | 'CARD';
  const startingGroup = initialData?.entryType || initialFinancialGroup;
  const initialKind: EntryKind = initialData?.entryType || (startingGroup === 'CARD' ? 'CARD' : startingGroup === 'SAVINGS' ? 'SAVINGS' : startingGroup === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
  const [entryKind, setEntryKind] = useState<EntryKind>(initialKind);
  const [cardId, setCardId] = useState(initialData?.cardId || '');
  const currentTagQuery = tagKey(tagsText);
  const normalizedAvailableTags = uniqueTags(availableTags);
  const suggestedTags = normalizedAvailableTags
    .filter(tag => !committedTags.some(committedTag => tagKey(committedTag) === tagKey(tag)))
    .filter(tag => !currentTagQuery || tagKey(tag).includes(currentTagQuery))
    .sort((a, b) => {
      const aKey = tagKey(a);
      const bKey = tagKey(b);
      const aPrefix = aKey.startsWith(currentTagQuery) ? 0 : 1;
      const bPrefix = bKey.startsWith(currentTagQuery) ? 0 : 1;
      return aPrefix - bPrefix || aKey.localeCompare(bKey);
    })
    .slice(0, 3);
  const allTags = uniqueTags([...committedTags, ...(tagsText.trim() ? [tagsText] : [])]);
  const handleTagInput = (value: string) => setTagsText(value);
  const commitCurrentTag = () => {
    setCommittedTags(prev => commitTag(prev, tagsText));
    setTagsText('');
  };
  const kindMeta = { INCOME: { label: 'Entrada', color: 'text-emerald-600', pill: '#d1fae5', button: 'bg-emerald-500', icon: ArrowDownLeft }, EXPENSE: { label: 'Saída', color: 'text-rose-600', pill: '#ffe4e6', button: 'bg-rose-500', icon: ArrowUpRight }, SAVINGS: { label: 'Economia', color: 'text-lime-600', pill: '#ecfccb', button: 'bg-lime-500', icon: ArrowDownLeft }, CARD: { label: 'Gasto com cartão', color: 'text-violet-600', pill: '#ede9fe', button: 'bg-violet-600', icon: ArrowDownLeft } }[entryKind];
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
  const recurrenceFrequencyLabel = recurrenceFrequency === 'DAILY' ? 'Repete todo dia' : recurrenceFrequency === 'WEEKLY' ? 'Repete toda semana' : recurrenceFrequency === 'MONTHLY' ? 'Repete todo mês' : recurrenceFrequency === 'YEARLY' ? 'Repete todo ano' : 'Não repete';
  const recurrenceLineLabel = recurrenceFrequency === 'NONE' ? 'Não repete' : recurrenceFrequencyLabel;
  const recurrenceEndLineLabel = recurrenceEndMode === 'COUNT' ? 'Repetições' : 'A perder de vista';

  useEffect(() => {
    if (!initialData && !window.matchMedia('(pointer: coarse)').matches) amountInputRef.current?.focus({ preventScroll: true });
  }, [initialData]);

  useEffect(() => {
    if (!isTagsFocused) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsTagsFocused(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isTagsFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);

    const valAmount = parseFloat(amount);
    const purchaseId = initialData?.installmentInfo?.purchaseId || Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
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
        isFixed: recurrenceFrequency !== 'NONE',
        recurrenceFrequency,
        recurrenceEndMode,
        recurrenceCount: recurrenceEndMode === 'COUNT' ? recurrenceCount : undefined,
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
        createdAt,
        description,
        amount: valAmount,
        entryType: entryKind,
        tags: allTags,
        cardId: entryKind === 'CARD' ? cardId : undefined,
        date: formattedDate,
        comment: comment.trim(),
        isFixed: recurrenceFrequency !== 'NONE',
        recurrenceFrequency,
        recurrenceEndMode,
        recurrenceCount: recurrenceEndMode === 'COUNT' ? recurrenceCount : undefined,
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
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col space-y-0 divide-y divide-slate-200 dark:divide-dark-app-border [&>div]:!h-[80px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-4 dark:border-dark-app-border md:px-12"><input ref={amountInputRef} inputMode="decimal" value={formatCurrency(amount, currencySymbol)} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setAmount((Number(digits || 0) / 100).toFixed(2)); }} className="w-3/4 text-[32px] font-bold bg-transparent outline-none dark:text-dark-app-text-primary" aria-label="Valor" required /><button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={24} /></button></div>
      <div className="relative flex min-h-20 w-full cursor-pointer items-center justify-between px-6 py-5 md:px-12" aria-label="Selecionar tipo de lançamento"><div className="flex min-w-0 items-center gap-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${kindMeta.button} text-white`} aria-hidden="true">{entryKind === 'SAVINGS' || entryKind === 'CARD' ? <span className="text-[21px] font-bold">{entryKind === 'SAVINGS' ? 'E' : 'C'}</span> : <KindIcon size={21} strokeWidth={3} />}</div><span className={`truncate text-[21px] font-bold ${kindMeta.color}`}>{kindMeta.label}</span></div><ChevronDown size={21} className={`shrink-0 ${kindMeta.color}`} /><select aria-label="Tipo de lançamento" value={entryKind} onChange={e => selectKind(e.target.value as EntryKind)} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option><option value="SAVINGS">Economia</option><option value="CARD">Gasto com cartão</option></select></div>

      <div className="min-h-20 px-6 py-5 md:px-12">
        <div>
          <div className="flex items-center gap-3"><Pencil size={24} className="shrink-0 text-slate-500" /><textarea
            rows={1}
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full min-w-0 resize-none overflow-hidden break-words px-0 py-2 text-[20px] leading-tight bg-transparent border-0 outline-none focus:ring-0 dark:text-dark-app-text-primary"
            placeholder="Descrição" 
          /></div>
        </div>
      </div>

      {/* Data */}
      <div className="min-h-20 px-6 py-5 md:px-12">
        <div className="relative flex min-h-11 items-center justify-between"><div className="flex items-center gap-4"><Calendar size={24} className="shrink-0 text-slate-500" /><label className="text-[20px] font-bold text-slate-700 dark:text-dark-app-text-secondary">Data</label></div><span className="mr-8 truncate text-[20px] font-bold text-slate-700 dark:text-dark-app-text-secondary">{date.split('-').reverse().join('/')}</span><input aria-label="Data do lançamento" type="date" value={date} onChange={e => setDate(e.target.value)} className="absolute right-0 top-0 h-full w-44 cursor-pointer opacity-0" /><ChevronDown size={24} className="pointer-events-none absolute right-1 text-slate-500" /></div>
      </div>

      <div className="relative min-h-20 px-6 py-5 md:px-12">
        <button type="button" onClick={() => { setIsRepeatMenuOpen(prev => !prev); setIsEndMenuOpen(false); }} className="flex min-h-11 w-full min-w-0 items-center gap-3 text-left">
          <Repeat size={24} className="shrink-0 text-slate-500" />
          <span className="truncate text-[20px] font-bold text-slate-700 dark:text-dark-app-text-secondary">{recurrenceLineLabel}</span>
          <ChevronDown size={24} className="pointer-events-none shrink-0 text-slate-500" />
          <span className="ml-auto" />
        </button>
        {isRepeatMenuOpen && (
          <div className="fixed inset-0 z-40 flex flex-col items-stretch justify-end bg-slate-900/40 pb-4 backdrop-blur-sm">
            <div className="h-auto max-h-[70vh] w-full shrink-0 overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-dark-app-surface">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-dark-app-border">
                <h2 className="text-[25px] font-bold text-slate-900 dark:text-dark-app-text-primary">Repetir</h2>
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
        <div className="relative flex min-h-20 items-center px-6 md:px-12">
          <div className="flex h-full w-full items-center gap-4">
            <RotateCcw size={24} className="shrink-0 text-slate-500" />
            <button type="button" onClick={() => setIsEndMenuOpen(prev => !prev)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="truncate text-[20px] font-bold text-slate-700 dark:text-dark-app-text-secondary">{recurrenceEndLineLabel}</span>
              <ChevronDown size={24} className="pointer-events-none shrink-0 text-slate-500" />
            </button>
            {recurrenceEndMode === 'COUNT' ? (
              <div className="ml-auto flex shrink-0 self-stretch items-center gap-4 border-l border-slate-200 pl-4 dark:border-dark-app-border sm:gap-6 sm:pl-6">
                <button type="button" aria-label="Diminuir repetições" onMouseDown={e => e.preventDefault()} onClick={() => setRecurrenceCount(prev => Math.max(1, prev - 1))} className="text-[20px] font-bold leading-none text-slate-700 dark:text-dark-app-text-primary">-</button>
                <span className="min-w-8 text-center text-[20px] font-bold text-slate-700 dark:text-dark-app-text-primary">{recurrenceCount}</span>
                <button type="button" aria-label="Aumentar repetições" onMouseDown={e => e.preventDefault()} onClick={() => setRecurrenceCount(prev => prev + 1)} className="text-[20px] font-bold leading-none text-slate-700 dark:text-dark-app-text-primary">+</button>
              </div>
            ) : null}
          </div>
          {isEndMenuOpen && (
            <div className="fixed inset-0 z-40 flex flex-col items-stretch justify-end bg-slate-900/40 pb-4 backdrop-blur-sm">
              <div className="h-auto max-h-[70vh] w-full shrink-0 overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-dark-app-surface">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-dark-app-border">
                  <h2 className="text-[25px] font-bold text-slate-900 dark:text-dark-app-text-primary">Até quando</h2>
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
      <div className="min-h-20 px-6 py-5 md:px-12">
        <div className="flex items-center gap-4">
          <Tag size={24} className="shrink-0 text-slate-500" />
          <label className="text-[20px] font-bold text-slate-700 dark:text-dark-app-text-secondary">Tags</label>
          <div className="relative min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {committedTags.map(tag => <button key={tag} type="button" onClick={() => setCommittedTags(prev => prev.filter(item => tagKey(item) !== tagKey(tag)))} style={{ backgroundColor: kindMeta.pill }} className={`rounded-full px-2.5 py-1 text-xs font-bold ${kindMeta.color}`}>{tag}</button>)}
              <input
                value={tagsText}
                onFocus={() => setIsTagsFocused(true)}
                onBlur={() => setTimeout(() => setIsTagsFocused(false), 100)}
                onChange={e => handleTagInput(e.currentTarget.value)}
                placeholder={committedTags.length === 0 ? 'Digite uma tag e pressione Enter' : ''}
                className="min-w-0 flex-1 self-center bg-transparent px-0 py-0 text-base leading-normal outline-none dark:text-dark-app-text-primary"
                style={{ fontSize: '16px' }}
                aria-label="Adicionar tags"
                aria-autocomplete="list"
                aria-expanded={isTagsFocused && currentTagQuery.length > 0 && suggestedTags.length > 0}
                onCompositionStart={() => { isTagComposingRef.current = true; }}
                onCompositionEnd={e => { isTagComposingRef.current = false; setTagsText(e.currentTarget.value); }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { e.preventDefault(); setIsTagsFocused(false); }
                  if (e.key === 'Enter' && !isTagComposingRef.current) { e.preventDefault(); commitCurrentTag(); }
                }}
              />
            </div>
            {isTagsFocused && currentTagQuery && suggestedTags.length > 0 && <div className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-dark-app-border dark:bg-dark-app-surface-secondary" role="listbox" aria-label="Sugestões de tags">
              {suggestedTags.map(tag => <button key={tagKey(tag)} type="button" role="option" onMouseDown={e => e.preventDefault()} onClick={() => { setCommittedTags(prev => uniqueTags([...prev, tag])); setTagsText(''); setIsTagsFocused(false); }} className="block min-h-11 w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-theme/10 focus:bg-theme/10 focus:outline-none dark:text-dark-app-text-secondary">{tag}</button>)}
            </div>}
          </div>
        </div>
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
      <div className="mt-auto flex flex-wrap gap-3 px-6 pt-6 md:px-12">
        {initialData && (
          <button type="button" aria-label="Excluir lançamento" title="Excluir lançamento" onClick={() => { onDelete?.(initialData.id); onClose(); }} className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 px-4 text-white shadow-lg transition-all active:scale-95 hover:bg-rose-700"><Trash2 size={22} strokeWidth={2.5} /></button>
        )}
        {initialData && <button type="button" onClick={onClose} className="min-h-14 flex-1 rounded-2xl bg-slate-200 px-4 py-4 font-bold text-slate-600 transition-all active:scale-95 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary">Cancelar</button>}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`min-h-14 flex-[2] rounded-full px-4 py-4 ${kindMeta.button} text-[20px] text-white font-bold shadow-lg transition-all active:scale-95 ${isSubmitting ? 'animate-pulse translate-y-3 opacity-0 duration-200' : ''}`}
        >
          {isSubmitting ? 'Carregando…' : initialData ? 'Salvar' : `Adicionar ${kindMeta.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
