/**
 * SyncEngine — Camada de Sincronização em Nuvem (Cloud Sync via Supabase)
 *
 * Características:
 * 1. Sincronização incremental e granular por registro (transactions, subscriptions, cards, settings, salary_info, initial_balance).
 * 2. Fila de mutações offline persistida em localStorage com coalescência inteligente.
 * 3. Primeiro login / First sync: preserva dados locais subindo se a nuvem estiver vazia, ou mesclando sem duplicar via Last-Write-Wins.
 * 4. Resolução de conflitos Last-Write-Wins (LWW) baseada em timestamp/updated_at.
 * 5. Flush automático ao reconectar ('online'), mudança de visibilidade ('visibilitychange') ou intervalo regular.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  CreditCard, 
  DateRange,
  InitialBalance, 
  SalaryInfo, 
  Subscription, 
  Transaction, 
  UserSettings 
} from '../types';
import { AppStateSnapshot, readSnapshot, writeSnapshot } from '../utils/appStorage';

export type SyncTable = 
  | 'transactions' 
  | 'subscriptions' 
  | 'credit_cards' 
  | 'user_settings' 
  | 'salary_info' 
  | 'initial_balances';

export type SyncAction = 'UPSERT' | 'DELETE';

export interface SyncMutation {
  id: string;
  userId: string;
  table: SyncTable;
  action: SyncAction;
  recordId: string;
  payload?: any;
  timestamp: string;
  retryCount: number;
}

export interface SyncEngineStatus {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncError: Error | null;
  pendingMutationsCount: number;
  isOnline: boolean;
}

export type SyncListener = (status: SyncEngineStatus) => void;
export type RemoteUpdateListener = (updatedSnapshot: Partial<AppStateSnapshot>) => void;

// ---------------------------------------------------------------------------
// Constantes de Chave de Armazenamento
// ---------------------------------------------------------------------------

const getQueueKey = (userId: string) => `drachma_sync_queue_${userId}`;
const getLastSyncKey = (userId: string) => `drachma_last_sync_${userId}`;
const getFirstSyncKey = (userId: string) => `drachma_first_sync_done_${userId}`;

// ---------------------------------------------------------------------------
// Mapeadores: CamelCase (Frontend) <-> SnakeCase (Supabase DB)
// ---------------------------------------------------------------------------

export const transactionToRow = (tx: Transaction, userId: string) => {
  const now = new Date().toISOString();
  return {
    id: tx.id,
    user_id: userId,
    date: tx.date,
    created_at: tx.createdAt || now,
    updated_at: tx.updatedAt || now,
    deleted_at: tx.deletedAt || null,
    version: tx.version || 1,
    description: tx.description,
    amount: tx.amount,
    entry_type: tx.entryType,
    tags: tx.tags || [],
    type: tx.type || null,
    financial_group: tx.financialGroup || null,
    payment_method: tx.paymentMethod || null,
    card_id: tx.cardId || null,
    comment: tx.comment || '',
    is_fixed: tx.isFixed ?? null,
    recurrence_frequency: tx.recurrenceFrequency || null,
    recurrence_end_mode: tx.recurrenceEndMode || null,
    recurrence_count: tx.recurrenceCount ?? null,
    recurrence_excluded_dates: tx.recurrenceExcludedDates || [],
    is_installment: tx.isInstallment ?? null,
    installment_info: tx.installmentInfo || null,
    batch_id: tx.batchId || null,
    batch_name: tx.batchName || null,
    import_date: tx.importDate || null,
    recurrence_index: tx.recurrenceIndex ?? null,
    recurrence_total: tx.recurrenceTotal ?? null,
    subscription_id: tx.subscriptionId || null,
  };
};

export const rowToTransaction = (row: any): Transaction => {
  return {
    id: String(row.id),
    date: row.date,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
    version: row.version ?? 1,
    userId: row.user_id,
    description: row.description,
    amount: Number(row.amount),
    entryType: row.entry_type,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
    type: row.type || undefined,
    financialGroup: row.financial_group || undefined,
    paymentMethod: row.payment_method || undefined,
    cardId: row.card_id || undefined,
    comment: row.comment || '',
    isFixed: row.is_fixed ?? undefined,
    recurrenceFrequency: row.recurrence_frequency || undefined,
    recurrenceEndMode: row.recurrence_end_mode || undefined,
    recurrenceCount: row.recurrence_count ?? undefined,
    recurrenceExcludedDates: Array.isArray(row.recurrence_excluded_dates) 
      ? row.recurrence_excluded_dates 
      : (typeof row.recurrence_excluded_dates === 'string' ? JSON.parse(row.recurrence_excluded_dates) : undefined),
    isInstallment: row.is_installment ?? undefined,
    installmentInfo: typeof row.installment_info === 'string' 
      ? JSON.parse(row.installment_info) 
      : (row.installment_info || undefined),
    batchId: row.batch_id || undefined,
    batchName: row.batch_name || undefined,
    importDate: row.import_date || undefined,
    recurrenceIndex: row.recurrence_index ?? undefined,
    recurrenceTotal: row.recurrence_total ?? undefined,
    subscriptionId: row.subscription_id || undefined,
  };
};

export const subscriptionToRow = (sub: Subscription, userId: string) => {
  const now = new Date().toISOString();
  return {
    id: sub.id,
    user_id: userId,
    created_at: sub.createdAt || now,
    updated_at: sub.updatedAt || now,
    deleted_at: sub.deletedAt || null,
    version: sub.version || 1,
    name: sub.name,
    amount: sub.amount,
    is_active: sub.isActive ?? (sub.status === 'ACTIVE'),
    due_day: sub.dueDay ?? 1,
    cycle: sub.cycle || 'MONTHLY',
    payment_type: sub.paymentType || 'DIRECT_DEBIT',
    card_id: sub.cardId || null,
    status: sub.status || 'ACTIVE',
    billing_month: sub.billingMonth ?? null,
    start_date: sub.startDate || null,
    last_generated_date: sub.lastGeneratedDate || null,
    paused_at: sub.pausedAt || null,
    canceled_at: sub.canceledAt || null,
    service_key: sub.serviceKey || null,
    category: sub.category || null,
  };
};

export const rowToSubscription = (row: any): Subscription => {
  return {
    id: String(row.id),
    name: row.name,
    amount: Number(row.amount),
    dueDay: row.due_day ?? 1,
    cycle: row.cycle || 'MONTHLY',
    paymentType: row.payment_type || 'DIRECT_DEBIT',
    cardId: row.card_id || undefined,
    status: row.status || (row.is_active ? 'ACTIVE' : 'PAUSED'),
    isActive: row.is_active ?? true,
    billingMonth: row.billing_month ?? undefined,
    startDate: row.start_date || undefined,
    lastGeneratedDate: row.last_generated_date || undefined,
    pausedAt: row.paused_at || undefined,
    canceledAt: row.canceled_at || undefined,
    serviceKey: row.service_key || undefined,
    category: row.category || undefined,
    userId: row.user_id,
    version: row.version ?? 1,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
};

export const creditCardToRow = (card: CreditCard, userId: string) => {
  const now = new Date().toISOString();
  return {
    id: card.id,
    user_id: userId,
    created_at: card.createdAt || now,
    updated_at: card.updatedAt || now,
    deleted_at: card.deletedAt || null,
    version: card.version || 1,
    name: card.name,
    bank: card.bank,
    type: card.type,
    brand: card.brand || null,
    last_four: card.lastFour || null,
    color: card.color || null,
    limit: card.limit ?? null,
    closing_day: card.closingDay ?? null,
    due_day: card.dueDay ?? null,
    is_active: card.isActive ?? true,
  };
};

export const rowToCreditCard = (row: any): CreditCard => {
  return {
    id: String(row.id),
    name: row.name,
    bank: row.bank,
    type: row.type || 'CREDIT',
    brand: row.brand || undefined,
    lastFour: row.last_four || undefined,
    color: row.color || undefined,
    limit: row.limit !== null ? Number(row.limit) : undefined,
    closingDay: row.closing_day ?? undefined,
    dueDay: row.due_day ?? undefined,
    isActive: row.is_active ?? true,
    userId: row.user_id,
    version: row.version ?? 1,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
};

export const userSettingsToRow = (settings: UserSettings, userId: string) => {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    created_at: settings.createdAt || now,
    updated_at: settings.updatedAt || now,
    deleted_at: settings.deletedAt || null,
    version: settings.version || 1,
    currency: settings.currency || 'BRL',
    user_name: settings.userName || 'Usuário Drachma',
    user_photo: settings.userPhoto || '',
    theme: settings.theme || 'light',
    savings_target: settings.savingsTarget ?? null,
    base_salary: settings.baseSalary ?? null,
  };
};

export const rowToUserSettings = (row: any): UserSettings => {
  return {
    currency: row.currency || 'BRL',
    userName: row.user_name || 'Usuário Drachma',
    userPhoto: row.user_photo || '',
    theme: row.theme || 'light',
    savingsTarget: row.savings_target !== null ? Number(row.savings_target) : undefined,
    baseSalary: row.base_salary !== null ? Number(row.base_salary) : undefined,
    userId: row.user_id,
    version: row.version ?? 1,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
};

export const salaryInfoToRow = (salary: SalaryInfo, userId: string) => {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    created_at: salary.createdAt || now,
    updated_at: salary.updatedAt || now,
    deleted_at: salary.deletedAt || null,
    version: salary.version || 1,
    gross: salary.gross || 0,
    discounts: salary.discounts || [],
  };
};

export const rowToSalaryInfo = (row: any): SalaryInfo => {
  return {
    gross: Number(row.gross || 0),
    discounts: Array.isArray(row.discounts) 
      ? row.discounts 
      : (typeof row.discounts === 'string' ? JSON.parse(row.discounts) : []),
    userId: row.user_id,
    version: row.version ?? 1,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
};

export const initialBalanceToRow = (balance: InitialBalance, userId: string) => {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    created_at: balance.createdAt || now,
    updated_at: balance.updatedAt || now,
    deleted_at: balance.deletedAt || null,
    version: balance.version || 1,
    amount: balance.amount || 0,
    date: balance.date,
  };
};

export const rowToInitialBalance = (row: any): InitialBalance => {
  return {
    amount: Number(row.amount || 0),
    date: row.date,
    userId: row.user_id,
    version: row.version ?? 1,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    deletedAt: row.deleted_at || undefined,
  };
};

// ---------------------------------------------------------------------------
// Resolução de Conflitos: Last-Write-Wins (LWW)
// ---------------------------------------------------------------------------

export function resolveConflict<T extends { updatedAt?: string; createdAt?: string }>(
  local: T,
  remote: T
): { winner: T; source: 'local' | 'remote' } {
  const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
  
  if (remoteTime >= localTime) {
    return { winner: remote, source: 'remote' };
  }
  return { winner: local, source: 'local' };
}

// ---------------------------------------------------------------------------
// Lógica de Mesclagem no Primeiro Sync
// ---------------------------------------------------------------------------

function mergeCollection<T extends { id: string; updatedAt?: string; createdAt?: string; deletedAt?: string }>(
  localItems: T[],
  remoteItems: T[],
  table: SyncTable,
  userId: string,
  toRow: (item: T, userId: string) => any,
  mutationsToPush: Omit<SyncMutation, 'id' | 'retryCount'>[]
): T[] {
  const now = new Date().toISOString();
  const remoteMap = new Map<string, T>();
  remoteItems.forEach(r => remoteMap.set(r.id, r));

  const localMap = new Map<string, T>();
  localItems.forEach(l => localMap.set(l.id, l));

  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
  const activeMerged: T[] = [];

  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (local && !remote) {
      if (!local.deletedAt) {
        activeMerged.push(local);
        mutationsToPush.push({
          userId,
          table,
          action: 'UPSERT',
          recordId: local.id,
          payload: toRow(local, userId),
          timestamp: local.updatedAt || now
        });
      }
    } else if (!local && remote) {
      if (!remote.deletedAt) {
        activeMerged.push(remote);
      }
    } else if (local && remote) {
      const localIsDeleted = Boolean(local.deletedAt);
      const remoteIsDeleted = Boolean(remote.deletedAt);

      if (localIsDeleted && remoteIsDeleted) {
        continue;
      }

      const localTime = new Date(local.deletedAt || local.updatedAt || local.createdAt || 0).getTime();
      const remoteTime = new Date(remote.deletedAt || remote.updatedAt || remote.createdAt || 0).getTime();

      if (localIsDeleted && !remoteIsDeleted) {
        if (localTime >= remoteTime) {
          // Deleção local mais recente (ou timestamps iguais): considerado deletado
          // Outro lado tem ativo -> gera mutação DELETE
          mutationsToPush.push({
            userId,
            table,
            action: 'DELETE',
            recordId: id,
            payload: null,
            timestamp: local.deletedAt || now
          });
        } else {
          // Atualização remota mais recente: prevalece ativo
          activeMerged.push(remote);
        }
      } else if (!localIsDeleted && remoteIsDeleted) {
        if (remoteTime >= localTime) {
          // Deleção remota mais recente (ou timestamps iguais): considerado deletado
        } else {
          // Atualização local mais recente: prevalece ativo -> gera mutação UPSERT para atualizar servidor
          const activeLocal = { ...local, deletedAt: undefined };
          activeMerged.push(activeLocal);
          mutationsToPush.push({
            userId,
            table,
            action: 'UPSERT',
            recordId: id,
            payload: toRow(activeLocal, userId),
            timestamp: local.updatedAt || now
          });
        }
      } else {
        // Ambos ativos
        const { winner, source } = resolveConflict(local, remote);
        activeMerged.push(winner);
        if (source === 'local') {
          mutationsToPush.push({
            userId,
            table,
            action: 'UPSERT',
            recordId: winner.id,
            payload: toRow(winner, userId),
            timestamp: winner.updatedAt || now
          });
        }
      }
    }
  }

  return activeMerged;
}

function mergeSingleton<T extends { updatedAt?: string; createdAt?: string; deletedAt?: string }>(
  local: T | null | undefined,
  remote: T | null | undefined,
  table: SyncTable,
  userId: string,
  toRow: (item: T, userId: string) => any,
  mutationsToPush: Omit<SyncMutation, 'id' | 'retryCount'>[]
): T | null {
  const now = new Date().toISOString();
  if (local && !remote) {
    if (!local.deletedAt) {
      mutationsToPush.push({
        userId,
        table,
        action: 'UPSERT',
        recordId: 'singleton',
        payload: toRow(local, userId),
        timestamp: local.updatedAt || now
      });
      return local;
    }
    return null;
  }
  if (!local && remote) {
    return remote.deletedAt ? null : remote;
  }
  if (local && remote) {
    const localIsDeleted = Boolean(local.deletedAt);
    const remoteIsDeleted = Boolean(remote.deletedAt);

    if (localIsDeleted && remoteIsDeleted) {
      return null;
    }

    const localTime = new Date(local.deletedAt || local.updatedAt || local.createdAt || 0).getTime();
    const remoteTime = new Date(remote.deletedAt || remote.updatedAt || remote.createdAt || 0).getTime();

    if (localIsDeleted && !remoteIsDeleted) {
      if (localTime >= remoteTime) {
        mutationsToPush.push({
          userId,
          table,
          action: 'DELETE',
          recordId: 'singleton',
          payload: null,
          timestamp: local.deletedAt || now
        });
        return null;
      }
      return remote;
    }

    if (!localIsDeleted && remoteIsDeleted) {
      if (remoteTime >= localTime) {
        return null;
      }
      const activeLocal = { ...local, deletedAt: undefined };
      mutationsToPush.push({
        userId,
        table,
        action: 'UPSERT',
        recordId: 'singleton',
        payload: toRow(activeLocal, userId),
        timestamp: local.updatedAt || now
      });
      return activeLocal;
    }

    const { winner, source } = resolveConflict(local, remote);
    if (source === 'local') {
      mutationsToPush.push({
        userId,
        table,
        action: 'UPSERT',
        recordId: 'singleton',
        payload: toRow(winner, userId),
        timestamp: winner.updatedAt || now
      });
    }
    return winner;
  }
  return null;
}

export function mergeOnFirstSync(
  local: Partial<AppStateSnapshot>,
  remote: {
    transactions: Transaction[];
    subscriptions: Subscription[];
    cards: CreditCard[];
    settings?: UserSettings | null;
    salaryInfo?: SalaryInfo | null;
    initialBalance?: InitialBalance | null;
  },
  userId: string
): {
  merged: Partial<AppStateSnapshot>;
  mutationsToPush: Omit<SyncMutation, 'id' | 'retryCount'>[];
} {
  const mutationsToPush: Omit<SyncMutation, 'id' | 'retryCount'>[] = [];

  const mergedTransactions = mergeCollection(
    local.transactions || [],
    remote.transactions || [],
    'transactions',
    userId,
    transactionToRow,
    mutationsToPush
  );

  const mergedSubscriptions = mergeCollection(
    local.subscriptions || [],
    remote.subscriptions || [],
    'subscriptions',
    userId,
    subscriptionToRow,
    mutationsToPush
  );

  const mergedCards = mergeCollection(
    local.cards || [],
    remote.cards || [],
    'credit_cards',
    userId,
    creditCardToRow,
    mutationsToPush
  );

  const finalSettings = mergeSingleton(
    local.settings,
    remote.settings,
    'user_settings',
    userId,
    userSettingsToRow,
    mutationsToPush
  );

  const finalSalary = mergeSingleton(
    local.salaryInfo,
    remote.salaryInfo,
    'salary_info',
    userId,
    salaryInfoToRow,
    mutationsToPush
  );

  const finalBalance = mergeSingleton(
    local.initialBalance,
    remote.initialBalance,
    'initial_balances',
    userId,
    initialBalanceToRow,
    mutationsToPush
  );

  return {
    merged: {
      transactions: mergedTransactions,
      subscriptions: mergedSubscriptions,
      cards: mergedCards,
      settings: finalSettings ?? undefined,
      salaryInfo: finalSalary ?? undefined,
      initialBalance: finalBalance ?? undefined,
      dateRange: local.dateRange,
    },
    mutationsToPush
  };
}

// ---------------------------------------------------------------------------
// Classe SyncEngine
// ---------------------------------------------------------------------------

export class SyncEngine {
  private currentUserId: string | null = null;
  private isSyncing = false;
  private lastSynced: Date | null = null;
  private syncError: Error | null = null;
  private statusListeners = new Set<SyncListener>();
  private remoteUpdateListeners = new Set<RemoteUpdateListener>();
  private syncDebounceTimer: any = null;
  private autoSyncInterval: any = null;
  private boundOnlineHandler: () => void;
  private boundVisibilityHandler: () => void;
  private syncPromise: Promise<void> | null = null;

  constructor() {
    this.boundOnlineHandler = () => {
      this.notifyStatus();
      if (this.currentUserId) {
        void this.sync();
      }
    };

    this.boundVisibilityHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this.currentUserId) {
        void this.sync();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.boundOnlineHandler);
      window.addEventListener('offline', () => this.notifyStatus());
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundOnlineHandler);
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    this.statusListeners.clear();
    this.remoteUpdateListeners.clear();
  }

  public setUserId(userId: string | null): void {
    if (this.currentUserId === userId) return;
    this.currentUserId = userId;

    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    if (userId) {
      const storedLastSync = localStorage.getItem(getLastSyncKey(userId));
      this.lastSynced = storedLastSync ? new Date(storedLastSync) : null;
      this.notifyStatus();

      // Inicia auto-sync a cada 45 segundos quando autenticado
      this.autoSyncInterval = setInterval(() => {
        if (this.isOnline() && !this.isSyncing) {
          void this.sync();
        }
      }, 45000);

      // Dispara primeiro sync
      void this.sync();
    } else {
      this.lastSynced = null;
      this.syncError = null;
      this.notifyStatus();
    }
  }

  public getUserId(): string | null {
    return this.currentUserId;
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getStatus(): SyncEngineStatus {
    const queue = this.currentUserId ? this.getQueue(this.currentUserId) : [];
    return {
      isSyncing: this.isSyncing,
      lastSynced: this.lastSynced,
      syncError: this.syncError,
      pendingMutationsCount: queue.length,
      isOnline: this.isOnline()
    };
  }

  public subscribeStatus(listener: SyncListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  public subscribeRemoteUpdate(listener: RemoteUpdateListener): () => void {
    this.remoteUpdateListeners.add(listener);
    return () => this.remoteUpdateListeners.delete(listener);
  }

  private notifyStatus(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(l => l(status));
  }

  private notifyRemoteUpdate(updatedSnapshot: Partial<AppStateSnapshot>): void {
    this.remoteUpdateListeners.forEach(l => l(updatedSnapshot));
  }

  // -------------------------------------------------------------------------
  // Fila de Mutações Offline
  // -------------------------------------------------------------------------

  public getQueue(userId: string): SyncMutation[] {
    try {
      const data = localStorage.getItem(getQueueKey(userId));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveQueue(userId: string, queue: SyncMutation[]): void {
    try {
      localStorage.setItem(getQueueKey(userId), JSON.stringify(queue));
      this.notifyStatus();
    } catch {
      // Falha silenciosa de localStorage quota
    }
  }

  public enqueueMutation(mutation: Omit<SyncMutation, 'id' | 'retryCount'>): void {
    const userId = mutation.userId;
    const queue = this.getQueue(userId);

    // Coalesce / deduplica mutações anteriores para o mesmo registro
    const filtered = queue.filter(
      item => !(item.table === mutation.table && item.recordId === mutation.recordId)
    );

    const newMutation: SyncMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      retryCount: 0
    };

    filtered.push(newMutation);
    this.saveQueue(userId, filtered);

    // Agenda flush automático após 300ms de inatividade
    this.scheduleDebouncedSync();
  }

  private scheduleDebouncedSync(): void {
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      if (this.isOnline() && !this.isSyncing && this.currentUserId) {
        void this.sync();
      }
    }, 300);
  }

  // -------------------------------------------------------------------------
  // Deteção de Mudanças Granulares (Diff) a partir do Estado Local
  // -------------------------------------------------------------------------

  public enqueueStateDiff(
    previousState: Partial<AppStateSnapshot> | undefined,
    currentState: Partial<AppStateSnapshot>,
    userId: string
  ): void {
    if (!previousState) return;
    const now = new Date().toISOString();

    // 1. Transactions
    const prevTxs = previousState.transactions || [];
    const currTxs = currentState.transactions || [];
    const currTxMap = new Map(currTxs.map(t => [t.id, t]));

    // Modificados ou adicionados
    currTxs.forEach(curr => {
      const prev = prevTxs.find(p => p.id === curr.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(curr)) {
        this.enqueueMutation({
          userId,
          table: 'transactions',
          action: 'UPSERT',
          recordId: curr.id,
          payload: transactionToRow({ ...curr, updatedAt: curr.updatedAt || now }, userId),
          timestamp: now
        });
      }
    });

    // Removidos
    prevTxs.forEach(prev => {
      if (!currTxMap.has(prev.id)) {
        this.enqueueMutation({
          userId,
          table: 'transactions',
          action: 'DELETE',
          recordId: prev.id,
          payload: null,
          timestamp: now
        });
      }
    });

    // 2. Subscriptions
    const prevSubs = previousState.subscriptions || [];
    const currSubs = currentState.subscriptions || [];
    const currSubMap = new Map(currSubs.map(s => [s.id, s]));

    currSubs.forEach(curr => {
      const prev = prevSubs.find(p => p.id === curr.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(curr)) {
        this.enqueueMutation({
          userId,
          table: 'subscriptions',
          action: 'UPSERT',
          recordId: curr.id,
          payload: subscriptionToRow({ ...curr, updatedAt: curr.updatedAt || now }, userId),
          timestamp: now
        });
      }
    });

    prevSubs.forEach(prev => {
      if (!currSubMap.has(prev.id)) {
        this.enqueueMutation({
          userId,
          table: 'subscriptions',
          action: 'DELETE',
          recordId: prev.id,
          payload: null,
          timestamp: now
        });
      }
    });

    // 3. Credit Cards
    const prevCards = previousState.cards || [];
    const currCards = currentState.cards || [];
    const currCardMap = new Map(currCards.map(c => [c.id, c]));

    currCards.forEach(curr => {
      const prev = prevCards.find(p => p.id === curr.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(curr)) {
        this.enqueueMutation({
          userId,
          table: 'credit_cards',
          action: 'UPSERT',
          recordId: curr.id,
          payload: creditCardToRow({ ...curr, updatedAt: curr.updatedAt || now }, userId),
          timestamp: now
        });
      }
    });

    prevCards.forEach(prev => {
      if (!currCardMap.has(prev.id)) {
        this.enqueueMutation({
          userId,
          table: 'credit_cards',
          action: 'DELETE',
          recordId: prev.id,
          payload: null,
          timestamp: now
        });
      }
    });

    // 4. User Settings
    if (currentState.settings && JSON.stringify(currentState.settings) !== JSON.stringify(previousState.settings)) {
      this.enqueueMutation({
        userId,
        table: 'user_settings',
        action: 'UPSERT',
        recordId: 'singleton',
        payload: userSettingsToRow({ ...currentState.settings, updatedAt: currentState.settings.updatedAt || now }, userId),
        timestamp: now
      });
    }

    // 5. Salary Info
    if (currentState.salaryInfo && JSON.stringify(currentState.salaryInfo) !== JSON.stringify(previousState.salaryInfo)) {
      this.enqueueMutation({
        userId,
        table: 'salary_info',
        action: 'UPSERT',
        recordId: 'singleton',
        payload: salaryInfoToRow({ ...currentState.salaryInfo, updatedAt: currentState.salaryInfo.updatedAt || now }, userId),
        timestamp: now
      });
    }

    // 6. Initial Balance
    if (currentState.initialBalance && JSON.stringify(currentState.initialBalance) !== JSON.stringify(previousState.initialBalance)) {
      this.enqueueMutation({
        userId,
        table: 'initial_balances',
        action: 'UPSERT',
        recordId: 'singleton',
        payload: initialBalanceToRow({ ...currentState.initialBalance, updatedAt: currentState.initialBalance.updatedAt || now }, userId),
        timestamp: now
      });
    }
  }

  // -------------------------------------------------------------------------
  // Processamento do Primeiro Sync
  // -------------------------------------------------------------------------

  private async executeFirstSync(userId: string): Promise<void> {
    // 1. Consulta dados remotos
    const [
      { data: remoteTxs, error: errTxs },
      { data: remoteSubs, error: errSubs },
      { data: remoteCards, error: errCards },
      { data: remoteSettings, error: errSettings },
      { data: remoteSalary, error: errSalary },
      { data: remoteBalance, error: errBalance }
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId),
      supabase.from('credit_cards').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('salary_info').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('initial_balances').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (errTxs || errSubs || errCards || errSettings || errSalary || errBalance) {
      throw (errTxs || errSubs || errCards || errSettings || errSalary || errBalance);
    }

    const mappedRemote = {
      transactions: (remoteTxs || []).map(rowToTransaction),
      subscriptions: (remoteSubs || []).map(rowToSubscription),
      cards: (remoteCards || []).map(rowToCreditCard),
      settings: remoteSettings ? rowToUserSettings(remoteSettings) : null,
      salaryInfo: remoteSalary ? rowToSalaryInfo(remoteSalary) : null,
      initialBalance: remoteBalance ? rowToInitialBalance(remoteBalance) : null
    };

    const isRemoteEmpty = 
      mappedRemote.transactions.length === 0 &&
      mappedRemote.subscriptions.length === 0 &&
      mappedRemote.cards.length === 0 &&
      !mappedRemote.settings &&
      !mappedRemote.salaryInfo &&
      !mappedRemote.initialBalance;

    const localSnapshot = readSnapshot() || {};
    const isLocalEmpty = 
      (!localSnapshot.transactions || localSnapshot.transactions.length === 0) &&
      (!localSnapshot.subscriptions || localSnapshot.subscriptions.length === 0) &&
      (!localSnapshot.cards || localSnapshot.cards.length === 0) &&
      (!localSnapshot.salaryInfo || localSnapshot.salaryInfo.gross === 0) &&
      (!localSnapshot.initialBalance || localSnapshot.initialBalance.amount === 0);

    // Caso A: Nuvem vazia e local com dados -> Sobe dados locais para a nuvem
    if (isRemoteEmpty && !isLocalEmpty) {
      if (localSnapshot.cards?.length) {
        const { error } = await supabase.from('credit_cards').upsert(localSnapshot.cards.map(c => creditCardToRow(c, userId)));
        if (error) throw error;
      }
      if (localSnapshot.subscriptions?.length) {
        const { error } = await supabase.from('subscriptions').upsert(localSnapshot.subscriptions.map(s => subscriptionToRow(s, userId)));
        if (error) throw error;
      }
      if (localSnapshot.transactions?.length) {
        const { error } = await supabase.from('transactions').upsert(localSnapshot.transactions.map(t => transactionToRow(t, userId)));
        if (error) throw error;
      }
      if (localSnapshot.settings) {
        const { error } = await supabase.from('user_settings').upsert(userSettingsToRow(localSnapshot.settings, userId), { onConflict: 'user_id' });
        if (error) throw error;
      }
      if (localSnapshot.salaryInfo) {
        const { error } = await supabase.from('salary_info').upsert(salaryInfoToRow(localSnapshot.salaryInfo, userId), { onConflict: 'user_id' });
        if (error) throw error;
      }
      if (localSnapshot.initialBalance) {
        const { error } = await supabase.from('initial_balances').upsert(initialBalanceToRow(localSnapshot.initialBalance, userId), { onConflict: 'user_id' });
        if (error) throw error;
      }
    } 
    // Caso B: Nuvem com dados e local vazio -> Puxa dados da nuvem para o local
    else if (!isRemoteEmpty && isLocalEmpty) {
      const newSnapshot: AppStateSnapshot = {
        version: 2,
        transactions: mappedRemote.transactions.filter(t => !t.deletedAt),
        subscriptions: mappedRemote.subscriptions.filter(s => !s.deletedAt),
        cards: mappedRemote.cards.filter(c => !c.deletedAt),
        settings: (mappedRemote.settings && !mappedRemote.settings.deletedAt) ? mappedRemote.settings : (localSnapshot.settings || {
          currency: 'BRL',
          userName: 'Usuário Drachma',
          userPhoto: '',
          theme: 'light',
          savingsTarget: 20
        }),
        salaryInfo: (mappedRemote.salaryInfo && !mappedRemote.salaryInfo.deletedAt) ? mappedRemote.salaryInfo : { gross: 0, discounts: [] },
        initialBalance: (mappedRemote.initialBalance && !mappedRemote.initialBalance.deletedAt) ? mappedRemote.initialBalance : { amount: 0, date: new Date().toISOString().slice(0, 10) },
        dateRange: localSnapshot.dateRange || {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
          end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
        }
      };
      writeSnapshot(newSnapshot);
      this.notifyRemoteUpdate(newSnapshot);
    } 
    // Caso C: Ambos com dados -> Mescla sem duplicar usando Last-Write-Wins
    else if (!isRemoteEmpty && !isLocalEmpty) {
      const { merged, mutationsToPush } = mergeOnFirstSync(localSnapshot, mappedRemote, userId);
      writeSnapshot(merged as AppStateSnapshot);
      this.notifyRemoteUpdate(merged);

      // Despeja as mutações locais no banco
      for (const mut of mutationsToPush) {
        if (mut.action === 'UPSERT') {
          const onConflict = mut.table.includes('settings') || mut.table.includes('salary') || mut.table.includes('initial')
            ? 'user_id'
            : 'id';
          const { error } = await supabase.from(mut.table).upsert(mut.payload, { onConflict });
          if (error) throw error;
        } else if (mut.action === 'DELETE') {
          const isSingleton = mut.recordId === 'singleton' || 
            mut.table === 'user_settings' || 
            mut.table === 'salary_info' || 
            mut.table === 'initial_balances';
          let query = supabase
            .from(mut.table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', userId);
          if (!isSingleton) {
            query = query.eq('id', mut.recordId);
          }
          const { error } = await query;
          if (error) throw error;
        }
      }
    }

    localStorage.setItem(getFirstSyncKey(userId), 'true');
  }

  // -------------------------------------------------------------------------
  // Sincronização Incremental / Granular
  // -------------------------------------------------------------------------

  public async sync(): Promise<void> {
    if (!this.currentUserId || !isSupabaseConfigured) return;
    if (this.syncPromise) {
      return this.syncPromise;
    }
    if (!this.isOnline()) {
      this.notifyStatus();
      return;
    }

    this.syncPromise = this.performSync();
    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  private async performSync(): Promise<void> {
    const userId = this.currentUserId;
    if (!userId) return;
    this.isSyncing = true;
    this.syncError = null;
    this.notifyStatus();

    try {
      // 1. Checa se o primeiro sync foi executado
      const firstSyncDone = localStorage.getItem(getFirstSyncKey(userId)) === 'true';
      if (!firstSyncDone) {
        await this.executeFirstSync(userId);
      }

      // 2. Push: Processa fila de mutações offline
      const queue = this.getQueue(userId);
      if (queue.length > 0) {
        const remainingQueue: SyncMutation[] = [];

        for (const mut of queue) {
          try {
            if (mut.action === 'UPSERT') {
              const onConflict = mut.table.includes('settings') || mut.table.includes('salary') || mut.table.includes('initial')
                ? 'user_id'
                : 'id';
              const { error } = await supabase.from(mut.table).upsert(mut.payload, { onConflict });
              if (error) throw error;
            } else if (mut.action === 'DELETE') {
              // Soft delete com deleted_at
              const isSingleton = mut.recordId === 'singleton' || 
                mut.table === 'user_settings' || 
                mut.table === 'salary_info' || 
                mut.table === 'initial_balances';

              let query = supabase
                .from(mut.table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('user_id', userId);

              if (!isSingleton) {
                query = query.eq('id', mut.recordId);
              }

              const { error } = await query;
              if (error) throw error;
            }
          } catch (err: any) {
            // Em caso de erro, incrementa retry e mantém na fila
            remainingQueue.push({ ...mut, retryCount: mut.retryCount + 1 });
          }
        }

        this.saveQueue(userId, remainingQueue);
      }

      // 3. Pull: Busca alterações remotas ocorridas desde o último sync
      const lastSyncIso = localStorage.getItem(getLastSyncKey(userId));
      const pullQuery = (table: string) => {
        let q = supabase.from(table).select('*').eq('user_id', userId);
        if (lastSyncIso) {
          q = q.gt('updated_at', lastSyncIso);
        }
        return q;
      };

      const [
        { data: pulledTxs },
        { data: pulledSubs },
        { data: pulledCards },
        { data: pulledSettings },
        { data: pulledSalary },
        { data: pulledBalance }
      ] = await Promise.all([
        pullQuery('transactions'),
        pullQuery('subscriptions'),
        pullQuery('credit_cards'),
        pullQuery('user_settings').maybeSingle(),
        pullQuery('salary_info').maybeSingle(),
        pullQuery('initial_balances').maybeSingle()
      ]);

      const hasRemoteChanges = 
        Boolean(pulledTxs && pulledTxs.length > 0) ||
        Boolean(pulledSubs && pulledSubs.length > 0) ||
        Boolean(pulledCards && pulledCards.length > 0) ||
        Boolean(pulledSettings) ||
        Boolean(pulledSalary) ||
        Boolean(pulledBalance);

      if (hasRemoteChanges) {
        const localSnapshot = readSnapshot() || {};
        let updated = false;

        // Merge Transactions
        let nextTxs = [...(localSnapshot.transactions || [])];
        (pulledTxs || []).forEach(row => {
          const remoteItem = rowToTransaction(row);
          const localIdx = nextTxs.findIndex(t => t.id === row.id);

          if (row.deleted_at) {
            if (localIdx !== -1) {
              const localItem = nextTxs[localIdx];
              const remoteRowWithDeletedAt = {
                ...remoteItem,
                updatedAt: row.deleted_at
              };
              const { source } = resolveConflict(localItem, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextTxs = nextTxs.filter(t => t.id !== row.id);
                updated = true;
              } else {
                // Edição local é mais recente que deleted_at remoto: preserva e enfileira UPSERT para ressuscitar no servidor
                this.enqueueMutation({
                  userId,
                  table: 'transactions',
                  action: 'UPSERT',
                  recordId: localItem.id,
                  payload: transactionToRow({ ...localItem, deletedAt: undefined }, userId),
                  timestamp: localItem.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (localIdx === -1) {
              nextTxs.push(remoteItem);
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextTxs[localIdx], remoteItem);
              if (source === 'remote') {
                nextTxs[localIdx] = winner;
                updated = true;
              }
            }
          }
        });

        // Merge Subscriptions
        let nextSubs = [...(localSnapshot.subscriptions || [])];
        (pulledSubs || []).forEach(row => {
          const remoteItem = rowToSubscription(row);
          const localIdx = nextSubs.findIndex(s => s.id === row.id);

          if (row.deleted_at) {
            if (localIdx !== -1) {
              const localItem = nextSubs[localIdx];
              const remoteRowWithDeletedAt = {
                ...remoteItem,
                updatedAt: row.deleted_at
              };
              const { source } = resolveConflict(localItem, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextSubs = nextSubs.filter(s => s.id !== row.id);
                updated = true;
              } else {
                this.enqueueMutation({
                  userId,
                  table: 'subscriptions',
                  action: 'UPSERT',
                  recordId: localItem.id,
                  payload: subscriptionToRow({ ...localItem, deletedAt: undefined }, userId),
                  timestamp: localItem.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (localIdx === -1) {
              nextSubs.push(remoteItem);
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextSubs[localIdx], remoteItem);
              if (source === 'remote') {
                nextSubs[localIdx] = winner;
                updated = true;
              }
            }
          }
        });

        // Merge Credit Cards
        let nextCards = [...(localSnapshot.cards || [])];
        (pulledCards || []).forEach(row => {
          const remoteItem = rowToCreditCard(row);
          const localIdx = nextCards.findIndex(c => c.id === row.id);

          if (row.deleted_at) {
            if (localIdx !== -1) {
              const localItem = nextCards[localIdx];
              const remoteRowWithDeletedAt = {
                ...remoteItem,
                updatedAt: row.deleted_at
              };
              const { source } = resolveConflict(localItem, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextCards = nextCards.filter(c => c.id !== row.id);
                updated = true;
              } else {
                this.enqueueMutation({
                  userId,
                  table: 'credit_cards',
                  action: 'UPSERT',
                  recordId: localItem.id,
                  payload: creditCardToRow({ ...localItem, deletedAt: undefined }, userId),
                  timestamp: localItem.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (localIdx === -1) {
              nextCards.push(remoteItem);
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextCards[localIdx], remoteItem);
              if (source === 'remote') {
                nextCards[localIdx] = winner;
                updated = true;
              }
            }
          }
        });

        // Merge Settings
        let nextSettings = localSnapshot.settings;
        if (pulledSettings) {
          const remoteSettings = rowToUserSettings(pulledSettings);
          if (pulledSettings.deleted_at) {
            if (nextSettings) {
              const remoteRowWithDeletedAt = { ...remoteSettings, updatedAt: pulledSettings.deleted_at };
              const { source } = resolveConflict(nextSettings, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextSettings = undefined;
                updated = true;
              } else {
                this.enqueueMutation({
                  userId,
                  table: 'user_settings',
                  action: 'UPSERT',
                  recordId: 'singleton',
                  payload: userSettingsToRow({ ...nextSettings, deletedAt: undefined }, userId),
                  timestamp: nextSettings.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (!nextSettings) {
              nextSettings = remoteSettings;
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextSettings, remoteSettings);
              if (source === 'remote') {
                nextSettings = winner;
                updated = true;
              }
            }
          }
        }

        // Merge Salary Info
        let nextSalary = localSnapshot.salaryInfo;
        if (pulledSalary) {
          const remoteSalary = rowToSalaryInfo(pulledSalary);
          if (pulledSalary.deleted_at) {
            if (nextSalary) {
              const remoteRowWithDeletedAt = { ...remoteSalary, updatedAt: pulledSalary.deleted_at };
              const { source } = resolveConflict(nextSalary, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextSalary = undefined;
                updated = true;
              } else {
                this.enqueueMutation({
                  userId,
                  table: 'salary_info',
                  action: 'UPSERT',
                  recordId: 'singleton',
                  payload: salaryInfoToRow({ ...nextSalary, deletedAt: undefined }, userId),
                  timestamp: nextSalary.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (!nextSalary) {
              nextSalary = remoteSalary;
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextSalary, remoteSalary);
              if (source === 'remote') {
                nextSalary = winner;
                updated = true;
              }
            }
          }
        }

        // Merge Initial Balance
        let nextBalance = localSnapshot.initialBalance;
        if (pulledBalance) {
          const remoteBalance = rowToInitialBalance(pulledBalance);
          if (pulledBalance.deleted_at) {
            if (nextBalance) {
              const remoteRowWithDeletedAt = { ...remoteBalance, updatedAt: pulledBalance.deleted_at };
              const { source } = resolveConflict(nextBalance, remoteRowWithDeletedAt);
              if (source === 'remote') {
                nextBalance = undefined;
                updated = true;
              } else {
                this.enqueueMutation({
                  userId,
                  table: 'initial_balances',
                  action: 'UPSERT',
                  recordId: 'singleton',
                  payload: initialBalanceToRow({ ...nextBalance, deletedAt: undefined }, userId),
                  timestamp: nextBalance.updatedAt || new Date().toISOString()
                });
              }
            }
          } else {
            if (!nextBalance) {
              nextBalance = remoteBalance;
              updated = true;
            } else {
              const { winner, source } = resolveConflict(nextBalance, remoteBalance);
              if (source === 'remote') {
                nextBalance = winner;
                updated = true;
              }
            }
          }
        }

        if (updated) {
          const defaultSettings: UserSettings = {
            currency: 'BRL',
            userName: 'Usuário Drachma',
            userPhoto: '',
            theme: 'light',
            savingsTarget: 20
          };
          const defaultSalary: SalaryInfo = { gross: 0, discounts: [] };
          const defaultBalance: InitialBalance = { amount: 0, date: new Date().toISOString().slice(0, 10) };
          const defaultDateRange: DateRange = {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
            end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
          };

          const mergedSnapshot: AppStateSnapshot = {
            version: 2,
            transactions: nextTxs,
            subscriptions: nextSubs,
            cards: nextCards,
            settings: nextSettings || localSnapshot.settings || defaultSettings,
            salaryInfo: nextSalary || localSnapshot.salaryInfo || defaultSalary,
            initialBalance: nextBalance || localSnapshot.initialBalance || defaultBalance,
            dateRange: localSnapshot.dateRange || defaultDateRange
          };
          writeSnapshot(mergedSnapshot);
          this.notifyRemoteUpdate(mergedSnapshot);
        }
      }

      // 4. Marca sucesso do sync
      const syncDate = new Date();
      this.lastSynced = syncDate;
      localStorage.setItem(getLastSyncKey(userId), syncDate.toISOString());
    } catch (err: any) {
      this.syncError = err instanceof Error ? err : new Error(String(err));
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }
  }
}

// Instância singleton global do SyncEngine
export const syncEngine = new SyncEngine();
