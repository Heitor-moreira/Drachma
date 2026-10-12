import { useEffect, useRef, useState } from 'react';
import { DataEvent, getLatestDataEvent } from '../utils/appStorage';
import type { DataRepository } from '../data/repository';
import { syncEngine } from '../data/syncEngine';
import { InitialBalance, SalaryInfo, Subscription, Transaction, UserSettings, DateRange, CreditCard } from '../types';

const LEGACY_KEYS = {
  transactions: 'drachma_transactions',
  subscriptions: 'drachma_subscriptions',
  initialBalance: 'drachma_initial_balance',
  salaryInfo: 'drachma_salary_info',
  dateRange: 'drachma_global_date_range',
  settings: 'drachma_user_settings',
  cards: 'drachma_credit_cards'
} as const;

export interface AppPersistenceState {
  transactions: Transaction[];
  subscriptions: Subscription[];
  initialBalance: InitialBalance;
  salaryInfo: SalaryInfo;
  dateRange: DateRange;
  settings: UserSettings;
  cards: CreditCard[];
}

export interface AppPersistenceSetters {
  setTransactions: (value: Transaction[]) => void;
  setSubscriptions: (value: Subscription[]) => void;
  setInitialBalance: (value: InitialBalance) => void;
  setSalaryInfo: (value: SalaryInfo) => void;
  setDateRange: (value: DateRange) => void;
  setSettings: (value: UserSettings) => void;
  setCards: (value: CreditCard[]) => void;
}

export const useAppPersistence = (repo: DataRepository, state: AppPersistenceState, setters: AppPersistenceSetters) => {
  const [loaded, setLoaded] = useState(false);
  const [lastDataEvent, setLastDataEvent] = useState<DataEvent | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const savedStateRef = useRef<string | undefined>(undefined);
  const previousStateRef = useRef<AppPersistenceState | undefined>(undefined);
  const pendingEventRef = useRef<DataEvent | undefined>(undefined);
  const latestStateRef = useRef<AppPersistenceState>(state);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const snapshot = repo.read();
    setLastDataEvent(snapshot?.lastDataEvent);
    const transactions = snapshot?.transactions || repo.readLegacyKey(LEGACY_KEYS.transactions);
    const subscriptions = snapshot?.subscriptions || repo.readLegacyKey(LEGACY_KEYS.subscriptions);
    const initialBalance = snapshot?.initialBalance || repo.readLegacyKey(LEGACY_KEYS.initialBalance);
    const salaryInfo = snapshot?.salaryInfo || repo.readLegacyKey(LEGACY_KEYS.salaryInfo);

    if (Array.isArray(transactions)) setters.setTransactions(transactions);
    if (Array.isArray(subscriptions)) setters.setSubscriptions(subscriptions as Subscription[]);
    if (initialBalance && typeof initialBalance === 'object') setters.setInitialBalance(initialBalance as InitialBalance);
    if (salaryInfo && typeof salaryInfo === 'object') setters.setSalaryInfo(salaryInfo as SalaryInfo);
    const dateRange = snapshot?.dateRange || repo.readLegacyKey(LEGACY_KEYS.dateRange);
    const settings = snapshot?.settings || repo.readLegacyKey(LEGACY_KEYS.settings);
    const cards = snapshot?.cards || repo.readLegacyKey(LEGACY_KEYS.cards);
    if (dateRange && typeof dateRange === 'object') setters.setDateRange(dateRange as DateRange);
    if (settings && typeof settings === 'object') setters.setSettings(settings as UserSettings);
    if (Array.isArray(cards)) setters.setCards(cards as CreditCard[]);
    setLoaded(true);
    previousStateRef.current = state;
    // Load once. Subsequent state changes are handled by the debounced writer below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assina atualizações vindas remotamente do SyncEngine (pull / outro dispositivo)
  useEffect(() => {
    return syncEngine.subscribeRemoteUpdate((updatedSnapshot) => {
      // Atualiza previousStateRef imediatamente com o novo snapshot remoto mesclado
      const currentState = latestStateRef.current;
      const newRemoteBase: AppPersistenceState = {
        transactions: Array.isArray(updatedSnapshot.transactions) ? updatedSnapshot.transactions : (previousStateRef.current?.transactions || currentState.transactions),
        subscriptions: Array.isArray(updatedSnapshot.subscriptions) ? updatedSnapshot.subscriptions : (previousStateRef.current?.subscriptions || currentState.subscriptions),
        cards: Array.isArray(updatedSnapshot.cards) ? updatedSnapshot.cards : (previousStateRef.current?.cards || currentState.cards),
        settings: updatedSnapshot.settings || previousStateRef.current?.settings || currentState.settings,
        salaryInfo: updatedSnapshot.salaryInfo || previousStateRef.current?.salaryInfo || currentState.salaryInfo,
        initialBalance: updatedSnapshot.initialBalance || previousStateRef.current?.initialBalance || currentState.initialBalance,
        dateRange: updatedSnapshot.dateRange || previousStateRef.current?.dateRange || currentState.dateRange,
      };

      previousStateRef.current = newRemoteBase;
      savedStateRef.current = JSON.stringify(newRemoteBase);

      if (Array.isArray(updatedSnapshot.transactions)) {
        setters.setTransactions(updatedSnapshot.transactions);
      }
      if (Array.isArray(updatedSnapshot.subscriptions)) {
        setters.setSubscriptions(updatedSnapshot.subscriptions);
      }
      if (Array.isArray(updatedSnapshot.cards)) {
        setters.setCards(updatedSnapshot.cards);
      }
      if (updatedSnapshot.settings) {
        setters.setSettings(updatedSnapshot.settings);
      }
      if (updatedSnapshot.salaryInfo) {
        setters.setSalaryInfo(updatedSnapshot.salaryInfo);
      }
      if (updatedSnapshot.initialBalance) {
        setters.setInitialBalance(updatedSnapshot.initialBalance);
      }
      if (updatedSnapshot.dateRange) {
        setters.setDateRange(updatedSnapshot.dateRange);
      }
    });
  }, [setters]);

  useEffect(() => {
    if (!loaded) return;
    const serializedState = JSON.stringify(state);
    if (!savedStateRef.current) {
      savedStateRef.current = serializedState;
      return;
    }
    setIsDirty(serializedState !== savedStateRef.current);
  }, [state, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      const candidate = pendingEventRef.current || { 
        type: 'SAVE' as const, 
        saveOrigin: 'automatic' as const, 
        timestamp: new Date().toISOString() 
      };
      const event = getLatestDataEvent(lastDataEvent, candidate);
      pendingEventRef.current = undefined;
      repo.write({ ...state, lastDataEvent: event });
      setLastDataEvent(event);

      // Enfileira mutações para Cloud Sync comparando com previousStateRef
      const currentUserId = syncEngine.getUserId();
      if (currentUserId && previousStateRef.current) {
        syncEngine.enqueueStateDiff(previousStateRef.current, state, currentUserId);
      }
      previousStateRef.current = state;
    }, 150);
    return () => window.clearTimeout(timer);
  }, [state.transactions, state.subscriptions, state.initialBalance, state.salaryInfo, state.dateRange, state.settings, state.cards, loaded]);

  const saveNow = async (): Promise<void> => {
    const event = getLatestDataEvent(lastDataEvent, { type: 'SAVE', saveOrigin: 'manual', timestamp: new Date().toISOString() });
    repo.write({ ...state, lastDataEvent: event });
    setLastDataEvent(event);
    savedStateRef.current = JSON.stringify(state);
    setIsDirty(false);

    const currentUserId = syncEngine.getUserId();
    if (currentUserId) {
      if (previousStateRef.current) {
        syncEngine.enqueueStateDiff(previousStateRef.current, state, currentUserId);
      }
      if (syncEngine.isOnline()) {
        await syncEngine.sync();
        const status = syncEngine.getStatus();
        if (status.syncError) {
          throw status.syncError;
        }
      }
    }
    previousStateRef.current = state;
  };

  const recordDataEvent = (event: DataEvent) => {
    const latestEvent = getLatestDataEvent(lastDataEvent, event);
    pendingEventRef.current = latestEvent;
    repo.write({ ...state, lastDataEvent: latestEvent });
    setLastDataEvent(latestEvent);
  };

  return { lastDataEvent, saveNow, recordDataEvent, isDirty };
};
