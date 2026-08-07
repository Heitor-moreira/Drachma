
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
  , XCircle
  , CalendarDays
  , ChartNoAxesCombined
} from 'lucide-react';
import { Transaction, TransactionType, Category, Subscription, InitialBalance, SalaryInfo, DateRange, UserSettings, CurrencyCode, CreditCard as CreditCardModel, FinancialGroup } from './types';
import { getFinancialGroup } from './finance';
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
import DayTransactionsView from './components/DayTransactionsView';

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const App: React.FC = () => {
  type TabType = 'dailyBalance' | 'balanceHorizon' | 'totals' | 'categorySpending' | 'installments' | 'fixed' | 'salary' | 'subscriptions' | 'cards' | 'menu';
  const [activeTab, setActiveTab] = useState<TabType | 'dayTransactions'>('dailyBalance');
  const [selectedDay, setSelectedDay] = useState(formatLocalYYYYMMDD(new Date()));
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isInitialFlashActive, setIsInitialFlashActive] = useState(true);
  const [isBalanceSummaryOpen, setIsBalanceSummaryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo>({ gross: 0, discounts: [] });
  const [cards, setCards] = useState<CreditCardModel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    return saved ? JSON.parse(saved) : [];
  });
  const [initialBalance, setInitialBalance] = useState<InitialBalance>({ amount: 0, date: formatLocalYYYYMMDD(new Date()) });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : {
      currency: 'BRL',
      aiEnabled: true,
      userName: 'Usuário Drachma',
      userPhoto: 'https://ui-avatars.com/api/?name=User&background=2687c5&color=ffffff',
      theme: 'light',
      appMode: 'pro'
    };
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATE_RANGE);
    if (saved) return JSON.parse(saved);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatLocalYYYYMMDD(start), end: formatLocalYYYYMMDD(now) };
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTransactionDate, setNewTransactionDate] = useState<string | undefined>();
  const [newTransactionGroup, setNewTransactionGroup] = useState<FinancialGroup | undefined>(undefined);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
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
    if (settings.appMode === 'lite' && !['dailyBalance', 'balanceHorizon', 'dayTransactions', 'menu', 'subscriptions', 'cards'].includes(activeTab)) {
      setActiveTab('dailyBalance');
    }
  }, [settings.appMode, activeTab]);

  useEffect(() => {
    const savedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const savedSubscriptions = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    const savedInitial = localStorage.getItem(STORAGE_KEY_INITIAL_BALANCE);
    const savedSalaryInfo = localStorage.getItem(STORAGE_KEY_SALARY_INFO);

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedSubscriptions) setSubscriptions(JSON.parse(savedSubscriptions));
    if (savedInitial) setInitialBalance(JSON.parse(savedInitial));
    if (savedSalaryInfo) setSalaryInfo(JSON.parse(savedSalaryInfo));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subscriptions));
    localStorage.setItem(STORAGE_KEY_INITIAL_BALANCE, JSON.stringify(initialBalance));
    localStorage.setItem(STORAGE_KEY_SALARY_INFO, JSON.stringify(salaryInfo));
    localStorage.setItem(STORAGE_KEY_DATE_RANGE, JSON.stringify(dateRange));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  }, [subscriptions, initialBalance, salaryInfo, dateRange, settings, cards]);

  const currencySymbol = CURRENCIES[settings.currency].symbol;

  const availableTags = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.tags || []))).sort((a, b) => a.localeCompare(b)), [transactions]);

  const exportAppData = () => {
    const backup = { version: 1, exportedAt: new Date().toISOString(), transactions, subscriptions, initialBalance, salaryInfo, dateRange, settings, cards };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `drachma-backup-${formatLocalYYYYMMDD(new Date())}.json`; link.click(); URL.revokeObjectURL(url);
  };
  const importAppData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try {
      const data = JSON.parse(String(reader.result)); if (!Array.isArray(data.transactions)) throw new Error('Arquivo inválido');
      setTransactions(data.transactions); if (Array.isArray(data.subscriptions)) setSubscriptions(data.subscriptions); if (data.initialBalance) setInitialBalance(data.initialBalance); if (data.salaryInfo) setSalaryInfo(data.salaryInfo); if (data.dateRange) setDateRange(data.dateRange); if (data.settings) setSettings(data.settings); if (Array.isArray(data.cards)) setCards(data.cards);
      setFeedbackMessage('Dados importados com sucesso!');
    } catch { setFeedbackMessage('Arquivo JSON inválido.'); } event.target.value = ''; window.setTimeout(() => setFeedbackMessage(''), 2400); };
    reader.readAsText(file);
  };
  const clearImportedData = () => {
    if (!window.confirm('Excluir os dados carregados e todos os lançamentos salvos?')) return;
    setTransactions([]); setSubscriptions([]); setInitialBalance({ amount: 0, date: formatLocalYYYYMMDD(new Date()) }); setSalaryInfo({ gross: 0, discounts: [] }); setCards([]);
    [STORAGE_KEY_TRANSACTIONS, STORAGE_KEY_SUBSCRIPTIONS, STORAGE_KEY_INITIAL_BALANCE, STORAGE_KEY_SALARY_INFO, STORAGE_KEY_DATE_RANGE, STORAGE_KEY_SETTINGS, STORAGE_KEY_CARDS].forEach(key => localStorage.removeItem(key));
    setFeedbackMessage('Dados excluídos.'); window.setTimeout(() => setFeedbackMessage(''), 2400);
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
    setTransactions(prev => [...newTs, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFeedbackMessage('Movimentação adicionada!');
    window.setTimeout(() => setFeedbackMessage(''), 2400);
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const openNewTransaction = (group?: FinancialGroup, date?: string) => {
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
      return t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount;
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
      type: diff > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      category: Category.ADJUSTMENT,
      date: formatLocalYYYYMMDD(new Date()),
      comment: `Saldo ajustado para ${currencySymbol} ${newTotal.toLocaleString()}`
    };
    addTransactions([adjustment]);
    setIsAdjustmentOpen(false);
  };

  const isLite = settings.appMode === 'lite';
  const developerViewport = settings.developerViewport || 'notebook';
  const developerViewportClass = settings.appMode === 'developer' ? {
    'notebook': '',
    'iphone-16e': 'max-w-[390px] mx-auto w-full',
    'galaxy-a73': 'max-w-[412px] mx-auto w-full',
    'ipad-11': 'max-w-[834px] mx-auto w-full'
  }[developerViewport] : '';

  const tabLabels: Record<TabType, string> = {
    dailyBalance: 'Extrato Diário',
    balanceHorizon: 'Horizonte de Saldos',
    categorySpending: 'Gastos por Categoria',
    installments: 'Compras Parceladas',
    fixed: 'Compras Recorrentes',
    salary: 'Gestão de Salário',
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
          
          {!isLite && (
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
          )}
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isLite ? 'Lite User' : 'Pro Plan'}</p>
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

      <main className={`flex-1 flex flex-col overflow-hidden relative ${developerViewportClass}`}>
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
                {!isLite && (
                  <>
                    <button onClick={() => { setActiveTab('categorySpending'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'categorySpending' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Layers size={18} /> Gastos por Categoria</button>
                    <button onClick={() => { setActiveTab('installments'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'installments' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CalendarClock size={18} /> Compras Parceladas</button>
                    <button onClick={() => { setActiveTab('fixed'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'fixed' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Repeat size={18} /> Compras Recorrentes</button>
                    <button onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CreditCard size={18} /> Assinaturas</button>
                    <button onClick={() => { setActiveTab('salary'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'salary' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><Coins size={18} /> Gestão de Salário</button>
                    <button onClick={() => { setActiveTab('cards'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary'}`}><CreditCard size={18} /> Cartões</button>
                  </>
                )}
                <div className="h-px bg-slate-100 dark:bg-dark-app-surface-secondary my-2"></div>
                <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold bg-slate-50 dark:bg-dark-app-surface-secondary text-slate-600 dark:text-dark-app-text-secondary"><Settings size={18} /> Configurações</button>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 ${activeTab === 'dailyBalance' || activeTab === 'balanceHorizon' || activeTab === 'dayTransactions' || activeTab === 'totals' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 pb-28 md:p-8'} space-y-6`}>
          {activeTab === 'menu' && (
            <section className="space-y-5">
              <div className="border-b border-slate-200 pb-6 dark:border-dark-app-border"><h2 className="text-3xl font-bold text-slate-900 dark:text-dark-app-text-primary">{settings.userName}</h2><p className="mt-1 text-sm text-slate-500 dark:text-dark-app-text-secondary">Drachma — Finanças descomplicadas</p><span className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime-200 px-3 py-1.5 text-sm font-bold text-lime-900"><span>✓</span> Assinatura ativa</span></div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-dark-app-border dark:bg-dark-app-surface-secondary">
                <button onClick={() => setIsProfileOpen(true)} className="flex w-full items-center gap-4 border-b border-slate-200 px-5 py-5 text-left text-lg font-normal text-slate-800 dark:border-dark-app-border dark:text-dark-app-text-primary"><User size={22} /> Editar perfil <ChevronRight className="ml-auto text-slate-300" size={20} /></button>
                <button onClick={() => setActiveTab('dailyBalance')} className="flex w-full items-center gap-4 border-b border-slate-200 px-5 py-5 text-left text-lg font-normal text-slate-800 dark:border-dark-app-border dark:text-dark-app-text-primary"><History size={22} /> Previsão de diário <ChevronRight className="ml-auto text-slate-300" size={20} /></button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex w-full items-center gap-4 border-b border-slate-200 px-5 py-5 text-left text-lg font-normal text-slate-800 dark:border-dark-app-border dark:text-dark-app-text-primary"><Settings size={22} /> Configurações <ChevronRight className="ml-auto text-slate-300" size={20} /></button>
                <button onClick={() => setFeedbackMessage('Sugestões poderão ser enviadas em breve.')} className="flex w-full items-center gap-4 border-b border-slate-200 px-5 py-5 text-left text-lg font-normal text-slate-800 dark:border-dark-app-border dark:text-dark-app-text-primary"><MessageSquare size={22} /> Mandar sugestões <ChevronRight className="ml-auto text-slate-300" size={20} /></button>
                <button onClick={() => setFeedbackMessage('Consulte as configurações ou o suporte do Drachma.')} className="flex w-full items-center gap-4 px-5 py-5 text-left text-lg font-normal text-slate-800 dark:text-dark-app-text-primary"><HelpCircle size={22} /> Ajuda <ChevronRight className="ml-auto text-slate-300" size={20} /></button>
              </div>
              <div className="flex items-center justify-center gap-3 pt-4">
                <button onClick={exportAppData} aria-label="Exportar dados em JSON" title="Exportar JSON" className="rounded-full bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary"><Upload size={17} /></button>
                <button onClick={() => importFileRef.current?.click()} aria-label="Importar dados JSON" title="Importar JSON" className="rounded-full bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary"><Download size={17} /></button>
                <button onClick={clearImportedData} aria-label="Excluir dados carregados" title="Excluir dados carregados" className="rounded-full bg-rose-100 p-2.5 text-rose-500 hover:bg-rose-200"><XCircle size={17} /></button>
                <input ref={importFileRef} type="file" accept="application/json,.json" onChange={importAppData} className="hidden" />
              </div>
            </section>
          )}
          {activeTab === 'dailyBalance' && <DailyBalanceView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} cards={cards} liteMode={isLite} compactHeader={settings.appMode === 'developer' && ['iphone-16e', 'galaxy-a73'].includes(developerViewport)} onDayClick={(date, group) => openNewTransaction(group, date)} onOpenHorizon={() => setActiveTab('balanceHorizon')} />}
          {activeTab === 'balanceHorizon' && <BalanceHorizonView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} initialBalance={initialBalance} cards={cards} currencySymbol={currencySymbol} onBack={() => setActiveTab('dailyBalance')} onAdd={(group, date) => openNewTransaction(group, date)} onDayClick={(date) => { setSelectedDay(date); setActiveTab('dayTransactions'); }} />}
          {activeTab === 'dayTransactions' && <DayTransactionsView date={selectedDay} transactions={transactions} cards={cards} currencySymbol={currencySymbol} liteMode={isLite} onBack={() => setActiveTab('balanceHorizon')} onAdd={(date) => openNewTransaction(undefined, date)} onEdit={setEditingTransaction} />}
          {activeTab === 'totals' && <TotalsView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} cards={cards} currencySymbol={currencySymbol} onOpenHorizon={() => setActiveTab('balanceHorizon')} />}
          {activeTab === 'categorySpending' && <CategorySpending transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} currencySymbol={currencySymbol} />}
          {activeTab === 'installments' && <InstallmentManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'fixed' && <RecurringExpensesManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'salary' && <SalaryManager salaryInfo={salaryInfo} onUpdate={setSalaryInfo} currencySymbol={currencySymbol} />}
          {activeTab === 'subscriptions' && <SubscriptionCalculator subscriptions={subscriptions} setSubscriptions={setSubscriptions} baseSalary={baseSalary} currencySymbol={currencySymbol} />}
          {activeTab === 'cards' && <CardManager cards={cards} onChange={setCards} currencySymbol={currencySymbol} />}
        </div>

        {feedbackMessage && activeTab !== 'balanceHorizon' && <div className="fixed bottom-[5.75rem] left-1/2 z-[130] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">{feedbackMessage}</div>}

        {activeTab !== 'balanceHorizon' && activeTab !== 'dayTransactions' && <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-[431px]:absolute min-[431px]:bottom-3 min-[431px]:left-1/2 min-[431px]:right-auto min-[431px]:w-[calc(100%_-_1.5rem)] min-[431px]:max-w-md min-[431px]:-translate-x-1/2 min-[431px]:px-0 min-[431px]:pb-[max(0.25rem,env(safe-area-inset-bottom))] pointer-events-none">
          <div className="mx-auto grid max-w-md min-[431px]:w-full grid-cols-5 gap-1 rounded-[2rem] border border-slate-200/80 dark:border-dark-app-border/80 bg-slate-100/95 dark:bg-dark-app-surface-secondary/95 backdrop-blur-lg px-1.5 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.18)] pointer-events-auto">
            <button onClick={() => { setActiveTab('dailyBalance'); setIsMobileMenuOpen(false); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-xs font-bold transition-colors ${activeTab === 'dailyBalance' ? 'bg-theme/15 text-theme' : 'text-slate-500 dark:text-dark-app-text-secondary'}`}>
              <History size={20} />
              <span>Saldos</span>
            </button>
            <button onClick={() => setActiveTab('totals')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-xs font-bold ${activeTab === 'totals' ? 'bg-theme/15 text-theme' : 'text-slate-700 dark:text-dark-app-text-primary'}`}>
              <Calculator size={20} />
              <span>Totais</span>
            </button>
            <button onClick={() => openNewTransaction()} aria-label="Adicionar lançamento" className="flex h-14 w-14 place-self-center items-center justify-center self-center rounded-full bg-slate-950 text-white shadow-lg dark:bg-slate-100 dark:text-[#1E293B]">
              <Plus size={30} />
            </button>
            <button onClick={() => setActiveTab('menu')} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-xs font-bold text-slate-700 dark:text-dark-app-text-primary">
              <Tags size={20} />
              <span>Tags</span>
            </button>
            <button onClick={() => setActiveTab('menu')} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-xs font-bold transition-colors ${activeTab === 'menu' ? 'bg-theme/15 text-theme' : 'text-slate-500 dark:text-dark-app-text-secondary'}`}>
              <Menu size={22} />
              <span>Menu</span>
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

        {(isFormOpen || editingTransaction) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white dark:bg-dark-app-surface">
            <div className="h-full min-h-screen w-full overflow-hidden bg-white dark:bg-dark-app-surface flex flex-col animate-in fade-in duration-200">
              <div className="h-full overflow-y-auto p-6 md:px-12 md:py-8">
                <TransactionForm onAdd={editingTransaction ? (ts) => updateTransaction(ts[0]!) : addTransactions} onClose={() => {setIsFormOpen(false); setEditingTransaction(null); setNewTransactionDate(undefined); setNewTransactionGroup(undefined)}} initialData={editingTransaction} initialDate={newTransactionDate} initialFinancialGroup={newTransactionGroup} currencySymbol={currencySymbol} cards={cards} availableTags={availableTags} liteMode={isLite} />
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
