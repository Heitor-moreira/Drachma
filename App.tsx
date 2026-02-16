
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  History,
  Settings,
  X,
  Wallet,
  Coins,
  Landmark,
  FileSpreadsheet,
  CalendarClock,
  Layers,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  Camera,
  Sun,
  Moon,
  Zap,
  Monitor,
  Repeat,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Transaction, TransactionType, Category, Subscription, InitialBalance, SalaryInfo, DateRange, UserSettings, CurrencyCode } from './types';
import Dashboard from './components/Dashboard';
import CategorySpending from './components/CategorySpending';
import TransactionForm from './components/TransactionForm';
import SubscriptionCalculator from './components/SubscriptionCalculator';
import AiInsights from './components/AiInsights';
import DailyBalanceView from './components/DailyBalanceView';
import SalaryManager from './components/SalaryManager';
import TemplateImport from './components/TemplateImport';
import InstallmentManager from './components/InstallmentManager';
import RecurringExpensesManager from './components/RecurringExpensesManager';

const STORAGE_KEY_TRANSACTIONS = 'finanflow_transactions';
const STORAGE_KEY_SUBSCRIPTIONS = 'finanflow_subscriptions';
const STORAGE_KEY_INITIAL_BALANCE = 'finanflow_initial_balance';
const STORAGE_KEY_SALARY_INFO = 'finanflow_salary_info';
const STORAGE_KEY_DATE_RANGE = 'finanflow_global_date_range';
const STORAGE_KEY_SETTINGS = 'finanflow_user_settings';

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
  type TabType = 'dashboard' | 'dailyBalance' | 'categorySpending' | 'installments' | 'fixed' | 'salary' | 'subscriptions';
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isInitialFlashActive, setIsInitialFlashActive] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo>({ gross: 0, discounts: [] });
  const [initialBalance, setInitialBalance] = useState<InitialBalance>({ amount: 0, date: formatLocalYYYYMMDD(new Date()) });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : {
      currency: 'BRL',
      aiEnabled: true,
      userName: 'Usuário FinanFlow',
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
    if (settings.appMode === 'lite' && !['dashboard', 'dailyBalance'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [settings.appMode, activeTab]);

  useEffect(() => {
    const savedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const savedSubscriptions = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    const savedInitial = localStorage.getItem(STORAGE_KEY_INITIAL_BALANCE);
    const savedSalaryInfo = localStorage.getItem(STORAGE_KEY_SALARY_INFO);

    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
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
  }, [subscriptions, initialBalance, salaryInfo, dateRange, settings]);

  const currencySymbol = CURRENCIES[settings.currency].symbol;

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
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
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

  const tabLabels: Record<TabType, string> = {
    dashboard: 'Visão Geral',
    dailyBalance: 'Extrato Diário',
    categorySpending: 'Gastos por Categoria',
    installments: 'Compras Parceladas',
    fixed: 'Compras Recorrentes',
    salary: 'Gestão de Salário',
    subscriptions: 'Assinaturas'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-slate-100 overflow-hidden h-screen bg-slate-50 dark:bg-[#14171f] transition-colors duration-300 relative">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 shrink-0 h-full transition-colors duration-300">
        <button 
          onClick={() => { setActiveTab('dashboard'); setIsReportsOpen(false); }}
          className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity text-left"
        >
          <div className="bg-theme p-2 rounded-xl text-white shadow-sm"><TrendingUp size={24} /></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">FinanFlow</h1>
        </button>

        <div className="mb-6">
          <button onClick={() => setIsAdjustmentOpen(true)} className="w-full bg-slate-900 dark:bg-slate-800 text-white rounded-3xl p-5 shadow-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all group relative overflow-hidden">
            <div className="relative z-10 text-left">
              <p className="text-[10px] font-black text-theme uppercase tracking-[0.2em] mb-1">Saldo Total</p>
              <h3 className="text-xl font-black">{currencySymbol} {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <Wallet size={60} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
          <button onClick={() => { setActiveTab('dashboard'); setIsReportsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-theme/20 text-slate-700 dark:text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Visão geral</button>
          
          {isLite ? (
            <button onClick={() => { setActiveTab('dailyBalance'); setIsReportsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'dailyBalance' ? 'bg-theme/20 text-slate-700 dark:text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><History size={18} /> Extrato Diário</button>
          ) : (
            <>
              <div className="py-2">
                <button 
                  onClick={() => setIsReportsOpen(!isReportsOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 ${isReportsOpen ? 'text-slate-800 dark:text-slate-100 font-medium' : ''}`}
                >
                  <div className="flex items-center gap-3"><Layers size={18} /> Relatórios</div>
                  {isReportsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isReportsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-2 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={() => setActiveTab('dailyBalance')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'dailyBalance' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><History size={16} /> Extrato Diário</button>
                    <button onClick={() => setActiveTab('categorySpending')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'categorySpending' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Layers size={16} /> Gastos por Categoria</button>
                    <button onClick={() => setActiveTab('installments')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'installments' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CalendarClock size={16} /> Compras Parceladas</button>
                    <button onClick={() => setActiveTab('fixed')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all ${activeTab === 'fixed' ? 'bg-theme/10 text-slate-700 dark:text-theme font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Repeat size={16} /> Compras Recorrentes</button>
                  </div>
                )}
              </div>

              <button onClick={() => { setActiveTab('subscriptions'); setIsReportsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'subscriptions' ? 'bg-theme/20 text-slate-700 dark:text-theme font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CreditCard size={18} /> Assinaturas</button>
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl flex-1 transition-all overflow-hidden"
          >
            <img src={settings.userPhoto} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-theme" alt="Profile" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{settings.userName}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isLite ? 'Lite User' : 'Pro Plan'}</p>
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
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 left-4 right-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Navegação</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><LayoutDashboard size={18} /> Dashboard</button>
                <button onClick={() => { setActiveTab('dailyBalance'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dailyBalance' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><History size={18} /> Extrato Diário</button>
                {!isLite && (
                  <>
                    <button onClick={() => { setActiveTab('categorySpending'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'categorySpending' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><Layers size={18} /> Gastos por Categoria</button>
                    <button onClick={() => { setActiveTab('installments'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'installments' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><CalendarClock size={18} /> Compras Parceladas</button>
                    <button onClick={() => { setActiveTab('fixed'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'fixed' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><Repeat size={18} /> Compras Recorrentes</button>
                    <button onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-theme text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><CreditCard size={18} /> Assinaturas</button>
                  </>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><Settings size={18} /> Configurações</button>
              </div>
            </div>
          </div>
        )}

        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 h-16 transition-colors duration-300">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            {/* Mobile Menu Trigger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Menu size={20} />
            </button>
            
            <h2 className="text-sm md:text-lg font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">
              {tabLabels[activeTab]}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="p-2 md:px-4 md:py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap"
              title="Importar Planilha"
            >
              <FileSpreadsheet size={18} className="text-emerald-600 shrink-0" /> 
              <span className="hidden lg:inline">Planilha</span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setIsFormOpen(true)} 
                className="bg-theme hover:bg-theme-dark text-white p-2 md:px-5 md:py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md active:scale-95"
                title="Novo Lançamento"
              >
                <PlusCircle size={18} />
                <span className="hidden sm:inline whitespace-nowrap">Novo Lançamento</span>
              </button>
              
              {settings.aiEnabled && (
                <button 
                  onClick={() => setIsAiOpen(!isAiOpen)}
                  className={`p-2 rounded-xl transition-all flex items-center justify-center relative active:scale-95 ai-hover-blink
                    ${isAiOpen ? 'ai-active-glow bg-slate-900 dark:bg-slate-800 text-theme' : (isInitialFlashActive ? 'bg-slate-900 dark:bg-slate-800 text-slate-100' : 'bg-theme-dark text-white')}
                    ${isInitialFlashActive ? 'ai-initial-flash' : ''}
                  `}
                  title="Consultoria de IA"
                >
                  <BrainCircuit size={20} className={isAiOpen ? 'animate-pulse' : ''} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} baseSalary={baseSalary} currencySymbol={currencySymbol} />}
          {activeTab === 'dailyBalance' && <DailyBalanceView transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'categorySpending' && <CategorySpending transactions={transactions} dateRange={dateRange} setDateRange={setDateRange} currencySymbol={currencySymbol} />}
          {activeTab === 'installments' && <InstallmentManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'fixed' && <RecurringExpensesManager transactions={transactions} baseSalary={baseSalary} onEdit={setEditingTransaction} onDelete={deleteTransaction} currencySymbol={currencySymbol} />}
          {activeTab === 'salary' && <SalaryManager salaryInfo={salaryInfo} onUpdate={setSalaryInfo} currencySymbol={currencySymbol} />}
          {activeTab === 'subscriptions' && <SubscriptionCalculator subscriptions={subscriptions} setSubscriptions={setSubscriptions} baseSalary={baseSalary} currencySymbol={currencySymbol} />}
        </div>

        {settings.aiEnabled && (
          <AiInsights isOpen={isAiOpen} transactions={transactions} salaryInfo={salaryInfo} onClose={() => setIsAiOpen(false)} />
        )}

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 my-8 animate-in zoom-in duration-200 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2"><Settings className="text-theme" /> Configurações</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                {!isLite && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gestão Financeira</label>
                    <button 
                      onClick={() => { setActiveTab('salary'); setIsSettingsOpen(false); }}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-theme dark:hover:border-theme transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-theme/20 text-theme dark:text-theme rounded-lg group-hover:bg-theme group-hover:text-white transition-colors">
                          <Coins size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Configurar Salário</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Ganhos e Descontos</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Personalização</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl">
                    <button 
                      onClick={() => setSettings({...settings, theme: 'light'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                    >
                      <Sun size={16} /> Tema Claro
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, theme: 'dark'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                    >
                      <Moon size={16} /> Tema Escuro
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modo de Visualização</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl">
                    <button 
                      onClick={() => setSettings({...settings, appMode: 'lite'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.appMode === 'lite' ? 'bg-theme/20 text-theme dark:text-theme' : 'text-slate-400'}`}
                    >
                      <Zap size={16} /> Modo Lite
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, appMode: 'pro'})}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${settings.appMode === 'pro' ? 'bg-theme/20 text-theme dark:text-theme' : 'text-slate-400'}`}
                    >
                      <Monitor size={16} /> Modo Pro
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Moeda Principal</label>
                    <select 
                      value={settings.currency} 
                      onChange={e => setSettings({...settings, currency: e.target.value as CurrencyCode})}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold dark:text-slate-200"
                    >
                      {Object.entries(CURRENCIES).map(([code, info]) => (
                        <option key={code} value={code}>{info.name} ({info.symbol})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Consultoria de IA</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Habilitar recursos Gemini 3</p>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, aiEnabled: !settings.aiEnabled})}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.aiEnabled ? 'bg-theme' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.aiEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-colors">Salvar Alterações</button>
              </div>
            </div>
          </div>
        )}

        {isProfileOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 transition-colors duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group cursor-pointer" onClick={() => {
                   const newUrl = prompt("URL da Foto:");
                   if (newUrl) setSettings({...settings, userPhoto: newUrl});
                }}>
                  <img src={settings.userPhoto} className="w-24 h-24 rounded-full object-cover border-4 border-theme shadow-xl" alt="Profile" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity"><Camera className="text-white" /></div>
                </div>
                <input 
                  type="text" 
                  value={settings.userName} 
                  onChange={e => setSettings({...settings, userName: e.target.value})}
                  className="text-xl font-black text-slate-800 dark:text-white text-center bg-transparent border-b-2 border-transparent focus:border-theme outline-none"
                />
                <button onClick={() => setIsProfileOpen(false)} className="w-full bg-theme text-white font-bold py-3 rounded-xl hover:bg-theme-dark">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {(isFormOpen || editingTransaction) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-theme/10 dark:bg-theme/5">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                <button onClick={() => {setIsFormOpen(false); setEditingTransaction(null)}} className="dark:text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <TransactionForm onAdd={editingTransaction ? (ts) => updateTransaction(ts[0]) : addTransactions} onClose={() => {setIsFormOpen(false); setEditingTransaction(null)}} initialData={editingTransaction} currencySymbol={currencySymbol} />
              </div>
            </div>
          </div>
        )}

        {isImportOpen && <TemplateImport onImport={addTransactions} onClose={() => setIsImportOpen(false)} />}
        
        {isAdjustmentOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2"><Wallet className="text-theme" /> Ajustar Saldo</h3>
                <button onClick={() => setIsAdjustmentOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Novo Saldo Total ({currencySymbol})</label>
                <input type="number" step="0.01" defaultValue={totalBalance} onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdjustment(parseFloat((e.target as HTMLInputElement).value) || 0); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-theme outline-none text-xl font-bold dark:text-white" />
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
