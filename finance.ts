import { FinancialGroup, PaymentMethod, Transaction, TransactionType, CreditCard, EntryType } from './types';

export const getTransactionEntryType = (transaction: Transaction): EntryType => {
  if (transaction.entryType) return transaction.entryType;
  if (transaction.cardId) return 'CARD';
  if (transaction.paymentMethod === 'CREDIT_CARD') return 'CARD';
  if (transaction.financialGroup === FinancialGroup.SAVINGS) return 'SAVINGS';
  return transaction.type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE';
};

export const normalizeTransaction = (transaction: Transaction): Transaction => {
  const entryType = transaction.cardId ? 'CARD' : getTransactionEntryType(transaction);
  const { category, ...rest } = transaction as Transaction & { category?: unknown };
  return { ...rest, entryType };
};

export const serializeTransaction = (transaction: Transaction): Transaction => {
  const normalized = normalizeTransaction(transaction);
  const { type, financialGroup, paymentMethod, ...rest } = normalized;
  return rest;
};

export const getFinancialGroup = (transaction: Transaction): FinancialGroup => {
  if (getTransactionEntryType(transaction) === 'CARD') return FinancialGroup.PERSONAL_EXPENSE;
  if (getTransactionEntryType(transaction) === 'INCOME') return FinancialGroup.PERSONAL_INCOME;
  if (transaction.financialGroup === FinancialGroup.SAVINGS) return FinancialGroup.SAVINGS;
  return FinancialGroup.PERSONAL_EXPENSE;
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

export const getRecurrenceDate = (dateString: string, frequency: NonNullable<Transaction['recurrenceFrequency']>, interval: number) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const base = new Date(y, m - 1, d, 12);

  if (frequency === 'DAILY') base.setDate(base.getDate() + interval);
  else if (frequency === 'WEEKLY') base.setDate(base.getDate() + interval * 7);
  else if (frequency === 'YEARLY') base.setFullYear(base.getFullYear() + interval);
  else return addMonthsKeepingDay(dateString, interval);

  return formatDate(base);
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
  if (getTransactionEntryType(transaction) !== 'CARD' || !transaction.cardId) return transaction.date;
  const card = cards.find(c => c.id === transaction.cardId);
  return card ? transaction.date : transaction.date;
};

export const projectTransactions = (transactions: Transaction[], start: string, end: string, cards: CreditCard[] = []) => {
  const result: Transaction[] = [];
  for (const transaction of transactions) {
    const baseDate = transaction.date;
    const frequency = transaction.recurrenceFrequency || (transaction.isFixed ? 'MONTHLY' : 'NONE');
    const isRecurring = frequency !== 'NONE';
    const totalOccurrences = transaction.recurrenceEndMode === 'COUNT'
      // recurrenceCount representa repetições após o lançamento original.
      ? Math.max(0, transaction.recurrenceCount || 0) + 1
      : Number.POSITIVE_INFINITY;
    let index = 0;
    while (index < totalOccurrences && index < 120) {
      const cursor = index === 0 ? baseDate : getRecurrenceDate(baseDate, frequency, index);
      if (cursor > end) break;
      if (transaction.recurrenceExcludedDates?.includes(cursor)) {
        index++;
        continue;
      }
      const projected = index === 0 ? transaction : { ...transaction, id: `${transaction.id}-projection-${index}`, date: cursor };
      const impactDate = getCashImpactDate(projected, cards);
      if (impactDate >= start && impactDate <= end) result.push({ ...projected, date: impactDate });
      if (!isRecurring) break;
      index++;
    }
  }
  return result;
};

export const isPersonalIncome = (t: Transaction) => getTransactionEntryType(t) === 'INCOME';
export const isPersonalExpense = (t: Transaction) => getFinancialGroup(t) === FinancialGroup.PERSONAL_EXPENSE;
export const isSavings = (t: Transaction) => getFinancialGroup(t) === FinancialGroup.SAVINGS;

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro', PIX: 'Pix', DEBIT_CARD: 'Cartão de débito', CREDIT_CARD: 'Cartão de crédito', BOLETO: 'Boleto', OTHER: 'Outro'
};
