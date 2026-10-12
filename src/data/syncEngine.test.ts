// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  transactionToRow,
  rowToTransaction,
  subscriptionToRow,
  rowToSubscription,
  creditCardToRow,
  rowToCreditCard,
  userSettingsToRow,
  rowToUserSettings,
  salaryInfoToRow,
  rowToSalaryInfo,
  initialBalanceToRow,
  rowToInitialBalance,
  resolveConflict,
  mergeOnFirstSync,
  SyncEngine
} from './syncEngine';
import { Transaction, Subscription, CreditCard, UserSettings, SalaryInfo, InitialBalance } from '../types';
import { readSnapshot, writeSnapshot } from '../utils/appStorage';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

describe('SyncEngine Mappers', () => {
  const userId = 'user-test-123';

  it('correctly maps Transaction to DB row and back', () => {
    const tx: Transaction = {
      id: 'tx-1',
      date: '2026-10-15',
      description: 'Supermercado Mensal',
      amount: 450.50,
      entryType: 'EXPENSE',
      tags: ['mercado', 'casa'],
      comment: 'Compras do mês',
      isFixed: true,
      recurrenceFrequency: 'MONTHLY',
      recurrenceEndMode: 'COUNT',
      recurrenceCount: 12,
      recurrenceExcludedDates: ['2026-12-15'],
      isInstallment: true,
      installmentInfo: { current: 1, total: 3, purchaseId: 'p-1' },
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-11T12:00:00Z',
      subscriptionId: 'sub-netflix',
      cardId: 'card-nubank',
      userId
    };

    const row = transactionToRow(tx, userId);
    expect(row.id).toBe('tx-1');
    expect(row.user_id).toBe(userId);
    expect(row.entry_type).toBe('EXPENSE');
    expect(row.tags).toEqual(['mercado', 'casa']);
    expect(row.subscription_id).toBe('sub-netflix');
    expect(row.card_id).toBe('card-nubank');

    const mappedBack = rowToTransaction(row);
    expect(mappedBack.id).toBe(tx.id);
    expect(mappedBack.description).toBe(tx.description);
    expect(mappedBack.amount).toBe(tx.amount);
    expect(mappedBack.entryType).toBe(tx.entryType);
    expect(mappedBack.tags).toEqual(tx.tags);
    expect(mappedBack.installmentInfo).toEqual(tx.installmentInfo);
    expect(mappedBack.subscriptionId).toBe('sub-netflix');
    expect(mappedBack.cardId).toBe('card-nubank');
  });

  it('correctly maps Subscription to DB row and back', () => {
    const sub: Subscription = {
      id: 'sub-spotify',
      name: 'Spotify Premium',
      amount: 34.90,
      dueDay: 5,
      cycle: 'MONTHLY',
      paymentType: 'CREDIT_CARD',
      cardId: 'card-1',
      status: 'ACTIVE',
      isActive: true,
      category: 'Lazer',
      serviceKey: 'spotify',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      userId
    };

    const row = subscriptionToRow(sub, userId);
    expect(row.id).toBe('sub-spotify');
    expect(row.due_day).toBe(5);
    expect(row.cycle).toBe('MONTHLY');
    expect(row.payment_type).toBe('CREDIT_CARD');
    expect(row.card_id).toBe('card-1');
    expect(row.status).toBe('ACTIVE');

    const mappedBack = rowToSubscription(row);
    expect(mappedBack.id).toBe(sub.id);
    expect(mappedBack.name).toBe(sub.name);
    expect(mappedBack.amount).toBe(sub.amount);
    expect(mappedBack.dueDay).toBe(5);
    expect(mappedBack.paymentType).toBe('CREDIT_CARD');
    expect(mappedBack.status).toBe('ACTIVE');
  });

  it('correctly maps CreditCard to DB row and back', () => {
    const card: CreditCard = {
      id: 'card-master',
      name: 'Black Card',
      bank: 'Inter',
      type: 'CREDIT',
      brand: 'Mastercard',
      lastFour: '4321',
      color: '#000000',
      limit: 15000,
      closingDay: 20,
      dueDay: 28,
      isActive: true,
      userId
    };

    const row = creditCardToRow(card, userId);
    expect(row.id).toBe('card-master');
    expect(row.closing_day).toBe(20);
    expect(row.due_day).toBe(28);
    expect(row.last_four).toBe('4321');

    const mappedBack = rowToCreditCard(row);
    expect(mappedBack.id).toBe(card.id);
    expect(mappedBack.name).toBe(card.name);
    expect(mappedBack.limit).toBe(15000);
    expect(mappedBack.closingDay).toBe(20);
    expect(mappedBack.dueDay).toBe(28);
  });

  it('correctly maps UserSettings to DB row and back', () => {
    const settings: UserSettings = {
      currency: 'BRL',
      userName: 'Carlos Silva',
      userPhoto: 'https://avatar.png',
      theme: 'claude',
      savingsTarget: 30,
      baseSalary: 7500,
      userId
    };

    const row = userSettingsToRow(settings, userId);
    expect(row.user_id).toBe(userId);
    expect(row.savings_target).toBe(30);
    expect(row.base_salary).toBe(7500);
    expect(row.theme).toBe('claude');

    const mappedBack = rowToUserSettings(row);
    expect(mappedBack.userName).toBe('Carlos Silva');
    expect(mappedBack.savingsTarget).toBe(30);
    expect(mappedBack.baseSalary).toBe(7500);
    expect(mappedBack.theme).toBe('claude');
  });

  it('correctly maps SalaryInfo to DB row and back', () => {
    const salary: SalaryInfo = {
      gross: 10000,
      discounts: [
        { id: 'd-1', name: 'INSS', amount: 11, type: 'PERCENT' },
        { id: 'd-2', name: 'VR', amount: 250, type: 'VALUE' }
      ],
      userId
    };

    const row = salaryInfoToRow(salary, userId);
    expect(row.gross).toBe(10000);
    expect(row.discounts).toEqual(salary.discounts);

    const mappedBack = rowToSalaryInfo(row);
    expect(mappedBack.gross).toBe(10000);
    expect(mappedBack.discounts).toEqual(salary.discounts);
  });

  it('correctly maps InitialBalance to DB row and back', () => {
    const balance: InitialBalance = {
      amount: 5200.75,
      date: '2026-01-01',
      userId
    };

    const row = initialBalanceToRow(balance, userId);
    expect(row.amount).toBe(5200.75);
    expect(row.date).toBe('2026-01-01');

    const mappedBack = rowToInitialBalance(row);
    expect(mappedBack.amount).toBe(5200.75);
    expect(mappedBack.date).toBe('2026-01-01');
  });
});

describe('Conflict Resolution (Last-Write-Wins)', () => {
  it('selects remote when remote updatedAt is newer than local', () => {
    const local = { id: '1', amount: 100, updatedAt: '2026-10-10T10:00:00Z' };
    const remote = { id: '1', amount: 200, updatedAt: '2026-10-10T11:00:00Z' };

    const result = resolveConflict(local, remote);
    expect(result.winner).toEqual(remote);
    expect(result.source).toBe('remote');
  });

  it('selects local when local updatedAt is newer than remote', () => {
    const local = { id: '1', amount: 300, updatedAt: '2026-10-10T12:00:00Z' };
    const remote = { id: '1', amount: 200, updatedAt: '2026-10-10T11:00:00Z' };

    const result = resolveConflict(local, remote);
    expect(result.winner).toEqual(local);
    expect(result.source).toBe('local');
  });

  it('selects remote on equal timestamps for deterministic resolution', () => {
    const local = { id: '1', amount: 100, updatedAt: '2026-10-10T10:00:00Z' };
    const remote = { id: '1', amount: 200, updatedAt: '2026-10-10T10:00:00Z' };

    const result = resolveConflict(local, remote);
    expect(result.winner).toEqual(remote);
    expect(result.source).toBe('remote');
  });
});

describe('mergeOnFirstSync', () => {
  const userId = 'user-first-sync';

  it('merges local and remote collections without duplicate ids and pushes local-only or local-winning items', () => {
    const local = {
      transactions: [
        { id: 'tx-shared', description: 'Local Version', amount: 100, entryType: 'EXPENSE', comment: '', date: '2026-10-01', updatedAt: '2026-10-02T10:00:00Z' },
        { id: 'tx-local-only', description: 'Local Only', amount: 50, entryType: 'EXPENSE', comment: '', date: '2026-10-01', updatedAt: '2026-10-01T10:00:00Z' }
      ] as Transaction[],
      subscriptions: [] as Subscription[],
      cards: [] as CreditCard[]
    };

    const remote = {
      transactions: [
        { id: 'tx-shared', description: 'Remote Older', amount: 90, entryType: 'EXPENSE', comment: '', date: '2026-10-01', updatedAt: '2026-10-01T10:00:00Z' },
        { id: 'tx-remote-only', description: 'Remote Only', amount: 75, entryType: 'INCOME', comment: '', date: '2026-10-01', updatedAt: '2026-10-01T10:00:00Z' }
      ] as Transaction[],
      subscriptions: [] as Subscription[],
      cards: [] as CreditCard[]
    };

    const { merged, mutationsToPush } = mergeOnFirstSync(local, remote, userId);

    expect(merged.transactions).toHaveLength(3);
    const sharedTx = merged.transactions?.find(t => t.id === 'tx-shared');
    expect(sharedTx?.description).toBe('Local Version'); // Local was newer

    // Should push tx-shared (local won) and tx-local-only (local only)
    expect(mutationsToPush).toHaveLength(2);
    expect(mutationsToPush.some(m => m.recordId === 'tx-shared')).toBe(true);
    expect(mutationsToPush.some(m => m.recordId === 'tx-local-only')).toBe(true);
  });
});

describe('SyncEngine Offline Queue & Diffing', () => {
  let engine: SyncEngine;
  const userId = 'user-queue-test';

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => {
      const builder: any = {
        select: vi.fn(() => builder),
        update: vi.fn(() => builder),
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        eq: vi.fn(() => builder),
        gt: vi.fn(() => builder),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return builder;
    });

    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => { store.set(key, String(val)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; }
    };
    vi.stubGlobal('localStorage', mockStorage);
    engine = new SyncEngine();
  });

  it('enqueues mutations and coalesces subsequent mutations for the same record', () => {
    engine.enqueueMutation({
      userId,
      table: 'transactions',
      action: 'UPSERT',
      recordId: 'tx-1',
      payload: { id: 'tx-1', amount: 100 },
      timestamp: '2026-10-10T10:00:00Z'
    });

    let queue = engine.getQueue(userId);
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.amount).toBe(100);

    // Update the same record: should coalesce to 1 mutation with new payload
    engine.enqueueMutation({
      userId,
      table: 'transactions',
      action: 'UPSERT',
      recordId: 'tx-1',
      payload: { id: 'tx-1', amount: 250 },
      timestamp: '2026-10-10T10:05:00Z'
    });

    queue = engine.getQueue(userId);
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.amount).toBe(250);

    // Delete the same record: replaces UPSERT with DELETE
    engine.enqueueMutation({
      userId,
      table: 'transactions',
      action: 'DELETE',
      recordId: 'tx-1',
      payload: null,
      timestamp: '2026-10-10T10:10:00Z'
    });

    queue = engine.getQueue(userId);
    expect(queue).toHaveLength(1);
    expect(queue[0].action).toBe('DELETE');
  });

  it('detects diffs and enqueues added, modified, and deleted records', () => {
    const prevState = {
      transactions: [
        { id: 't-1', description: 'Original', amount: 10, entryType: 'EXPENSE', comment: '', date: '2026-10-01' },
        { id: 't-2', description: 'To delete', amount: 20, entryType: 'EXPENSE', comment: '', date: '2026-10-01' }
      ] as Transaction[],
      subscriptions: [] as Subscription[],
      cards: [] as CreditCard[]
    };

    const currState = {
      transactions: [
        { id: 't-1', description: 'Modified', amount: 15, entryType: 'EXPENSE', comment: '', date: '2026-10-01' },
        { id: 't-3', description: 'Newly added', amount: 30, entryType: 'INCOME', comment: '', date: '2026-10-01' }
      ] as Transaction[],
      subscriptions: [] as Subscription[],
      cards: [] as CreditCard[]
    };

    engine.enqueueStateDiff(prevState, currState, userId);

    const queue = engine.getQueue(userId);
    // Should have: modified t-1, deleted t-2, added t-3
    expect(queue).toHaveLength(3);

    const t1 = queue.find(m => m.recordId === 't-1');
    const t2 = queue.find(m => m.recordId === 't-2');
    const t3 = queue.find(m => m.recordId === 't-3');

    expect(t1?.action).toBe('UPSERT');
    expect(t1?.payload.description).toBe('Modified');
    expect(t2?.action).toBe('DELETE');
    expect(t3?.action).toBe('UPSERT');
    expect(t3?.payload.description).toBe('Newly added');
  });
});

describe('First Sync Merge with deleted_at (Item 3)', () => {
  const userId = 'user-merge-del';

  it('correctly applies LWW when records are deleted on one side and active on the other', () => {
    const local = {
      transactions: [
        // 1. Local active (12:00) vs Remote delete (11:00) -> Local active wins, emit UPSERT
        {
          id: 'tx-resurrect',
          description: 'Local Edit Newer',
          amount: 100,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          updatedAt: '2026-10-10T12:00:00Z',
        },
        // 2. Local active (09:00) vs Remote delete (11:00) -> Remote delete wins, omitted from merged
        {
          id: 'tx-remote-del-wins',
          description: 'Local Older',
          amount: 50,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          updatedAt: '2026-10-10T09:00:00Z',
        },
        // 3. Local delete (12:00) vs Remote active (09:00) -> Local delete wins, emit DELETE
        {
          id: 'tx-local-del-wins',
          description: 'Local Deleted',
          amount: 80,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          deletedAt: '2026-10-10T12:00:00Z',
        },
        // 4. Local delete (08:00) vs Remote active (10:00) -> Remote active wins, included in merged
        {
          id: 'tx-remote-active-wins',
          description: 'Local Old Deleted',
          amount: 40,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          deletedAt: '2026-10-10T08:00:00Z',
        },
      ],
      subscriptions: [],
      cards: [],
      settings: {
        currency: 'BRL' as const,
        userName: 'Local Active Settings',
        userPhoto: '',
        theme: 'light' as const,
        savingsTarget: 20,
        updatedAt: '2026-10-10T12:00:00Z',
      },
    };

    const remote = {
      transactions: [
        {
          id: 'tx-resurrect',
          description: 'Remote Deleted',
          amount: 100,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          deletedAt: '2026-10-10T11:00:00Z',
        },
        {
          id: 'tx-remote-del-wins',
          description: 'Remote Deleted',
          amount: 50,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          deletedAt: '2026-10-10T11:00:00Z',
        },
        {
          id: 'tx-local-del-wins',
          description: 'Remote Active',
          amount: 80,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          updatedAt: '2026-10-10T09:00:00Z',
        },
        {
          id: 'tx-remote-active-wins',
          description: 'Remote Active Newer',
          amount: 40,
          entryType: 'EXPENSE' as const,
          comment: '',
          date: '2026-10-01',
          updatedAt: '2026-10-10T10:00:00Z',
        },
      ],
      subscriptions: [],
      cards: [],
      settings: {
        currency: 'BRL' as const,
        userName: 'Remote Deleted Settings',
        userPhoto: '',
        theme: 'light' as const,
        savingsTarget: 20,
        deletedAt: '2026-10-10T11:00:00Z',
      },
    };

    const { merged, mutationsToPush } = mergeOnFirstSync(local, remote, userId);

    const mergedTxIds = (merged.transactions || []).map((t) => t.id);
    expect(mergedTxIds).toContain('tx-resurrect');
    expect(mergedTxIds).toContain('tx-remote-active-wins');
    expect(mergedTxIds).not.toContain('tx-remote-del-wins');
    expect(mergedTxIds).not.toContain('tx-local-del-wins');

    // tx-resurrect had local edit newer -> must emit UPSERT
    const resurrectMut = mutationsToPush.find((m) => m.recordId === 'tx-resurrect');
    expect(resurrectMut).toBeDefined();
    expect(resurrectMut?.action).toBe('UPSERT');

    // tx-local-del-wins had local delete newer than remote active -> must emit DELETE
    const deleteMut = mutationsToPush.find((m) => m.recordId === 'tx-local-del-wins');
    expect(deleteMut).toBeDefined();
    expect(deleteMut?.action).toBe('DELETE');

    // Settings: local active (12:00) > remote delete (11:00) -> active and UPSERT
    expect(merged.settings?.userName).toBe('Local Active Settings');
    const settingsMut = mutationsToPush.find((m) => m.table === 'user_settings');
    expect(settingsMut).toBeDefined();
    expect(settingsMut?.action).toBe('UPSERT');
  });
});

describe('Flush DELETE Singleton (Item 2)', () => {
  const userId = 'user-singleton-del';
  let engine: SyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => { store.set(key, String(val)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; }
    };
    vi.stubGlobal('localStorage', mockStorage);
    engine = new SyncEngine();
  });

  it('filters by user_id and NOT id=singleton when flushing DELETE for singletons', async () => {
    const updateSpy = vi.fn();
    const eqSpy = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      const builder: any = {
        update: vi.fn((payload) => {
          updateSpy(table, payload);
          return builder;
        }),
        eq: vi.fn((col, val) => {
          eqSpy(table, col, val);
          return builder;
        }),
        select: vi.fn(() => builder),
        gt: vi.fn(() => builder),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return builder;
    });

    localStorage.setItem(`drachma_first_sync_done_${userId}`, 'true');

    // Enqueue singleton DELETE on user_settings, salary_info, initial_balances
    engine.enqueueMutation({
      userId,
      table: 'user_settings',
      action: 'DELETE',
      recordId: 'singleton',
      timestamp: '2026-10-10T10:00:00Z',
    });
    engine.enqueueMutation({
      userId,
      table: 'salary_info',
      action: 'DELETE',
      recordId: 'singleton',
      timestamp: '2026-10-10T10:00:00Z',
    });
    engine.enqueueMutation({
      userId,
      table: 'transactions',
      action: 'DELETE',
      recordId: 'tx-reg-1',
      timestamp: '2026-10-10T10:00:00Z',
    });

    engine.setUserId(userId);
    await engine.sync();

    // Verify user_settings
    expect(eqSpy).toHaveBeenCalledWith('user_settings', 'user_id', userId);
    expect(eqSpy).not.toHaveBeenCalledWith('user_settings', 'id', 'singleton');

    // Verify salary_info
    expect(eqSpy).toHaveBeenCalledWith('salary_info', 'user_id', userId);
    expect(eqSpy).not.toHaveBeenCalledWith('salary_info', 'id', 'singleton');

    // Verify regular transaction: must have user_id AND id
    expect(eqSpy).toHaveBeenCalledWith('transactions', 'user_id', userId);
    expect(eqSpy).toHaveBeenCalledWith('transactions', 'id', 'tx-reg-1');
  });
});

describe('Pull DELETE with LWW (Item 1)', () => {
  const userId = 'user-pull-del';
  let engine: SyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => { store.set(key, String(val)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; }
    };
    vi.stubGlobal('localStorage', mockStorage);
    engine = new SyncEngine();
  });

  it('removes local item if remote delete is newer, but preserves local and enqueues UPSERT if local edit is newer', async () => {
    localStorage.setItem(`drachma_first_sync_done_${userId}`, 'true');
    localStorage.setItem(`drachma_last_sync_${userId}`, '2026-10-01T00:00:00Z');

    // Set initial local state
    const initialTxs: Transaction[] = [
      {
        id: 'tx-local-newer',
        description: 'Local Edit Newer',
        amount: 150,
        entryType: 'EXPENSE',
        date: '2026-10-01',
        comment: '',
        updatedAt: '2026-10-10T12:00:00Z', // Local 12:00 > remote delete 11:00
      },
      {
        id: 'tx-remote-del-newer',
        description: 'Local Edit Older',
        amount: 50,
        entryType: 'EXPENSE',
        date: '2026-10-01',
        comment: '',
        updatedAt: '2026-10-10T09:00:00Z', // Local 09:00 < remote delete 11:00
      },
    ];

    writeSnapshot({
      transactions: initialTxs,
      subscriptions: [],
      cards: [],
      dateRange: { start: '2026-10-01', end: '2026-10-31' },
      initialBalance: { amount: 0, date: '2026-10-01' },
      salaryInfo: { gross: 0, discounts: [] },
      settings: { currency: 'BRL', userName: 'User', userPhoto: '', theme: 'light', savingsTarget: 20 },
    });

    mockFrom.mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        gt: vi.fn(() => builder),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: (resolve: any) => {
          if (table === 'transactions') {
            return Promise.resolve({
              data: [
                {
                  id: 'tx-local-newer',
                  user_id: userId,
                  description: 'Local Edit Newer',
                  amount: 150,
                  entry_type: 'EXPENSE',
                  date: '2026-10-01',
                  deleted_at: '2026-10-10T11:00:00Z', // Older than local edit (12:00)
                },
                {
                  id: 'tx-remote-del-newer',
                  user_id: userId,
                  description: 'Local Edit Older',
                  amount: 50,
                  entry_type: 'EXPENSE',
                  date: '2026-10-01',
                  deleted_at: '2026-10-10T11:00:00Z', // Newer than local edit (09:00)
                },
              ],
              error: null,
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return builder;
    });

    engine.setUserId(userId);
    await engine.sync();

    const snapshot = readSnapshot();
    // tx-remote-del-newer must be removed from local snapshot
    expect(snapshot?.transactions?.some((t) => t.id === 'tx-remote-del-newer')).toBe(false);

    // tx-local-newer must be preserved in local snapshot
    expect(snapshot?.transactions?.some((t) => t.id === 'tx-local-newer')).toBe(true);

    // An UPSERT mutation must be enqueued to resurrect tx-local-newer on Supabase
    const queue = engine.getQueue(userId);
    const resurrectMut = queue.find((m) => m.recordId === 'tx-local-newer');
    expect(resurrectMut).toBeDefined();
    expect(resurrectMut?.action).toBe('UPSERT');
  });
});

describe('Partial Failure on First Sync (Item 4)', () => {
  const userId = 'user-first-sync-fail';
  let engine: SyncEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => { store.set(key, String(val)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; }
    };
    vi.stubGlobal('localStorage', mockStorage);
    engine = new SyncEngine();
  });

  it('does NOT set firstSyncDone flag on query failure, but sets it on retry success', async () => {
    writeSnapshot({
      transactions: [
        { id: 'tx-first', description: 'Item 1', amount: 100, entryType: 'EXPENSE', date: '2026-10-01', comment: '' },
      ],
      subscriptions: [],
      cards: [],
      dateRange: { start: '2026-10-01', end: '2026-10-31' },
      initialBalance: { amount: 0, date: '2026-10-01' },
      salaryInfo: { gross: 0, discounts: [] },
      settings: { currency: 'BRL', userName: 'User', userPhoto: '', theme: 'light', savingsTarget: 20 },
    });

    let failQuery = true;

    mockFrom.mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        gt: vi.fn(() => builder),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        upsert: vi.fn(() => {
          if (failQuery && table === 'transactions') {
            return Promise.resolve({ data: null, error: new Error('Postgres connection failed') });
          }
          return Promise.resolve({ data: null, error: null });
        }),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return builder;
    });

    // 1st sync attempt: should fail on transactions upsert
    engine.setUserId(userId);
    await engine.sync();

    // Verify failure: syncError is set, flag is NOT set
    expect(engine.getStatus().syncError).toBeDefined();
    expect(localStorage.getItem(`drachma_first_sync_done_${userId}`)).toBeNull();

    // 2nd sync attempt: network recovered
    failQuery = false;
    await engine.sync();

    // Verify success: syncError cleared, flag IS set
    expect(engine.getStatus().syncError).toBeNull();
    expect(localStorage.getItem(`drachma_first_sync_done_${userId}`)).toBe('true');
  });
});
