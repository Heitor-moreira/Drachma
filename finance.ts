import { FinancialGroup, PaymentMethod, Transaction, TransactionType, CreditCard } from './types';

export const getFinancialGroup = (transaction: Transaction): FinancialGroup => {
  if (transaction.financialGroup) return transaction.financialGroup;
  if (transaction.category === 'Reserva') return FinancialGroup.SAVINGS;
  return transaction.type === TransactionType.INCOME
    ? FinancialGroup.PERSONAL_INCOME
    : FinancialGroup.PERSONAL_EXPENSE;
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addMonthsKeepingDay = (dateString: string, months: number) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const result = new Date(y, m - 1 + months, 1, 12);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(d, lastDay));
  return formatDate(result);
};

export const getCardDueDate = (purchaseDate: string, dueDay: number) => {
  const [y, m, d] = purchaseDate.split('-').map(Number);
  const dueMonth = d <= dueDay ? m - 1 : m;
  const due = new Date(y, dueMonth, 1, 12);
  const lastDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate();
  due.setDate(Math.min(dueDay, lastDay));
  return formatDate(due);
};

export const getCashImpactDate = (transaction: Transaction, cards: CreditCard[]) => {
  if (transaction.paymentMethod !== 'CREDIT_CARD' || !transaction.cardId) return transaction.date;
  const card = cards.find(c => c.id === transaction.cardId);
  const cardType = card?.type || 'CREDIT';
  return card && cardType === 'CREDIT' ? (transaction.dueDate || getCardDueDate(transaction.purchaseDate || transaction.date, card.dueDay || 1)) : transaction.date;
};

export const projectTransactions = (transactions: Transaction[], start: string, end: string, cards: CreditCard[] = []) => {
  const result: Transaction[] = [];
  for (const transaction of transactions) {
    const baseDate = transaction.purchaseDate || transaction.date;
    const interval = transaction.isFixed ? 1 : 0;
    let cursor = baseDate;
    let index = 0;
    while (cursor <= end && index < 120) {
      const projected = index === 0 ? transaction : { ...transaction, id: `${transaction.id}-projection-${index}`, date: cursor, purchaseDate: cursor };
      const impactDate = getCashImpactDate(projected, cards);
      if (impactDate >= start && impactDate <= end) result.push({ ...projected, date: impactDate });
      if (!interval) break;
      cursor = addMonthsKeepingDay(baseDate, index + 1);
      index++;
    }
  }
  return result;
};

export const isPersonalIncome = (t: Transaction) => getFinancialGroup(t) === FinancialGroup.PERSONAL_INCOME;
export const isPersonalExpense = (t: Transaction) => getFinancialGroup(t) === FinancialGroup.PERSONAL_EXPENSE;
export const isSavings = (t: Transaction) => getFinancialGroup(t) === FinancialGroup.SAVINGS;

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro', PIX: 'Pix', DEBIT_CARD: 'Cartão de débito', CREDIT_CARD: 'Cartão de crédito', BOLETO: 'Boleto', OTHER: 'Outro'
};
