import React, { useState } from 'react';
import { ParsedTransaction } from '../utils/parsers/ofxParser';
import { Transaction, CreditCard as CreditCardModel, EntryType } from '../types';
import { X, Check, Trash2, ArrowLeft } from 'lucide-react';
import { normalizeTransaction } from '../utils/finance';

interface ImportReviewViewProps {
  parsedTransactions: ParsedTransaction[];
  existingTransactions: Transaction[];
  cards: CreditCardModel[];
  currencySymbol: string;
  onConfirm: (transactions: Transaction[]) => void;
  onCancel: () => void;
}

interface ReviewItem extends ParsedTransaction {
  selected: boolean;
  isDuplicate: boolean;
  assignedTags: string[];
  assignedCardId?: string;
}

export default function ImportReviewView({
  parsedTransactions,
  existingTransactions,
  cards,
  currencySymbol,
  onConfirm,
  onCancel
}: ImportReviewViewProps) {
  const [items, setItems] = useState<ReviewItem[]>(() => {
    return parsedTransactions.map(pt => {
      // Basic deduplication check
      const isDuplicate = existingTransactions.some(et => 
        (pt.fitid && et.comment?.includes(pt.fitid)) ||
        (et.date === pt.date && et.amount === pt.amount && et.description === pt.description)
      );

      return {
        ...pt,
        selected: !isDuplicate,
        isDuplicate,
        assignedTags: pt.tags || []
      };
    });
  });

  const toggleSelection = (index: number) => {
    const newItems = [...items];
    newItems[index].selected = !newItems[index].selected;
    setItems(newItems);
  };

  const handleConfirm = () => {
    const selected = items.filter(i => i.selected);
    const finalTransactions: Transaction[] = selected.map(i => {
      const t: Transaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
        date: i.date,
        description: i.description,
        amount: i.amount,
        entryType: i.entryType,
        tags: i.assignedTags,
        cardId: i.assignedCardId,
        comment: i.fitid ? `Importado automaticamente (FITID: ${i.fitid})` : 'Importado automaticamente',
        createdAt: new Date().toISOString()
      };
      return normalizeTransaction(t);
    });
    onConfirm(finalTransactions);
  };

  const selectedCount = items.filter(i => i.selected).length;
  const duplicateCount = items.filter(i => i.isDuplicate).length;
  const totalAmount = items.filter(i => i.selected).reduce((acc, i) => i.entryType === 'INCOME' ? acc + i.amount : acc - i.amount, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-app-background w-full">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 dark:border-dark-app-border dark:bg-dark-app-surface">
        <div className="flex items-center gap-2">
          <button onClick={onCancel} aria-label="Voltar" className="rounded-lg p-1 text-slate-800 dark:text-dark-app-text-primary">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-dark-app-text-primary">Revisão de Importação</h1>
        </div>
        <button 
          onClick={handleConfirm}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          disabled={selectedCount === 0}
        >
          Importar {selectedCount}
        </button>
      </header>
      
      <div className="p-4 bg-blue-50 dark:bg-slate-800 border-b border-blue-100 dark:border-slate-700">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Resumo:</strong> {selectedCount} novas transações a adicionar, {duplicateCount} possíveis duplicadas detectadas. 
          Impacto total no saldo: {currencySymbol} {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item, index) => (
          <div key={index} className={`p-4 rounded-xl border ${item.selected ? 'border-blue-200 bg-white dark:bg-slate-900' : 'border-slate-200 bg-slate-100 dark:bg-slate-800 dark:border-slate-700'} flex items-center justify-between`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={item.selected} 
                  onChange={() => toggleSelection(index)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className={`font-bold ${item.selected ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.description}
                </span>
                {item.isDuplicate && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Duplicada?</span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 pl-7">
                {item.date} • {item.entryType === 'INCOME' ? 'Entrada' : 'Saída'}
              </div>
            </div>
            <div className={`font-bold ${item.entryType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'} ${!item.selected && 'opacity-50'}`}>
              {item.entryType === 'INCOME' ? '+' : '-'}{currencySymbol} {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
