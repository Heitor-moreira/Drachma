import { CreditCard, DateRange, InitialBalance, SalaryInfo, Subscription, Transaction, UserSettings } from './types';
import { normalizeTransaction, serializeTransaction } from './finance';

export const APP_STORAGE_VERSION = 2;
export const APP_STORAGE_KEY = 'drachma_app_state';

export interface AppStateSnapshot {
  version: number;
  transactions: Transaction[];
  subscriptions: Subscription[];
  initialBalance: InitialBalance;
  salaryInfo: SalaryInfo;
  dateRange: DateRange;
  settings: UserSettings;
  cards: CreditCard[];
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const createSnapshot = (state: Omit<AppStateSnapshot, 'version'>): AppStateSnapshot => ({
  version: APP_STORAGE_VERSION,
  ...state,
  transactions: state.transactions.map(serializeTransaction).map(normalizeTransaction)
});

export const validateSnapshot = (value: unknown): value is Partial<AppStateSnapshot> => {
  if (!isObject(value) || !Array.isArray(value.transactions)) return false;
  return value.transactions.every(transaction => isObject(transaction) && typeof transaction.id === 'string' && typeof transaction.date === 'string' && typeof transaction.amount === 'number');
};

export const normalizeSnapshot = (value: unknown): Partial<AppStateSnapshot> => {
  if (!validateSnapshot(value)) throw new Error('Arquivo inválido');
  const data = value as Partial<AppStateSnapshot>;
  return {
    ...data,
    transactions: data.transactions!.map(transaction => normalizeTransaction(transaction))
  };
};

export const readJson = (key: string): unknown => {
  const saved = localStorage.getItem(key);
  if (!saved) return undefined;
  try { return JSON.parse(saved); } catch { return undefined; }
};

export const readSnapshot = (): Partial<AppStateSnapshot> | undefined => {
  const snapshot = readJson(APP_STORAGE_KEY);
  return snapshot ? normalizeSnapshot(snapshot) : undefined;
};

export const writeSnapshot = (state: Omit<AppStateSnapshot, 'version'>): void => {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(createSnapshot(state)));
};
