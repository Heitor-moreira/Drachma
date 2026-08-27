
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  History,
  Settings,
  X,
  Wallet,
  Coins,
  Landmark,
  CalendarClock,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  Camera,
  Sun,
  Moon,
  Zap,
  Monitor,
  Code2,
  Repeat,
  ChevronRight,
  Menu
  , Plus
  , Calculator
  , Tags
  , MessageSquare
  , HelpCircle
  , Upload
  , Download
  , Save
  , XCircle
  , CalendarDays
  , ChartNoAxesCombined
  , ArrowLeft
  , Database
} from 'lucide-react';
import { Transaction, Subscription, InitialBalance, SalaryInfo, DateRange, UserSettings, CurrencyCode, CreditCard as CreditCardModel, FinancialGroup, EntryType } from './types';
import packageJson from '../package.json';
import { getFinancialGroup, normalizeTransaction, getTransactionEntryType, getRecurrenceDate, formatLocalDate } from './utils/finance';
import { buildFeedbackMailto, getDeviceLabel } from './utils/feedback';
import { createSnapshot, DataEvent, normalizeSnapshot } from './utils/appStorage';
import { useAppPersistence } from './hooks/useAppPersistence';
import { fetchAppVersion, getVersionId, isNewVersion, VERSION_STORAGE_KEY, type AppVersion } from './utils/version';
import CategorySpending from './components/CategorySpending';
import TransactionForm from './components/TransactionForm';
import SubscriptionCalculator from './components/SubscriptionCalculator';
import DailyBalanceView from './components/DailyBalanceView';
import SalaryManager from './components/SalaryManager';
import InstallmentManager from './components/InstallmentManager';
import RecurringExpensesManager from './components/RecurringExpensesManager';
import CardManager from './components/CardManager';
import BalanceHorizonView from './components/BalanceHorizonView';
import TotalsView from './components/TotalsView';
import SavedAnnualView from './components/SavedAnnualView';
import DayTransactionsView from './components/DayTransactionsView';
import MonthlyTransactionsView from './components/MonthlyTransactionsView';
import RecentTransactionsView from './components/RecentTransactionsView';
import TagsView from './components/TagsView';

const STORAGE_KEY_TRANSACTIONS = 'drachma_transactions';
const STORAGE_KEY_SUBSCRIPTIONS = 'drachma_subscriptions';
const STORAGE_KEY_INITIAL_BALANCE = 'drachma_initial_balance';
const STORAGE_KEY_SALARY_INFO = 'drachma_salary_info';
const STORAGE_KEY_DATE_RANGE = 'drachma_global_date_range';
const STORAGE_KEY_SETTINGS = 'drachma_user_settings';
const STORAGE_KEY_CARDS = 'drachma_credit_cards';

const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string }> = {
  BRL: { symbol: 'R$', name: 'Real Brasileiro' },
  USD: { symbol: '$', name: 'Dólar Americano' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'Libra Esterlina' },
  JPY: { symbol: '¥', name: 'Iene Japonês' }
};

const formatLocalYYYYMMDD = (date: Date) => {
  return formatLocalDate(date);
};

const App: React.FC = () => {
  type TabType = 'dailyBalance' | 'balanceHorizon' | 'dayTransactions' | 'savedAnnual' | 'monthlyTransactions' | 'recentTransactions' | 'tags' | 'totals' | 'categorySpending' | 'installments' | 'fixed' | 'salary' | 'subscriptions' | 'cards' | 'menu' | 'data';
  const [activeTab, setActiveTab] = useState<TabType>('dailyBalance');
  const [selectedDay, setSelectedDay] = useState(formatLocalYYYYMMDD(new Date()));
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isInitialFlashActive, setIsInitialFlashActive] = useState(true);
  const [isBalanceSummaryOpen, setIsBalanceSummaryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<{ sourceId: string; occurrenceDate: string; occurrenceIndex: number } | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo>({ gross: 0, discounts: [] });
  const [cards, setCards] = useState<CreditCardModel[]>([]);
  const [initialBalance, setInitialBalance] = useState<InitialBalance>({ amount: 0, date: formatLocalYYYYMMDD(new Date()) });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    return {
      currency: 'BRL',
      userName: 'Usuário Drachma',
      userPhoto: 'https://ui-avatars.com/api/?name=User&background=2687c5&color=ffffff',
      theme: 'light'
    };
  });
  const feedbackMailto = buildFeedbackMailto(packageJson.version, typeof navigator !== 'undefined' ? getDeviceLabel(navigator.userAgent) : 'Dispositivo desconhecido');

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatLocalYYYYMMDD(start), end: formatLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTransactionDate, setNewTransactionDate] = useState<string | undefined>();
  const [newTransactionGroup, setNewTransactionGroup] = useState<(FinancialGroup | EntryType) | undefined>(undefined);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDeleteDataModalOpen, setIsDeleteDataModalOpen] = useState(false);
  const [isRecentDataEvent, setIsRecentDataEvent] = useState(false);
  const [availableVersion, setAvailableVersion] = useState<AppVersion | null>(null);
  const versionCheckInFlightRef = useRef(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialFlashActive(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  const { lastDataEvent, saveNow, recordDataEvent, isDirty } = useAppPersistence(
    { transactions, subscriptions, initialBalance, salaryInfo, dateRange, settings, cards },
    { setTransactions: value => setTransactions(value.map(normalizeTransaction)), setSubscriptions, setInitialBalance, setSalaryInfo, setDateRange, setSettings, setCards }
  );

  const checkForAppUpdate = async () => {
    if (versionCheckInFlightRef.current) return;
    versionCheckInFlightRef.current = true;
    try {
      const remoteVersion = await fetchAppVersion();
      const knownVersionId = localStorage.getItem(VERSION_STORAGE_KEY);
      if (!knownVersionId) {
        localStorage.setItem(VERSION_STORAGE_KEY, getVersionId(remoteVersion));
      } else if (isNewVersion(remoteVersion, knownVersionId)) {
        setAvailableVersion(remoteVersion);
      }
    } catch {
      // A version check must never prevent the app from working offline.
    } finally {
      versionCheckInFlightRef.current = false;
    }
  };

  useEffect(() => {
    void checkForAppUpdate();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkForAppUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const updateApp = () => {
    if (!availableVersion || isDirty) return;
    localStorage.setItem(VERSION_STORAGE_KEY, getVersionId(availableVersion));
    window.location.reload();
  };

  useEffect(() => {
    if (!lastDataEvent) {
      setIsRecentDataEvent(false);
      return;
    }
    const remaining = 5000 - (Date.now() - new Date(lastDataEvent.timestamp).getTime());
    if (remaining <= 0) {
      setIsRecentDataEvent(false);
      return;
    }
    setIsRecentDataEvent(true);
    const timer = window.setTimeout(() => setIsRecentDataEvent(false), remaining);
    return () => window.clearTimeout(timer);
  }, [lastDataEvent]);

  const formatDataEvent = (event: DataEvent | undefined) => {
    if (!event) return 'Nenhuma atualização registrada';
    const date = new Date(event.timestamp);
    const label = event.type === 'IMPORT' ? 'Arquivo importado com sucesso' : event.type === 'EXPORT' ? 'Arquivo exportado com sucesso' : event.type === 'DELETE' ? 'Dados excluídos com sucesso' : `Último salvamento ${event.saveOrigin === 'manual' ? 'manual' : 'automático'}`;
    return `${label} às ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleSave = () => {
    setSaveState('saving');
    try {
      saveNow();
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const currencySymbol = CURRENCIES[settings.currency].symbol;

  const availableTags = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.tags || []))).sort((a, b) => a.localeCompare(b)), [transactions]);

  const exportAppData = () => {
    const backup = { ...createSnapshot({ transactions, subscriptions, initialBalance, salaryInfo, dateRange, settings, cards }), exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `drachma-backup-${formatLocalYYYYMMDD(new Date())}.json`; link.click(); URL.revokeObjectURL(url);
    recordDataEvent({ type: 'EXPORT', timestamp: new Date().toISOString() });
  };
  const importAppData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try {
      const data = normalizeSnapshot(JSON.parse(String(reader.result)));
      setTransactions(data.transactions!.map((t: Transaction) => normalizeTransaction(t))); if (Array.isArray(data.subscriptions)) setSubscriptions(data.subscriptions); if (data.initialBalance) setInitialBalance(data.initialBalance); if (data.salaryInfo) setSalaryInfo(data.salaryInfo); if (data.dateRange) setDateRange(data.dateRange); if (data.settings) setSettings(data.settings); if (Array.isArray(data.cards)) setCards(data.cards);
      recordDataEvent({ type: 'IMPORT', timestamp: new Date().toISOString() });
      setSaveState('idle');
      setFeedbackMessage('Dados importados com sucesso!');
    } catch { setFeedbackMessage('Arquivo JSON inválido.'); } event.target.value = ''; };
    reader.readAsText(file);
  };
  const clearImportedData = () => {
    setTransactions([]); setSubscriptions([]); setInitialBalance({ amount: 0, date: formatLocalYYYYMMDD(new Date()) }); setSalaryInfo({ gross: 0, discounts: [] }); setCards([]);
    [STORAGE_KEY_TRANSACTIONS, STORAGE_KEY_SUBSCRIPTIONS, STORAGE_KEY_INITIAL_BALANCE, STORAGE_KEY_SALARY_INFO, STORAGE_KEY_DATE_RANGE, STORAGE_KEY_SETTINGS, STORAGE_KEY_CARDS].forEach(key => localStorage.removeItem(key));
    recordDataEvent({ type: 'DELETE', timestamp: new Date().toISOString() });
    setSaveState('idle');
    setFeedbackMessage('Dados excluídos.');
    setIsDeleteDataModalOpen(false);
  };

  const calculatedNetSalary = useMemo(() => {
    const totalDiscounts = salaryInfo.discounts.reduce((acc, d) => {
      if (d.type === 'PERCENT') return acc + (salaryInfo.gross * (d.amount / 100));
      return acc + d.amount;
    }, 0);
    return salaryInfo.gross - totalDiscounts;
  }, [salaryInfo]);

  useEffect(() => {
    setBaseSalary(calculatedNetSalary);
  }, [calculatedNetSalary]);

  const addTransactions = (newTs: Transaction[]) => {
    const createdAt = new Date().toISOString();
    const normalized = newTs.map(transaction => normalizeTransaction({ ...transaction, createdAt: transaction.createdAt || createdAt }));
    setTransactions(prev => [...normalized, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFeedbackMessage('Movimentação adicionada!');
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    const source = transactions.find(t => id === t.id || id.startsWith(`${t.id}-projection-`));
    if (!source) return;
    const projectionMatch = id.match(/-projection-(\d+)$/);
    const occurrenceIndex = projectionMatch ? Number(projectionMatch[1]) : 0;
    const occurrenceDate = occurrenceIndex === 0
      ? source.date
      : getRecurrenceDate(source.date, source.recurrenceFrequency || 'MONTHLY', occurrenceIndex);
    const isRecurring = (source.recurrenceFrequency && source.recurrenceFrequency !== 'NONE') || source.isFixed;

    if (!isRecurring) {
      if (window.confirm('Excluir este lançamento?')) setTransactions(prev => prev.filter(t => t.id !== source.id));
      return;
    }

    setPendingRecurringDelete({ sourceId: source.id, occurrenceDate, occurrenceIndex });
  };

  const confirmRecurringDelete = (scope: 'one' | 'future' | 'all') => {
    if (!pendingRecurringDelete) return;
    if (scope === 'all') {
      setTransactions(prev => prev.filter(t => t.id !== pendingRecurringDelete.sourceId));
    } else if (scope === 'future') {
      if (pendingRecurringDelete.occurrenceIndex === 0) {
        setTransactions(prev => prev.filter(t => t.id !== pendingRecurringDelete.sourceId));
      } else {
        setTransactions(prev => prev.map(t => t.id === pendingRecurringDelete.sourceId
          ? { ...t, recurrenceEndMode: 'COUNT', recurrenceCount: pendingRecurringDelete.occurrenceIndex - 1 }
          : t));
      }
    } else {
      setTransactions(prev => prev.map(t => t.id === pendingRecurringDelete.sourceId
        ? { ...t, recurrenceExcludedDates: Array.from(new Set([...(t.recurrenceExcludedDates || []), pendingRecurringDelete.occurrenceDate])) }
        : t));
    }
    setPendingRecurringDelete(null);
  };

  const openNewTransaction = (group?: FinancialGroup | EntryType, date?: string) => {
    setEditingTransaction(null);
    if (date) {
      setNewTransactionDate(date);
    } else {
      const today = new Date();
      const selectedPeriod = new Date(`${dateRange.start}T12:00:00`);
      const lastDayOfSelectedMonth = new Date(selectedPeriod.getFullYear(), selectedPeriod.getMonth() + 1, 0).getDate();
      const selectedDay = Math.min(today.getDate(), lastDayOfSelectedMonth);
      setNewTransactionDate(formatLocalYYYYMMDD(new Date(selectedPeriod.getFullYear(), selectedPeriod.getMonth(), selectedDay)));
    }
    setNewTransactionGroup(group);
    setIsFormOpen(true);
  };

  const totalBalance = useMemo(() => {
    const transactionSum = transactions.reduce((acc, t) => {
      return getTransactionEntryType(t) === 'INCOME' ? acc + t.amount : acc - t.amount;
    }, 0);
    return initialBalance.amount + transactionSum;
  }, [transactions, initialBalance]);

  const handleManualAdjustment = (newTotal: number) => {
    const diff = newTotal - totalBalance;
    if (diff === 0) return;
    const adjustment: Transaction = {
      id: `adj-${Date.now()}`,
      description: 'Ajuste Manual de Saldo',
      amount: Math.abs(diff),
      entryType: diff > 0 ? 'INCOME' : 'EXPENSE',
      date: formatLocalYYYYMMDD(new Date()),
      comment: `Saldo ajustado para ${currencySymbol} ${newTotal.toLocaleString()}`
    };
    addTransactions([adjustment]);
    setIsAdjustmentOpen(false);
  };

  const tabLabels: Record<TabType, string> = {
    dailyBalance: 'Extrato Diário',
    balanceHorizon: 'Horizonte de Saldos',
    dayTransactions: 'Lançamentos do Dia',
    savedAnnual: 'Economizado',
    monthlyTransactions: 'Movimentações do mês',
    recentTransactions: 'Lançamentos recentes',
    tags: 'Tags',
    totals: 'Totais',
    categorySpending: 'Gastos por Categoria',
    installments: 'Compras Parceladas',
    fixed: 'Compras Recorrentes',
    salary: 'Gestão de Salário',
    data: 'Dados',
    subscriptions: 'Assinaturas'
    , cards: 'Cartões',
    menu: 'Menu'
  };

  return (
    <div className="phone-shell min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-dark-app-text-primary overflow-hidden h-screen bg-slate-50 dark:bg-dark-app-surface transition-colors duration-300 relative">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-dark-app-surface border-r border-slate-200 dark:border-dark-app-border p-6 shrink-0 h-full transition-colors duration-300">
        <button 
          onClick={() => { setActiveTab('dailyBalance'); setIsReportsOpen(false); }}
          className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity text-left"
        >
          <div className="bg-theme p-2 rounded-xl text-white shadow-sm"><TrendingUp size={24} /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-dark-app-text-primary">Drachma</h1>
        </button>

        <div className="mb-6">
          <button onClick={() => setIsBalanceSummaryOpen(true)} className="w-full bg-slate-900 dark:bg-dark-app-surface-secondary text-white rounded-3xl p-5 shadow-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all group relative overflow-hidden">
            <div className="relative z-10 text-left">
              <p className="text-xs font-bold text-theme uppercase tracking-[0.2em] mb-1">Saldo Total</p>
              <h3 className="text-2xl font-bold">{currencySymbol} {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <Wallet size={60} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
          
          <>
              <div className="py-2">
                <button 
                  onClick={() => setIsReportsOpen(!isReportsOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 ${isReportsOpen ? 'text-slate-800 dark:text-dark-app-text-primary font-medium' : ''}`}
                >
                  <div className="flex items-center gap-3"><Layers size={18} /> Relatórios</div>
                  {isReportsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isReportsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-dark-app-border pl-2 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={() => setActiveTab('dailyBalance')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'dailyBalance' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><History size={16} /> Saldos</button>
                    <button onClick={() => setActiveTab('categorySpending')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'categorySpending' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Layers size={16} /> Gastos por Categoria</button>
                    <button onClick={() => setActiveTab('installments')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'installments' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CalendarClock size={16} /> Compras Parceladas</button>
                    <button onClick={() => setActiveTab('fixed')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'fixed' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Repeat size={16} /> Compras Recorrentes</button>
                  </div>
                )}
              </div>

          </>
          <button onClick={() => { setActiveTab('subscriptions'); setIsReportsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'subscriptions' ? 'bg-theme/20 text-slate-700 dark:text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CreditCard size={18} /> Assinaturas</button>
          <button onClick={() => { setActiveTab('cards'); setIsReportsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'cards' ? 'bg-theme/20 text-slate-700 dark:text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CreditCard size={18} /> Cartões</button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-dark-app-border flex items-center justify-between gap-2">
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl flex-1 transition-all overflow-hidden"
          >
            <img src={settings.userPhoto} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-theme" alt="Profile" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-dark-app-text-secondary truncate">{settings.userName}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drachma</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
          >
            <Settings size={20} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Navigation Dropdown Overlay */}
        {false && isMobileMenuOpen && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 left-4 right-4 bg-white dark:bg-dark-app-surface rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-dark-app-border animate-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-dark-app-text-primary uppercase text-xs tracking-widest">Navegação</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => { setActiveTab('dailyBalance'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dailyBalance' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><History size={18} /> Saldos</button>
                <button onClick={() => { setActiveTab('menu'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all bg-theme text-white">Menu</button>
                <>
                    <button onClick={() => { setActiveTab('categorySpending'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'categorySpending' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Layers size={18} /> Gastos por Categoria</button>
                    <button onClick={() => { setActiveTab('installments'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'installments' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CalendarClock size={18} /> Compras Parceladas</button>
                    <button onClick={() => { setActiveTab('fixed'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'fixed' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Repeat size={18} /> Compras Recorrentes</button>
                    <button onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CreditCard size={18} /> Assinaturas</button>
                    <button onClick={() => { setActiveTab('salary'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'salary' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Coins size={18} /> Gestão de Salário</button>
                    <button onClick={() => { setActiveTab('cards'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CreditCard size={18} /> Cartões</button>
                </>
                <div className="h-px bg-slate-100 dark:bg-dark-app-surface-secondary my-2"></div>
                <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary"><Settings size={18} /> Configurações</button>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 ${activeTab === 'dailyBalance' || activeTab === 'balanceHorizon' || activeTab === 'dayTransactions' || activeTab === 'savedAnnual' || activeTab === 'monthlyTransactions' || activeTab === 'recentTransactions' || activeTab === 'tags' || activeTab === 'totals' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 pb-28 md:p-8'} space-y-6`}>
          {activeTab === 'menu' && (
            <section className="-mx-4 -mt-4 min-h-full bg-app-background dark:bg-dark-app-background md:-mx-8 md:-mt-8">
              <div className="border-b border-app-border bg-app-surface px-6 pb-7 pt-8 dark:border-dark-app-border dark:bg-dark-app-surface">
                <h2 className="text-2xl font-bold text-app-text-primary dark:text-dark-app-text-primary">{settings.userName}</h2>
              </div>
              <div className="overflow-hidden bg-app-surface dark:bg-dark-app-surface">
                <button onClick={() => setIsProfileOpen(true)} className="flex min-h-20 w-full items-center gap-4 border-b border-app-border px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:border-dark-app-border dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><User size={24} strokeWidth={1.8} /> Editar perfil <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></button>
                <button onClick={() => setActiveTab('recentTransactions')} className="flex min-h-20 w-full items-center gap-4 border-b border-app-border px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:border-dark-app-border dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><History size={24} strokeWidth={1.8} /> Lançamentos recentes <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex min-h-20 w-full items-center gap-4 border-b border-app-border px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:border-dark-app-border dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><Settings size={24} strokeWidth={1.8} /> Configurações <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></button>
                <button onClick={() => setActiveTab('data')} className="flex min-h-20 w-full items-center gap-4 border-b border-app-border px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:border-dark-app-border dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><Database size={24} strokeWidth={1.8} /> Dados <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></button>
                <a href={feedbackMailto} className="flex min-h-20 w-full items-center gap-4 border-b border-app-border px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:border-dark-app-border dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><MessageSquare size={24} strokeWidth={1.8} /> Mandar sugestões <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></a>
                <button onClick={() => setFeedbackMessage('Consulte as configurações ou o suporte do Drachma.')} className="flex min-h-20 w-full items-center gap-4 px-6 text-left text-base font-normal text-app-text-primary transition-colors hover:bg-app-surface-secondary dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary"><HelpCircle size={24} strokeWidth={1.8} /> Ajuda <ChevronRight className="ml-auto text-app-border dark:text-dark-app-border" size={24} /></button>
              </div>
            </section>
          )}
          {activeTab === 'data' && (
            <section className="-mx-4 -mt-4 min-h-full bg-app-background dark:bg-dark-app-background md:-mx-8 md:-mt-8">
              <header className="flex h-[76px] shrink-0 items-center gap-2 border-b border-app-border bg-app-surface px-4 py-4 dark:border-dark-app-border dark:bg-dark-app-surface">
                <button onClick={() => setActiveTab('menu')} aria-label="Voltar" className="rounded-lg p-1 text-app-text-primary dark:text-dark-app-text-primary"><ArrowLeft className="h-6 w-6" /></button>
                <h1 className="text-2xl font-bold text-app-text-primary dark:text-dark-app-text-primary">dados</h1>
              </header>
              <div className="px-6 pb-8 pt-6">
                <p className={`mt-2 text-sm ${saveState === 'error' || lastDataEvent?.type === 'DELETE' ? 'text-rose-600' : isRecentDataEvent && lastDataEvent ? 'text-theme' : 'text-app-text-secondary dark:text-dark-app-text-secondary'}`}>
                  {saveState === 'saving' ? 'Salvando...' : saveState === 'error' ? 'Falha ao salvar' : formatDataEvent(lastDataEvent)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <button onClick={handleSave} disabled={!isDirty || saveState === 'saving'} className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-theme px-2 text-xs font-bold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:bg-app-surface-secondary disabled:text-app-text-secondary dark:disabled:bg-dark-app-surface-secondary dark:disabled:text-dark-app-text-secondary"><Save size={15} /> Salvar</button>
                  </div>
                  <div className="space-y-1">
                    <button onClick={exportAppData} aria-label="Exportar dados em JSON" className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-app-surface-secondary px-2 text-xs font-bold text-app-text-primary hover:brightness-95 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary"><Upload size={15} /> Exportar</button>
                    <p className="text-center text-xs text-app-text-secondary dark:text-dark-app-text-secondary">Backup em JSON</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => importFileRef.current?.click()} aria-label="Importar dados JSON" className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-app-surface-secondary px-2 text-xs font-bold text-app-text-primary hover:brightness-95 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-primary"><Download size={15} /> Importar</button>
                    <p className="text-center text-xs text-app-text-secondary dark:text-dark-app-text-secondary">Restaurar de arquivo</p>
                  </div>
                  <div className="space-y-1 border-l border-app-border pl-3 dark:border-dark-app-border">
                    <button onClick={() => setIsDeleteDataModalOpen(true)} aria-label="Excluir dados carregados" className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-rose-600 bg-transparent px-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-600 hover:text-white active:bg-rose-600 dark:border-rose-500 dark:text-rose-500 dark:hover:bg-rose-500 dark:hover:text-white"><XCircle size={15} /> Excluir</button>
                  </div>
                </div>
                <input ref={importFileRef} type="file" accept="application/json,.json" onChange={importAppData} className="hidden" />
              </div>
            </section>
          )}
          {activeTab === 'dailyBalance' && <DailyBalanceView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} initialBalance={initialBalance} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} cards={cards} onDayClick={(date, group) => openNewTransaction(group, date)} onOpenHorizon={() => setActiveTab('balanceHorizon')} />}
          {activeTab === 'balanceHorizon' && <BalanceHorizonView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} initialBalance={initialBalance} cards={cards} currencySymbol={currencySymbol} onBack={() => setActiveTab('dailyBalance')} onAdd={(group, date) => openNewTransaction(group, date)} onDayClick={(date) => { setSelectedDay(date); setActiveTab('dayTransactions'); }} />}
          {activeTab === 'dayTransactions' && <DayTransactionsView date={selectedDay} transactions={transactions} cards={cards} currencySymbol={currencySymbol} onBack={() => setActiveTab('balanceHorizon')} onAdd={(date) => openNewTransaction(undefined, date)} onEdit={setEditingTransaction} />}
          {activeTab === 'monthlyTransactions' && <MonthlyTransactionsView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} cards={cards} currencySymbol={currencySymbol} initialType={(newTransactionGroup as EntryType) || 'EXPENSE'} onBack={() => setActiveTab('totals')} onAdd={(date) => openNewTransaction(undefined, date)} onEdit={setEditingTransaction} />}
          {activeTab === 'recentTransactions' && <RecentTransactionsView transactions={transactions} cards={cards} currencySymbol={currencySymbol} onBack={() => setActiveTab('menu')} onEdit={setEditingTransaction} />}
          {activeTab === 'tags' && <TagsView transactions={transactions} cards={cards} currencySymbol={currencySymbol} onBack={() => setActiveTab('menu')} onEdit={setEditingTransaction} />}
          {activeTab === 'savedAnnual' && <SavedAnnualView transactions={transactions} cards={cards} currencySymbol={currencySymbol} initialYear={new Date(dateRange.start).getFullYear()} onBack={() => setActiveTab('totals')} />}
          {activeTab === 'totals' && <TotalsView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} cards={cards} currencySymbol={currencySymbol} onOpenHorizon={() => setActiveTab('balanceHorizon')} onOpenSavedAnnual={() => setActiveTab('savedAnnual')} onOpenMonthlyTransactions={(type) => { setNewTransactionGroup(type); setActiveTab('monthlyTransactions'); }} />}
          {activeTab === 'categorySpending' && <CategorySpending transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} currencySymbol={currencySymbol} />}
          {activeTab === 'installments' && <InstallmentManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'fixed' && <RecurringExpensesManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'salary' && <SalaryManager salaryInfo={salaryInfo} onUpdate={setSalaryInfo} currencySymbol={currencySymbol} />}
          {activeTab === 'subscriptions' && <SubscriptionCalculator subscriptions={subscriptions} setSubscriptions={setSubscriptions} baseSalary={baseSalary} currencySymbol={currencySymbol} />}
          {activeTab === 'cards' && <CardManager cards={cards} onChange={setCards} currencySymbol={currencySymbol} />}
        </div>

        {availableVersion && <div role="alert" className="fixed bottom-[8.5rem] left-1/2 z-[130] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-theme/30 bg-white p-4 shadow-xl dark:bg-dark-app-surface">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-app-text-primary dark:text-dark-app-text-primary">Nova versão disponível</p>
            <button type="button" onClick={updateApp} disabled={isDirty} className="min-h-10 shrink-0 rounded-xl bg-theme px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-app-surface-secondary disabled:text-app-text-secondary dark:disabled:bg-dark-app-surface-secondary dark:disabled:text-dark-app-text-secondary">Atualizar</button>
          </div>
          {isDirty && <p className="mt-2 text-sm text-app-text-secondary dark:text-dark-app-text-secondary">Salve as alterações pendentes para atualizar.</p>}
        </div>}

        {feedbackMessage && activeTab !== 'balanceHorizon' && <div className="fixed bottom-[5.75rem] left-1/2 z-[130] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">{feedbackMessage}</div>}

        {activeTab !== 'balanceHorizon' && activeTab !== 'dayTransactions' && activeTab !== 'savedAnnual' && activeTab !== 'monthlyTransactions' && <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[431px]:absolute min-[431px]:bottom-3 min-[431px]:left-1/2 min-[431px]:right-auto min-[431px]:w-[calc(100%_-_1.5rem)] min-[431px]:max-w-md min-[431px]:-translate-x-1/2 min-[431px]:px-0 min-[431px]:pb-[max(0.25rem,env(safe-area-inset-bottom))] pointer-events-none">
          <div className="mx-auto grid max-w-md min-[431px]:w-full grid-cols-5 gap-1 rounded-full border border-slate-200/80 dark:border-dark-app-border/80 bg-slate-100/95 dark:bg-dark-app-surface-secondary/95 backdrop-blur-lg px-1.5 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.18)] pointer-events-auto">
            <button onClick={() => { setActiveTab('dailyBalance'); setIsMobileMenuOpen(false); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-xs font-bold transition-colors ${activeTab === 'dailyBalance' ? 'bg-theme/15 text-theme' : 'text-slate-500 dark:text-dark-app-text-secondary'}`}>
              <History size={20} />
              <span>saldos</span>
            </button>
            <button onClick={() => setActiveTab('totals')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-xs font-bold ${activeTab === 'totals' ? 'bg-theme/15 text-theme' : 'text-slate-700 dark:text-dark-app-text-primary'}`}>
              <Calculator size={20} />
              <span>totais</span>
            </button>
            <button onClick={() => openNewTransaction()} aria-label="Adicionar lançamento" className="flex h-14 w-14 place-self-center items-center justify-center self-center rounded-full bg-slate-950 text-white shadow-lg dark:bg-slate-100 dark:text-[#1E293B]">
              <Plus size={30} />
            </button>
            <button onClick={() => setActiveTab('tags')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-xs font-bold ${activeTab === 'tags' ? 'bg-theme/15 text-theme' : 'text-slate-700 dark:text-dark-app-text-primary'}`}>
              <Tags size={20} />
              <span>tags</span>
            </button>
            <button onClick={() => setActiveTab('menu')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-xs font-bold transition-colors ${activeTab === 'menu' ? 'bg-theme/15 text-theme' : 'text-slate-500 dark:text-dark-app-text-secondary'}`}>
              <Menu size={22} />
              <span>menu</span>
            </button>
          </div>
        </nav>}

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-dark-app-surface-secondary rounded-[2rem] shadow-2xl w-full max-w-md p-6 my-8 animate-in zoom-in duration-200 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 dark:text-dark-app-text-primary text-2xl flex items-center gap-3"><Settings className="text-theme" size={26} /> Configurações</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tema</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-dark-app-surface p-1 rounded-2xl">
                    <button 
                      onClick={() => setSettings({...settings, theme: 'light'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white dark:bg-dark-app-surface-secondary text-slate-800 dark:text-dark-app-text-primary shadow-sm' : 'text-slate-400'}`}
                    >
                      <Sun size={16} /> Claro
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, theme: 'dark'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-white dark:bg-dark-app-surface-secondary text-slate-800 dark:text-dark-app-text-primary shadow-sm' : 'text-slate-400'}`}
                    >
                      <Moon size={16} /> Escuro
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-dark-app-surface-secondary"></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-2">Moeda</label>
                    <div className="relative flex items-center border-b border-slate-200 dark:border-dark-app-border">
                      <Coins size={22} className="shrink-0 text-slate-500 dark:text-dark-app-text-secondary" />
                      <select
                        value={settings.currency}
                        onChange={e => setSettings({...settings, currency: e.target.value as CurrencyCode})}
                        className="w-full appearance-none bg-transparent px-3 py-3 pr-10 outline-none text-base font-bold text-slate-700 dark:text-dark-app-text-secondary"
                      >
                        {Object.entries(CURRENCIES).map(([code, info]) => (
                          <option key={code} value={code}>{info.name} ({info.symbol})</option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="pointer-events-none absolute right-1 text-slate-500 dark:text-dark-app-text-secondary" />
                    </div>
                  </div>
                  
                </div>

                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-[#1E293B] font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-colors">Salvar Alterações</button>
              </div>
            </div>
          </div>
        )}

        {isBalanceSummaryOpen && (() => {
          const rows = [
            { group: FinancialGroup.PERSONAL_INCOME, label: 'Entrada', color: 'text-emerald-600', sign: 1 },
            { group: FinancialGroup.PERSONAL_EXPENSE, label: 'Saída', color: 'text-rose-600', sign: -1 },
            { group: FinancialGroup.SAVINGS, label: 'Economia', color: 'text-lime-600', sign: -1 },
          ];
          return <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"><div className="w-full max-w-md bg-white dark:bg-dark-app-surface rounded-3xl shadow-2xl overflow-hidden"><div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-dark-app-border"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Resumo do saldo</p><h3 className="text-2xl font-bold dark:text-dark-app-text-primary">{currencySymbol} {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div><button onClick={() => setIsBalanceSummaryOpen(false)} className="p-2 text-slate-500"><X size={22} /></button></div>{rows.map(row => { const total = transactions.filter(t => getFinancialGroup(t) === row.group).reduce((sum, t) => sum + t.amount, 0); return <div key={row.group} className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-dark-app-border"><span className={`text-lg font-bold ${row.color}`}>{row.label}</span><span className="text-lg font-bold text-slate-700 dark:text-dark-app-text-secondary">{row.sign < 0 ? '-' : '+'} {currencySymbol} {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>; })}<button onClick={() => setIsBalanceSummaryOpen(false)} className="m-5 w-[calc(100%-2.5rem)] bg-theme text-white font-bold py-3 rounded-2xl">Fechar</button></div></div>;
        })()}

        {isProfileOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-app-surface rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 transition-colors duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <input 
                  type="text" 
                  value={settings.userName} 
                  onChange={e => setSettings({...settings, userName: e.target.value})}
                  className="text-2xl font-bold text-slate-800 dark:text-dark-app-text-primary text-center bg-transparent border-b-2 border-transparent focus:border-theme outline-none"
                />
                <button onClick={() => setIsProfileOpen(false)} className="w-full bg-theme text-white font-bold py-3 rounded-xl hover:bg-theme-dark">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {isDeleteDataModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="data-delete-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-dark-app-surface">
              <h3 id="data-delete-title" className="text-2xl font-bold text-slate-900 dark:text-dark-app-text-primary">Tem certeza que deseja excluir?</h3>
              <p className="mt-3 text-base text-slate-600 dark:text-dark-app-text-secondary">Essa ação não pode ser desfeita.</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setIsDeleteDataModalOpen(false)} className="min-h-12 flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary">Cancelar</button>
                <button type="button" onClick={clearImportedData} className="min-h-12 flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700">Excluir</button>
              </div>
            </div>
          </div>
        )}

        {pendingRecurringDelete && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="recurring-delete-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-dark-app-surface">
              <h3 id="recurring-delete-title" className="text-xl font-bold text-slate-900 dark:text-dark-app-text-primary">Tem certeza de que deseja excluir esse lançamento? Ele é recorrente.</h3>
              <div className="mt-6 grid gap-3">
                <button type="button" onClick={() => confirmRecurringDelete('one')} className="min-h-12 rounded-2xl bg-rose-600 px-4 py-3 text-center font-normal text-white hover:bg-rose-700">Excluir apenas este lançamento</button>
                <button type="button" onClick={() => confirmRecurringDelete('future')} className="min-h-12 rounded-2xl bg-rose-600 px-4 py-3 text-center font-normal text-white hover:bg-rose-700">Excluir todos os lançamentos futuros</button>
                <button type="button" onClick={() => setPendingRecurringDelete(null)} className="min-h-12 rounded-2xl bg-slate-100 px-4 py-3 font-normal text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {(isFormOpen || editingTransaction) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white dark:bg-dark-app-surface">
            <div className="h-full min-h-screen w-full overflow-hidden bg-white dark:bg-dark-app-surface flex flex-col animate-in fade-in duration-200">
              <div className="h-full overflow-y-auto py-8">
                <TransactionForm onAdd={editingTransaction ? (ts) => updateTransaction(ts[0]!) : addTransactions} onClose={() => {setIsFormOpen(false); setEditingTransaction(null); setNewTransactionDate(undefined); setNewTransactionGroup(undefined)}} onDelete={deleteTransaction} initialData={editingTransaction} initialDate={newTransactionDate} initialFinancialGroup={newTransactionGroup === FinancialGroup.PERSONAL_INCOME || newTransactionGroup === FinancialGroup.REIMBURSEMENT ? 'INCOME' : newTransactionGroup === FinancialGroup.SAVINGS ? 'SAVINGS' : newTransactionGroup === FinancialGroup.PERSONAL_EXPENSE || newTransactionGroup === FinancialGroup.ADVANCE_TO_OTHERS ? 'EXPENSE' : newTransactionGroup} currencySymbol={currencySymbol} cards={cards} availableTags={availableTags} />
              </div>
            </div>
          </div>
        )}

        
        {isAdjustmentOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-app-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-dark-app-text-primary text-lg flex items-center gap-2"><Wallet className="text-theme" /> Ajustar Saldo</h3>
                <button onClick={() => setIsAdjustmentOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-dark-app-text-secondary"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1">Novo Saldo Total ({currencySymbol})</label>
                <input type="number" step="0.01" defaultValue={totalBalance} onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdjustment(parseFloat((e.target as HTMLInputElement).value) || 0); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-xl focus:ring-2 focus:ring-theme outline-none text-2xl font-bold dark:text-dark-app-text-primary" />
                <button onClick={(e) => { const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement); handleManualAdjustment(parseFloat(input.value) || 0); }} className="w-full bg-theme text-white font-bold py-3 rounded-xl hover:bg-theme-dark transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
