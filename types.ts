
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum FinancialGroup {
  PERSONAL_INCOME = 'PERSONAL_INCOME',
  REIMBURSEMENT = 'REIMBURSEMENT',
  PERSONAL_EXPENSE = 'PERSONAL_EXPENSE',
  ADVANCE_TO_OTHERS = 'ADVANCE_TO_OTHERS',
  SAVINGS = 'SAVINGS'
}

export type PaymentMethod = 'CASH' | 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'BOLETO' | 'OTHER';

export enum Category {
  SALARY = 'Salário',
  RESERVE = 'Reserva',
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  HEALTH = 'Saúde',
  LEISURE = 'Lazer',
  HOUSE = 'Moradia',
  SUBSCRIPTION = 'Assinatura',
  ADJUSTMENT = 'Ajuste de Saldo',
  OTHER = 'Outros'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  tags?: string[];
  financialGroup?: FinancialGroup;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  purchaseDate?: string;
  dueDate?: string;
  comment: string;
  isFixed?: boolean; // Usado internamente para "Recorrente"
  isInstallment?: boolean;
  installmentInfo?: {
    current: number;
    total: number;
    purchaseId: string;
  };
  batchId?: string;
  batchName?: string;
  importDate?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  dueDay: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
}

export interface InitialBalance {
  amount: number;
  date: string;
}

export interface SalaryDiscount {
  id: string;
  name: string;
  amount: number;
  type: 'VALUE' | 'PERCENT';
}

export interface SalaryInfo {
  gross: number;
  discounts: SalaryDiscount[];
}

export interface DateRange {
  start: string;
  end: string;
}

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface UserSettings {
  currency: CurrencyCode;
  aiEnabled: boolean;
  userName: string;
  userPhoto: string;
  theme: 'light' | 'dark';
  appMode: 'pro' | 'lite' | 'developer';
  developerViewport?: 'notebook' | 'iphone-16e' | 'galaxy-a73' | 'ipad-11';
}
