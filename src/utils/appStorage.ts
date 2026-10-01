import { CreditCard, DateRange, InitialBalance, SalaryInfo, Subscription, Transaction, UserSettings } from '../types';
import { normalizeTransaction, serializeTransaction } from './finance';

export const APP_STORAGE_VERSION = 2;
export const APP_STORAGE_KEY = 'drachma_app_state';

export type DataEventType = 'SAVE' | 'IMPORT' | 'EXPORT' | 'DELETE';
export type SaveOrigin = 'manual' | 'automatic';

export interface DataEvent {
  type: DataEventType;
  timestamp: string;
  saveOrigin?: SaveOrigin;
}

export interface AppStateSnapshot {
  version: number;
  transactions: Transaction[];
  subscriptions: Subscription[];
  initialBalance: InitialBalance;
  salaryInfo: SalaryInfo;
  dateRange: DateRange;
  settings: UserSettings;
  cards: CreditCard[];
  lastDataEvent?: DataEvent;
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const createSnapshot = (state: Omit<AppStateSnapshot, 'version'>): AppStateSnapshot => ({
  version: APP_STORAGE_VERSION,
  ...state,
  transactions: state.transactions.map(serializeTransaction).map(normalizeTransaction)
});

export const getLatestDataEvent = (current: DataEvent | undefined, next: DataEvent): DataEvent => {
  if (!current || new Date(next.timestamp).getTime() >= new Date(current.timestamp).getTime()) return next;
  return current;
};

export const validateSnapshot = (value: unknown): value is Partial<AppStateSnapshot> => {
  if (!isObject(value) || !Array.isArray(value.transactions)) return false;
  
  for (const tx of value.transactions) {
    if (!isObject(tx)) return false;
    if (typeof tx.id !== 'string' || typeof tx.date !== 'string' || typeof tx.amount !== 'number') return false;
    if (tx.description !== undefined && typeof tx.description !== 'string') return false;
    if (tx.comment !== undefined && typeof tx.comment !== 'string') return false;
    if (tx.tags !== undefined && !Array.isArray(tx.tags)) return false;
  }

  if (value.settings !== undefined) {
    if (!isObject(value.settings)) return false;
    const settings = value.settings as Record<string, unknown>;
    if (settings.userPhoto !== undefined && typeof settings.userPhoto !== 'string') return false;
  }

  return true;
};

export const normalizeSnapshot = (value: unknown): Partial<AppStateSnapshot> => {
  if (!validateSnapshot(value)) throw new Error('Arquivo inválido');
  const data = value as Partial<AppStateSnapshot>;
  
  const settings = data.settings ? { ...data.settings } : undefined;
  if (settings?.userPhoto) {
    if (!settings.userPhoto.startsWith('https://') && !settings.userPhoto.startsWith('data:image/')) {
      settings.userPhoto = ''; // reject unsafe schemas
    }
  }

  return {
    ...data,
    ...(settings ? { settings } : {}),
    transactions: (data.transactions || []).map(transaction => normalizeTransaction(transaction))
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
