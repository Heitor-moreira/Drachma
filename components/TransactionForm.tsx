
import React, { useState } from 'react';
import { Transaction, TransactionType, Category, CreditCard as CreditCardModel, FinancialGroup, PaymentMethod } from '../types';
import { Calendar, Tag, MessageSquare, Repeat, CreditCard, Bookmark } from 'lucide-react';

interface Props {
  onAdd: (transactions: Transaction[]) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  currencySymbol: string;
  cards?: CreditCardModel[];
}

// Helper to format date as YYYY-MM-DD in local time
const formatLocalYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TransactionForm: React.FC<Props> = ({ onAdd, onClose, initialData, currencySymbol, cards = [] }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(initialData?.category || Category.FOOD);
  const [date, setDate] = useState(initialData?.date || formatLocalYYYYMMDD(new Date()));
  const [tagsText, setTagsText] = useState(initialData?.tags?.join(', ') || '');
  const [financialGroup, setFinancialGroup] = useState<FinancialGroup>(initialData?.financialGroup || (initialData?.type === TransactionType.INCOME ? FinancialGroup.PERSONAL_INCOME : FinancialGroup.PERSONAL_EXPENSE));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'PIX');
  const [cardId, setCardId] = useState(initialData?.cardId || '');
  
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
      {/* Seletor de Tipo (Receita/Despesa) */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button 
          type="button" 
          onClick={() => { setType(TransactionType.EXPENSE); setIsRecurring(false); setIsInstallment(false); }} 
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400'}`}
        >
          Despesa
        </button>
        <button 
          type="button" 
          onClick={() => { setType(TransactionType.INCOME); setIsRecurring(false); setIsInstallment(false); }} 
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
        >
          Receita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grupo financeiro</label>
          <select value={financialGroup} onChange={e => setFinancialGroup(e.target.value as FinancialGroup)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white">
            <option value={FinancialGroup.PERSONAL_INCOME}>Renda pessoal</option><option value={FinancialGroup.REIMBURSEMENT}>Reembolso</option><option value={FinancialGroup.PERSONAL_EXPENSE}>Gasto pessoal</option><option value={FinancialGroup.ADVANCE_TO_OTHERS}>Adiantado a terceiros</option><option value={FinancialGroup.SAVINGS}>Reserva / economia</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags (separadas por vírgula)</label>
          <input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="casa, essencial" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Método de pagamento</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white">
            <option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT_CARD">Cartão de débito</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="BOLETO">Boleto</option><option value="OTHER">Outro</option>
          </select>
        </div>
        {paymentMethod === 'CREDIT_CARD' && <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cartão</label><select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"><option value="">Selecione um cartão</option>{cards.map(card => <option key={card.id} value={card.id}>{card.name} · vence dia {card.dueDay}</option>)}</select></div>}
      </div>

      {/* Descrição e Valor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor ({currencySymbol}) <span className="text-rose-500">*</span></label>
          <input 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-theme dark:text-white" 
            placeholder="0,00" 
            required 
          />
        </div>
      </div>

      {/* Categoria e Data */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Categoria <span className="text-rose-500">*</span></label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value as Category)} 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none dark:text-white"
          >
            {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{initialData ? 'Data do Lançamento' : 'Data do Primeiro Lançamento'}</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" 
          />
        </div>
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
          className="flex-[2] bg-theme hover:bg-theme-dark text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95"
        >
          {initialData ? 'SALVAR ALTERAÇÕES' : `CONFIRMAR ${isRecurring || isInstallment ? 'LANÇAMENTOS' : 'LANÇAMENTO'}`}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
