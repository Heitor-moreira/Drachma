import { useEffect, useRef, useState } from 'react';
import { DataEvent, getLatestDataEvent, readJson, readSnapshot, writeSnapshot } from '../appStorage';
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
  const [lastDataEvent, setLastDataEvent] = useState<DataEvent | undefined>();
  const pendingEventRef = useRef<DataEvent | undefined>(undefined);
  useEffect(() => {
    const snapshot = readSnapshot();
    setLastDataEvent(snapshot?.lastDataEvent);
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
    const timer = window.setTimeout(() => {
      const candidate = pendingEventRef.current || { type: 'SAVE' as const, timestamp: new Date().toISOString() };
      const event = getLatestDataEvent(lastDataEvent, candidate);
      pendingEventRef.current = undefined;
      writeSnapshot({ ...state, lastDataEvent: event });
      setLastDataEvent(event);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [state.transactions, state.subscriptions, state.initialBalance, state.salaryInfo, state.dateRange, state.settings, state.cards, loaded]);

  const saveNow = () => {
    const event = getLatestDataEvent(lastDataEvent, { type: 'SAVE', timestamp: new Date().toISOString() });
    writeSnapshot({ ...state, lastDataEvent: event });
    setLastDataEvent(event);
  };

  const recordDataEvent = (event: DataEvent) => {
    const latestEvent = getLatestDataEvent(lastDataEvent, event);
    pendingEventRef.current = latestEvent;
    writeSnapshot({ ...state, lastDataEvent: latestEvent });
    setLastDataEvent(latestEvent);
  };

  return { lastDataEvent, saveNow, recordDataEvent };
};
