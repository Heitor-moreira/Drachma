import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Repeat, CreditCard as CardIcon } from 'lucide-react';
import { CreditCard, Transaction } from '../types';
import { getSubscriptionSummaryForMonth } from '../utils/subscriptionTransactions';
import { normalizeTag } from '../utils/taggedTransactions';
import { getCurrentMonthRange } from '../utils/currentPeriod';

interface Props {
  transactions: Transaction[];
  cards: CreditCard[];
  currencySymbol: string;
  onBack: () => void;
  onEdit: (transaction: Transaction) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const displayDate = (value: string) => value.split('-').reverse().join('/');

const SubscriptionsView: React.FC<Props> = ({ transactions, cards, currencySymbol, onBack, onEdit }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const moveMonth = (delta: number) => {
    const date = new Date(year, month + delta, 1, 12);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    swipeStartX.current = touch?.clientX ?? null;
    swipeStartY.current = touch?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (swipeStartX.current === null) return;
    const touch = event.changedTouches[0];
    const dx = (touch?.clientX ?? swipeStartX.current) - swipeStartX.current;
    const dy = (touch?.clientY ?? swipeStartY.current ?? 0) - (swipeStartY.current ?? 0);
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
      moveMonth(dx < 0 ? 1 : -1);
    }
  };

  const summary = useMemo(() => 
    getSubscriptionSummaryForMonth(transactions, cards, year, month),
  [transactions, cards, year, month]);

  const sortedCategories = useMemo(() => {
    return Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a);
  }, [summary.byCategory]);

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-dark-app-background" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header className="border-b border-slate-100 dark:border-dark-app-border shrink-0 bg-white dark:bg-dark-app-surface">
        <div className="relative flex h-[76px] flex-nowrap items-center gap-1 overflow-visible px-4 py-4">
          <div className="flex shrink-0 items-center">
            <button type="button" onClick={onBack} aria-label="Voltar para o menu" className="rounded-lg p-1 text-slate-700 dark:text-dark-app-text-primary">
              <ArrowLeft size={24} />
            </button>
          </div>
          <div className="mx-auto flex items-center justify-center gap-0.5">
            <button type="button" aria-label="Mês anterior" onClick={() => moveMonth(-1)} className="shrink-0 p-1">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="shrink-0 whitespace-nowrap text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">
              {MONTHS[month]}/{String(year).slice(-2)}
            </span>
            <button type="button" aria-label="Próximo mês" onClick={() => moveMonth(1)} className="shrink-0 p-1">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <span className="w-8 shrink-0" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {/* Resumo Mensal */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-dark-app-surface">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider dark:text-dark-app-text-secondary">Total do Mês</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-dark-app-text-primary">
              {currencySymbol} {summary.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-dark-app-text-secondary">
            {summary.activeCount} assinatura(s) ativa(s)
          </p>
        </div>

        {/* Categoria breakdown */}
        {sortedCategories.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-dark-app-surface">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-app-text-primary mb-4">Gasto por Categoria</h3>
            <div className="space-y-3">
              {sortedCategories.map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-dark-app-text-primary">
                    {cat}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-dark-app-text-primary">
                    {currencySymbol} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Assinaturas */}
        <div className="rounded-2xl bg-white shadow-sm dark:bg-dark-app-surface overflow-hidden">
          <div className="border-b border-slate-100 dark:border-dark-app-border px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-app-text-primary">Serviços</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-app-border">
            {summary.transactions.map((transaction) => {
              const tags = (transaction.tags || []).map(normalizeTag).filter(t => t !== 'assinatura');
              const isCard = !!transaction.cardId;
              
              return (
                <button
                  type="button"
                  key={transaction.id}
                  onClick={() => onEdit(transaction)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-dark-app-surface-secondary"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <strong className="block truncate text-base font-bold text-slate-900 dark:text-dark-app-text-primary">
                      {transaction.description}
                    </strong>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-dark-app-text-secondary">
                      <span>{displayDate(transaction.date)}</span>
                      {transaction.recurrenceFrequency && transaction.recurrenceFrequency !== 'NONE' && (
                        <span className="inline-flex items-center gap-1">
                          <Repeat size={12} /> Recorrente
                        </span>
                      )}
                      {isCard && (
                        <span className="inline-flex items-center gap-1">
                          <CardIcon size={12} /> Cartão
                        </span>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end">
                    <span className="text-base font-bold text-rose-600">
                      - {currencySymbol} {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 text-slate-300 dark:text-dark-app-text-secondary" />
                  </div>
                </button>
              );
            })}
            {!summary.transactions.length && (
              <p className="p-6 text-center text-sm italic text-slate-500 dark:text-dark-app-text-secondary">
                Nenhuma assinatura ativa neste mês.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionsView;
