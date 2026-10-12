import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Pause,
  Play,
  CreditCard as CardIcon,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Coins,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { CreditCard, SalaryInfo, Subscription, SubscriptionCycle, SubscriptionPaymentType, SubscriptionStatus, Transaction } from '../types';
import { getSubscriptionMetrics, normalizeSubscription } from '../utils/subscriptionTransactions';
import { searchCatalog, SUBSCRIPTION_CATALOG, SubscriptionCatalogItem } from '../constants/subscriptionCatalog';
import { formatLocalDate } from '../utils/finance';

interface Props {
  subscriptions?: Subscription[];
  setSubscriptions?: React.Dispatch<React.SetStateAction<Subscription[]>>;
  cards?: CreditCard[];
  salaryInfo?: SalaryInfo;
  baseSalary?: number;
  currencySymbol?: string;
  onBack?: () => void;
  // Compatibilidade com telas legadas / extrato
  transactions?: Transaction[];
  onEdit?: (transaction: Transaction) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SubscriptionsView: React.FC<Props> = ({
  subscriptions: propSubscriptions = [],
  setSubscriptions: propSetSubscriptions,
  cards = [],
  salaryInfo,
  baseSalary = 0,
  currencySymbol = 'R$',
  onBack,
  transactions = [],
  onEdit
}) => {
  // Local state fallback if setSubscriptions is not provided
  const [internalSubscriptions, setInternalSubscriptions] = useState<Subscription[]>(propSubscriptions);
  const subscriptions = propSetSubscriptions ? propSubscriptions : internalSubscriptions;
  const updateSubscriptions = (updater: (prev: Subscription[]) => Subscription[]) => {
    if (propSetSubscriptions) {
      propSetSubscriptions(updater);
    } else {
      setInternalSubscriptions(updater);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    return getSubscriptionMetrics(subscriptions, salaryInfo, baseSalary);
  }, [subscriptions, salaryInfo, baseSalary]);

  // Sorting: Active subscriptions sorted by dueDay ascending, then paused/canceled
  const sortedSubscriptions = useMemo(() => {
    const active = subscriptions
      .filter(s => s.status === 'ACTIVE' && !s.deletedAt)
      .sort((a, b) => a.dueDay - b.dueDay);
    const inactive = subscriptions
      .filter(s => s.status !== 'ACTIVE' && !s.deletedAt)
      .sort((a, b) => a.dueDay - b.dueDay);
    return { active, inactive };
  }, [subscriptions]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<Subscription | null>(null);
  const [showInactiveSection, setShowInactiveSection] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDay, setFormDueDay] = useState('10');
  const [formCycle, setFormCycle] = useState<SubscriptionCycle>('MONTHLY');
  const [formBillingMonth, setFormBillingMonth] = useState('1');
  const [formPaymentType, setFormPaymentType] = useState<SubscriptionPaymentType>('DIRECT_DEBIT');
  const [formCardId, setFormCardId] = useState<string>('');
  const [formCategory, setFormCategory] = useState('');
  const [formServiceKey, setFormServiceKey] = useState<string | undefined>();
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [formError, setFormError] = useState('');

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<SubscriptionCatalogItem[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (val: string) => {
    setFormName(val);
    setFormError('');
    if (val.trim().length >= 2) {
      const results = searchCatalog(val.trim());
      setSuggestions(results);
      setIsAutocompleteOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsAutocompleteOpen(false);
    }
  };

  const handleSelectSuggestion = (item: SubscriptionCatalogItem) => {
    setFormName(item.name);
    setFormServiceKey(item.key);
    if (item.category) setFormCategory(item.category);
    if (item.defaultCycle) setFormCycle(item.defaultCycle);
    if (item.defaultDueDay) setFormDueDay(String(item.defaultDueDay));
    setIsAutocompleteOpen(false);
  };

  const openCreateModal = () => {
    setEditingSub(null);
    setFormName('');
    setFormAmount('');
    setFormDueDay('10');
    setFormCycle('MONTHLY');
    setFormBillingMonth('1');
    setFormPaymentType('DIRECT_DEBIT');
    const firstActiveCreditCard = cards.find(c => c.isActive && c.type === 'CREDIT');
    setFormCardId(firstActiveCreditCard ? firstActiveCreditCard.id : (cards[0]?.id || ''));
    setFormCategory('');
    setFormServiceKey(undefined);
    setFormStatus('ACTIVE');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setFormName(sub.name);
    setFormAmount(String(sub.amount));
    setFormDueDay(String(sub.dueDay));
    setFormCycle(sub.cycle);
    setFormBillingMonth(String(sub.billingMonth ?? 1));
    setFormPaymentType(sub.paymentType);
    setFormCardId(sub.cardId || (cards[0]?.id || ''));
    setFormCategory(sub.category || '');
    setFormServiceKey(sub.serviceKey);
    setFormStatus(sub.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Informe o nome da assinatura.');
      return;
    }

    const parsedAmount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }

    const parsedDay = parseInt(formDueDay, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setFormError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    if (formPaymentType === 'CREDIT_CARD' && !formCardId) {
      setFormError('Selecione o cartão de crédito vinculado.');
      return;
    }

    const nowIso = new Date().toISOString();
    const todayStr = formatLocalDate(new Date());

    if (editingSub) {
      // Edit existing
      updateSubscriptions(prev =>
        prev.map(item => {
          if (item.id !== editingSub.id) return item;
          return normalizeSubscription({
            ...item,
            name: trimmedName,
            amount: parsedAmount,
            dueDay: parsedDay,
            cycle: formCycle,
            billingMonth: formCycle === 'YEARLY' ? parseInt(formBillingMonth, 10) : undefined,
            paymentType: formPaymentType,
            cardId: formPaymentType === 'CREDIT_CARD' ? formCardId : undefined,
            status: formStatus,
            isActive: formStatus === 'ACTIVE',
            serviceKey: formServiceKey,
            category: formCategory.trim() || undefined,
            updatedAt: nowIso
          });
        })
      );
    } else {
      // Create new
      const newSub: Subscription = normalizeSubscription({
        id: Math.random().toString(36).substring(2, 9),
        name: trimmedName,
        amount: parsedAmount,
        dueDay: parsedDay,
        cycle: formCycle,
        billingMonth: formCycle === 'YEARLY' ? parseInt(formBillingMonth, 10) : undefined,
        paymentType: formPaymentType,
        cardId: formPaymentType === 'CREDIT_CARD' ? formCardId : undefined,
        status: 'ACTIVE',
        isActive: true,
        serviceKey: formServiceKey,
        category: formCategory.trim() || undefined,
        startDate: todayStr,
        createdAt: nowIso,
        updatedAt: nowIso
      });

      updateSubscriptions(prev => [...prev, newSub]);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (sub: Subscription) => {
    const nextStatus: SubscriptionStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const nowIso = new Date().toISOString();
    const todayStr = formatLocalDate(new Date());

    updateSubscriptions(prev =>
      prev.map(item => {
        if (item.id !== sub.id) return item;
        return {
          ...item,
          status: nextStatus,
          isActive: nextStatus === 'ACTIVE',
          pausedAt: nextStatus === 'PAUSED' ? todayStr : undefined,
          updatedAt: nowIso
        };
      })
    );
  };

  const handleDeleteSub = (subId: string) => {
    const nowIso = new Date().toISOString();
    updateSubscriptions(prev =>
      prev.filter(item => item.id !== subId)
    );
    setDeleteConfirmSub(null);
  };

  const getServiceColor = (sub: Subscription) => {
    if (sub.serviceKey) {
      const match = SUBSCRIPTION_CATALOG.find(c => c.key === sub.serviceKey);
      if (match?.color) return match.color;
    }
    const matchByName = SUBSCRIPTION_CATALOG.find(
      c => c.name.toLowerCase() === sub.name.toLowerCase()
    );
    if (matchByName?.color) return matchByName.color;
    return '#4F46E5';
  };

  const activeCreditCards = cards.filter(c => c.isActive && c.type === 'CREDIT');

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-dark-app-background">
      {/* Top Header */}
      <header className="border-b border-slate-100 dark:border-dark-app-border shrink-0 bg-white dark:bg-dark-app-surface">
        <div className="flex h-[76px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Voltar"
                className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-dark-app-text-primary dark:hover:bg-dark-app-surface-secondary transition-colors"
              >
                <ArrowLeft size={22} />
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-app-text-primary">
              Assinaturas
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-theme px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nova Assinatura</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Mensal */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase tracking-widest">
                Total Mensal
              </span>
              <div className="p-2 rounded-xl bg-theme/10 text-theme">
                <Coins size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-dark-app-text-primary">
                {currencySymbol} {metrics.totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-dark-app-text-secondary">
              {metrics.activeCount} assinatura(s) ativa(s)
            </p>
          </div>

          {/* Card 2: Projeção Anual */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase tracking-widest">
                Custo Anual
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-dark-app-text-primary">
                {currencySymbol} {metrics.annualProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-dark-app-text-secondary">
              Projeção em 12 meses
            </p>
          </div>

          {/* Card 3: % da Renda Líquida */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-dark-app-text-secondary uppercase tracking-widest">
                % da Renda Líquida
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-dark-app-text-primary">
                {metrics.incomePercentage !== null
                  ? `${metrics.incomePercentage.toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-dark-app-text-secondary">
              {metrics.incomePercentage !== null ? (
                metrics.incomePercentage <= 10 ? (
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                    Impacto saudável no orçamento
                  </span>
                ) : metrics.incomePercentage <= 20 ? (
                  <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold">
                    Impacto moderado
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold">
                    Atenção: comprometimento alto
                  </span>
                )
              ) : (
                'Cadastre seu salário para calcular'
              )}
            </p>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface overflow-hidden">
          <div className="border-b border-slate-100 dark:border-dark-app-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-dark-app-text-primary">
              Assinaturas Ativas ({sortedSubscriptions.active.length})
            </h2>
            <span className="text-xs text-slate-400 dark:text-dark-app-text-secondary">
              Ordenadas por dia de vencimento
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-dark-app-border">
            {sortedSubscriptions.active.map(sub => {
              const serviceColor = getServiceColor(sub);
              const card = sub.cardId ? cards.find(c => c.id === sub.cardId) : undefined;

              return (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-5 hover:bg-slate-50/50 dark:hover:bg-dark-app-surface-secondary/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Service Icon / Color Indicator */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm"
                      style={{ backgroundColor: serviceColor }}
                    >
                      {sub.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="block truncate text-base font-bold text-slate-900 dark:text-dark-app-text-primary">
                          {sub.name}
                        </strong>
                        {sub.category && (
                          <span className="rounded-full bg-slate-100 dark:bg-dark-app-surface-secondary px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-dark-app-text-secondary shrink-0">
                            {sub.category}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-dark-app-text-secondary">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-dark-app-text-primary">
                          <Calendar size={13} /> Vence todo dia {sub.dueDay}
                        </span>
                        <span>•</span>
                        <span>{sub.cycle === 'YEARLY' ? 'Anual' : 'Mensal'}</span>
                        <span>•</span>
                        {sub.paymentType === 'CREDIT_CARD' ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-dark-app-text-secondary">
                            <CardIcon size={13} /> {card ? card.name : 'Cartão de Crédito'}
                          </span>
                        ) : (
                          <span>Saída Direta</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Value and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-dark-app-border">
                    <div className="text-left sm:text-right">
                      <span className="block text-lg font-black text-slate-900 dark:text-dark-app-text-primary">
                        {currencySymbol} {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-xs text-slate-400 dark:text-dark-app-text-secondary">
                        {sub.cycle === 'YEARLY' ? 'por ano' : 'por mês'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sub)}
                        title="Pausar assinatura"
                        className="rounded-xl p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <Pause size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(sub)}
                        title="Editar assinatura"
                        className="rounded-xl p-2 text-slate-400 hover:text-theme hover:bg-slate-100 dark:hover:bg-dark-app-surface-secondary transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmSub(sub)}
                        title="Excluir assinatura"
                        className="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedSubscriptions.active.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-dark-app-text-secondary">
                  Nenhuma assinatura ativa encontrada.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-theme hover:underline"
                >
                  <Plus size={16} /> Cadastrar sua primeira assinatura
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inactive Subscriptions Section (Paused / Canceled) */}
        {sortedSubscriptions.inactive.length > 0 && (
          <div className="rounded-3xl bg-white shadow-sm border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInactiveSection(!showInactiveSection)}
              className="w-full border-b border-slate-100 dark:border-dark-app-border px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-dark-app-surface-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-600 dark:text-dark-app-text-secondary">
                  Assinaturas Pausadas / Inativas ({sortedSubscriptions.inactive.length})
                </span>
              </div>
              <ChevronDown
                size={20}
                className={`text-slate-400 transition-transform duration-200 ${
                  showInactiveSection ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showInactiveSection && (
              <div className="divide-y divide-slate-100 dark:divide-dark-app-border opacity-80">
                {sortedSubscriptions.inactive.map(sub => {
                  const card = sub.cardId ? cards.find(c => c.id === sub.cardId) : undefined;
                  return (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 gap-3"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold shrink-0">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="block truncate text-base font-bold text-slate-600 dark:text-dark-app-text-secondary line-through">
                              {sub.name}
                            </strong>
                            <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold">
                              {sub.status === 'PAUSED' ? 'Pausada' : 'Cancelada'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Vencimento dia {sub.dueDay} • {sub.cycle === 'YEARLY' ? 'Anual' : 'Mensal'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <span className="text-base font-bold text-slate-500 dark:text-dark-app-text-secondary">
                          {currencySymbol} {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(sub)}
                            title="Retomar assinatura"
                            className="rounded-xl p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                          >
                            <Play size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            title="Editar assinatura"
                            className="rounded-xl p-2 text-slate-400 hover:text-theme hover:bg-slate-100 dark:hover:bg-dark-app-surface-secondary transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSub(sub)}
                            title="Excluir assinatura"
                            className="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Assinatura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-modal-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-app-border mb-6">
              <h3 id="subscription-modal-title" className="text-xl font-bold text-slate-900 dark:text-dark-app-text-primary">
                {editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-dark-app-text-secondary hover:bg-slate-100 dark:hover:bg-dark-app-surface-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Nome do Serviço + Autocomplete */}
              <div className="relative" ref={autocompleteRef}>
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                  Serviço / Nome
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex: Netflix, Spotify, ChatGPT..."
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-medium text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                />

                {/* Suggestions Dropdown */}
                {isAutocompleteOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl bg-white dark:bg-dark-app-surface shadow-xl border border-slate-100 dark:border-dark-app-border overflow-hidden max-h-56 overflow-y-auto">
                    {suggestions.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-dark-app-surface-secondary transition-colors border-b last:border-b-0 border-slate-50 dark:border-dark-app-border"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="block text-sm font-bold text-slate-900 dark:text-dark-app-text-primary truncate">
                            {item.name}
                          </strong>
                          <span className="block text-xs text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-xs text-theme font-bold">Usar</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Valor e Dia de Vencimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                    Valor ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-bold text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                    Dia do Vencimento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDueDay}
                    onChange={e => setFormDueDay(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-bold text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                  />
                </div>
              </div>

              {parseInt(formDueDay, 10) > 28 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  Em meses mais curtos (ex: fevereiro), a cobrança ocorre no último dia do mês.
                </p>
              )}

              {/* Ciclo de Cobrança */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                  Ciclo de Cobrança
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-dark-app-surface-secondary p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormCycle('MONTHLY')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formCycle === 'MONTHLY'
                        ? 'bg-white dark:bg-dark-app-surface text-slate-900 dark:text-dark-app-text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCycle('YEARLY')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formCycle === 'YEARLY'
                        ? 'bg-white dark:bg-dark-app-surface text-slate-900 dark:text-dark-app-text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Anual
                  </button>
                </div>
              </div>

              {/* Mês de cobrança anual */}
              {formCycle === 'YEARLY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                    Mês de Cobrança Anual
                  </label>
                  <select
                    value={formBillingMonth}
                    onChange={e => setFormBillingMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-bold text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-dark-app-surface-secondary p-1 rounded-2xl mb-3">
                  <button
                    type="button"
                    onClick={() => setFormPaymentType('DIRECT_DEBIT')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formPaymentType === 'DIRECT_DEBIT'
                        ? 'bg-white dark:bg-dark-app-surface text-slate-900 dark:text-dark-app-text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Saída Direta
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentType('CREDIT_CARD')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formPaymentType === 'CREDIT_CARD'
                        ? 'bg-white dark:bg-dark-app-surface text-slate-900 dark:text-dark-app-text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Cartão de Crédito
                  </button>
                </div>

                {/* Seleção do Cartão */}
                {formPaymentType === 'CREDIT_CARD' && (
                  <div>
                    {activeCreditCards.length > 0 ? (
                      <select
                        value={formCardId}
                        onChange={e => setFormCardId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-bold text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                      >
                        {activeCreditCards.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.lastFour ? `(final ${c.lastFour})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                        Nenhum cartão de crédito ativo cadastrado. Cadastre um cartão na aba Cartões para vinculá-lo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status (somente na edição) */}
              {editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-app-text-secondary uppercase mb-1.5">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-app-surface-secondary border border-slate-200 dark:border-dark-app-border rounded-2xl outline-none font-bold text-slate-900 dark:text-dark-app-text-primary focus:border-theme transition-colors"
                  >
                    <option value="ACTIVE">Ativa</option>
                    <option value="PAUSED">Pausada</option>
                    <option value="CANCELED">Cancelada</option>
                  </select>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-dark-app-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-12 flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-12 flex-1 rounded-2xl bg-theme px-4 py-3 font-bold text-white hover:brightness-95 active:scale-95 transition-all shadow-md"
                >
                  {editingSub ? 'Salvar Edição' : 'Criar Assinatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-subscription-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 dark:border-dark-app-border dark:bg-dark-app-surface"
          >
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <h3 id="delete-subscription-title" className="text-xl font-bold text-slate-900 dark:text-dark-app-text-primary">
                Excluir Assinatura?
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-dark-app-text-secondary leading-relaxed">
              Tem certeza que deseja excluir <strong>{deleteConfirmSub.name}</strong>? Cobranças já geradas anteriormente no extrato permanecerão salvas.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSub(null)}
                className="min-h-12 flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600 dark:bg-dark-app-surface-secondary dark:text-dark-app-text-secondary hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSub(deleteConfirmSub.id)}
                className="min-h-12 flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SubscriptionsView;
