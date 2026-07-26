
import React, { useState } from 'react';
import { Transaction, TransactionType, Category, CreditCard as CreditCardModel, FinancialGroup, PaymentMethod } from '../types';
import { Calendar, Tag, MessageSquare, Repeat, CreditCard, Bookmark, ArrowDownLeft, ArrowUpRight, PiggyBank, RotateCcw, ArrowRightLeft, X, ChevronDown } from 'lucide-react';

interface Props {
  onAdd: (transactions: Transaction[]) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  currencySymbol: string;
  cards?: CreditCardModel[];
  availableTags?: string[];
}

// Helper to format date as YYYY-MM-DD in local time
const formatLocalYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TransactionForm: React.FC<Props> = ({ onAdd, onClose, initialData, currencySymbol, cards = [], availableTags = [] }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(initialData?.category || Category.FOOD);
  const [date, setDate] = useState(initialData?.date || formatLocalYYYYMMDD(new Date()));
  const [tagsText, setTagsText] = useState(initialData?.tags?.join(', ') || '');
  const [financialGroup, setFinancialGroup] = useState<FinancialGroup>(initialData?.financialGroup || (initialData?.type === TransactionType.INCOME ? FinancialGroup.PERSONAL_INCOME : FinancialGroup.PERSONAL_EXPENSE));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'PIX');
  const [cardId, setCardId] = useState(initialData?.cardId || '');
  type EntryKind = 'INCOME' | 'EXPENSE' | 'SAVINGS' | 'REIMBURSEMENT' | 'ADVANCE';
  const initialKind: EntryKind = initialData?.financialGroup === FinancialGroup.SAVINGS ? 'SAVINGS' : initialData?.financialGroup === FinancialGroup.REIMBURSEMENT ? 'REIMBURSEMENT' : initialData?.financialGroup === FinancialGroup.ADVANCE_TO_OTHERS ? 'ADVANCE' : initialData?.type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE';
  const [entryKind, setEntryKind] = useState<EntryKind>(initialKind);
  const currentTagQuery = tagsText.split(',').pop()?.trim().toLowerCase() || '';
  const suggestedTags = availableTags.filter(tag => !currentTagQuery || tag.toLowerCase().includes(currentTagQuery)).slice(0, 8);
  const kindMeta = { INCOME: { label: 'Entrada', color: 'text-emerald-600', button: 'bg-emerald-500', icon: ArrowDownLeft }, EXPENSE: { label: 'Saída', color: 'text-rose-600', button: 'bg-rose-500', icon: ArrowUpRight }, SAVINGS: { label: 'Economia', color: 'text-lime-600', button: 'bg-lime-500', icon: PiggyBank }, REIMBURSEMENT: { label: 'Reembolso', color: 'text-cyan-600', button: 'bg-cyan-500', icon: RotateCcw }, ADVANCE: { label: 'Adiantamento a terceiros', color: 'text-orange-600', button: 'bg-orange-500', icon: ArrowRightLeft } }[entryKind];
  const selectKind = (kind: EntryKind) => { setEntryKind(kind); setType(kind === 'INCOME' || kind === 'REIMBURSEMENT' ? TransactionType.INCOME : TransactionType.EXPENSE); setFinancialGroup(kind === 'INCOME' ? FinancialGroup.PERSONAL_INCOME : kind === 'REIMBURSEMENT' ? FinancialGroup.REIMBURSEMENT : kind === 'SAVINGS' ? FinancialGroup.SAVINGS : kind === 'ADVANCE' ? FinancialGroup.ADVANCE_TO_OTHERS : FinancialGroup.PERSONAL_EXPENSE); };
  const KindIcon = kindMeta.icon;
  
  // Regra específica: Observações nunca devem vir pré-preenchidas
  const [comment, setComment] = useState('');
  
  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(initialData?.isInstallment || false);
  const [installmentCount, setInstallmentCount] = useState(initialData?.installmentInfo?.total || 1);
  
  // Recorrência (Simplificada conforme solicitado)
  const [isRecurring, setIsRecurring] = useState(initialData?.isFixed || false);
  const [recurringInterval, setRecurringInterval] = useState(1); // Sempre inicia com 1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const valAmount = parseFloat(amount);
    const purchaseId = initialData?.installmentInfo?.purchaseId || Math.random().toString(36).substr(2, 9);
    const newTransactions: Transaction[] = [];
    
    // Parse input date (YYYY-MM-DD)
    const [y, m, d] = date.split('-').map(Number);
    const desiredDay = d;

    if (initialData) {
      // Edição
      onAdd([{ 
        ...initialData, 
        description, 
        amount: valAmount, 
        type, 
        category, 
        date, 
        comment, // Salva o novo comentário (ou vazio)
        isFixed: type === TransactionType.EXPENSE ? isRecurring : false,
        tags: tagsText.split(',').map(t => t.trim()).filter(Boolean), financialGroup, paymentMethod, cardId: paymentMethod === 'CREDIT_CARD' ? cardId : undefined,
        purchaseDate: paymentMethod === 'CREDIT_CARD' ? date : undefined
      }]);
      onClose();
      return;
    }

    // Criação (Novo Lançamento)
    let totalToCreate = 1;
    let interval = 1;
    
    if (type === TransactionType.EXPENSE) {
      if (isInstallment) {
        totalToCreate = installmentCount;
        interval = 1;
      } else if (isRecurring) {
        // Agora cria apenas o lançamento inicial marcado como recorrente
        totalToCreate = 1; 
        interval = recurringInterval;
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
        type,
        category,
        tags: tagsText.split(',').map(t => t.trim()).filter(Boolean), financialGroup, paymentMethod, cardId: paymentMethod === 'CREDIT_CARD' ? cardId : undefined,
        purchaseDate: paymentMethod === 'CREDIT_CARD' ? formattedDate : undefined,
        date: formattedDate,
        comment: comment.trim(),
        isFixed: type === TransactionType.EXPENSE ? isRecurring : false,
        isInstallment: type === TransactionType.EXPENSE && isInstallment,
        installmentInfo: (type === TransactionType.EXPENSE && isInstallment) ? { 
          current: i + 1, 
          total: installmentCount, 
          purchaseId 
        } : undefined
      });
    }

    onAdd(newTransactions);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4"><input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value.replace('-', ''))} className="w-3/4 text-3xl font-black bg-transparent outline-none dark:text-white" placeholder="R$ 0,00" required /><button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={24} /></button></div>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5"><div className="flex items-center gap-3"><div className={`p-2 rounded-full bg-current/10 ${kindMeta.color}`}><KindIcon size={20} /></div><select value={entryKind} onChange={e => selectKind(e.target.value as EntryKind)} className={`text-lg font-bold bg-transparent outline-none ${kindMeta.color} dark:bg-slate-900`}><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option><option value="SAVINGS">Economia</option><option value="REIMBURSEMENT">Reembolso</option><option value="ADVANCE">Adiantamento a terceiros</option></select><ChevronDown size={16} className={kindMeta.color} /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Método de pagamento</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT_CARD">Cartão de débito</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="BOLETO">Boleto</option><option value="OTHER">Outro</option></select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label>
          <input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="casa, essencial" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white" />
          {suggestedTags.length > 0 && <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">{suggestedTags.map(tag => <button key={tag} type="button" onClick={() => { const parts = tagsText.split(','); parts[parts.length - 1] = ` ${tag}`; setTagsText(`${parts.join(',').replace(/^\s+/, '')}, `); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-theme/10 dark:text-slate-200">{tag}</button>)}</div>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição <span className="text-rose-500">*</span></label>
          <input 
            autoFocus 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-theme dark:text-white" 
            placeholder="Aluguel, Faculdade..." 
            required 
          />
        </div>
      </div>

      {/* Valor e data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor ({currencySymbol}) <span className="text-rose-500">*</span></label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" placeholder="0,00" required /></div>
        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{initialData ? 'Data do Lançamento' : 'Data do Primeiro Lançamento'}</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" /></div>
      </div>

      {/* Opções Avançadas (Apenas para Despesas) */}
      {type === TransactionType.EXPENSE && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-300">
          
          {/* Compra Recorrente (Simplificada) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={e => {
                    setIsRecurring(e.target.checked);
                    if (e.target.checked) setIsInstallment(false);
                  }} 
                  className="w-4 h-4 rounded text-theme focus:ring-theme dark:bg-slate-700 dark:border-slate-600" 
                />
                Compra recorrente
              </label>
              <Repeat size={18} className={isRecurring ? 'text-theme' : 'text-slate-300 dark:text-slate-600'} />
            </div>
            {isRecurring && (
              <div className="pl-6 animate-in slide-in-from-top-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Meses</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="12" 
                    value={recurringInterval} 
                    onChange={e => setRecurringInterval(parseInt(e.target.value) || 1)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none dark:text-white font-bold" 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

          {/* Parcelamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isInstallment} 
                  onChange={e => {
                    setIsInstallment(e.target.checked);
                    if (e.target.checked) setIsRecurring(false);
                  }} 
                  className="w-4 h-4 rounded text-theme focus:ring-theme dark:bg-slate-700 dark:border-slate-600" 
                />
                Compra Parcelada
              </label>
              <CreditCard size={18} className={isInstallment ? 'text-theme' : 'text-slate-300 dark:text-slate-600'} />
            </div>
            {isInstallment && (
              <div className="pl-6 animate-in slide-in-from-top-1">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Número de Parcelas</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120" 
                  value={installmentCount} 
                  onChange={e => setInstallmentCount(parseInt(e.target.value) || 1)} 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none dark:text-white font-bold" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">Observações</label>
        <textarea 
          rows={2} 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none dark:text-white" 
          placeholder="Detalhes extras..."
        ></textarea>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        {initialData && (
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all active:scale-95"
          >
            CANCELAR
          </button>
        )}
        <button 
          type="submit" 
          className={`flex-[2] ${kindMeta.button} text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95`}
        >
          {initialData ? 'SALVAR ALTERAÇÕES' : `ADICIONAR ${kindMeta.label.toUpperCase()}`}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
