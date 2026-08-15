import { useEffect, useState } from 'react';
import { readJson, readSnapshot, writeSnapshot } from '../appStorage';
import { InitialBalance, SalaryInfo, Subscription, Transaction, UserSettings, DateRange, CreditCard } from '../types';

const LEGACY_KEYS = {
  transactions: 'drachma_transactions',
  subscriptions: 'drachma_subscriptions',
  initialBalance: 'drachma_initial_balance',
  salaryInfo: 'drachma_salary_info'
  ,dateRange: 'drachma_global_date_range'
  ,settings: 'drachma_user_settings'
  ,cards: 'drachma_credit_cards'
} as const;

interface AppPersistenceState {
  transactions: Transaction[];
  subscriptions: Subscription[];
  initialBalance: InitialBalance;
  salaryInfo: SalaryInfo;
  dateRange: DateRange;
  settings: UserSettings;
  cards: CreditCard[];
}

interface AppPersistenceSetters {
  setTransactions: (value: Transaction[]) => void;
  setSubscriptions: (value: Subscription[]) => void;
  setInitialBalance: (value: InitialBalance) => void;
  setSalaryInfo: (value: SalaryInfo) => void;
  setDateRange: (value: DateRange) => void;
  setSettings: (value: UserSettings) => void;
  setCards: (value: CreditCard[]) => void;
}

export const useAppPersistence = (state: AppPersistenceState, setters: AppPersistenceSetters) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const snapshot = readSnapshot();
    const transactions = snapshot?.transactions || readJson(LEGACY_KEYS.transactions);
    const subscriptions = snapshot?.subscriptions || readJson(LEGACY_KEYS.subscriptions);
    const initialBalance = snapshot?.initialBalance || readJson(LEGACY_KEYS.initialBalance);
    const salaryInfo = snapshot?.salaryInfo || readJson(LEGACY_KEYS.salaryInfo);

    if (Array.isArray(transactions)) setters.setTransactions(transactions);
    if (Array.isArray(subscriptions)) setters.setSubscriptions(subscriptions as Subscription[]);
    if (initialBalance && typeof initialBalance === 'object') setters.setInitialBalance(initialBalance as InitialBalance);
    if (salaryInfo && typeof salaryInfo === 'object') setters.setSalaryInfo(salaryInfo as SalaryInfo);
    const dateRange = snapshot?.dateRange || readJson(LEGACY_KEYS.dateRange);
    const settings = snapshot?.settings || readJson(LEGACY_KEYS.settings);
    const cards = snapshot?.cards || readJson(LEGACY_KEYS.cards);
    if (dateRange && typeof dateRange === 'object') setters.setDateRange(dateRange as DateRange);
    if (settings && typeof settings === 'object') setters.setSettings(settings as UserSettings);
    if (Array.isArray(cards)) setters.setCards(cards as CreditCard[]);
    setLoaded(true);
    // Load once. Subsequent state changes are handled by the debounced writer below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => writeSnapshot(state), 150);
    return () => window.clearTimeout(timer);
  }, [state, loaded]);
};
