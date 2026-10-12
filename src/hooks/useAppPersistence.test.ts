// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppPersistence, AppPersistenceState, AppPersistenceSetters } from './useAppPersistence';
import { syncEngine } from '../data/syncEngine';
import type { DataRepository } from '../data/repository';

describe('useAppPersistence', () => {
  let mockRepo: DataRepository;
  let mockState: AppPersistenceState;
  let mockSetters: AppPersistenceSetters;

  beforeEach(() => {
    mockRepo = {
      read: vi.fn().mockReturnValue(undefined),
      write: vi.fn(),
      readLegacyKey: vi.fn().mockReturnValue(undefined),
      removeLegacyKey: vi.fn(),
    };

    mockState = {
      transactions: [],
      subscriptions: [],
      cards: [],
      initialBalance: { amount: 0, date: '2026-10-01' },
      salaryInfo: { gross: 0, discounts: [] },
      dateRange: { start: '2026-10-01', end: '2026-10-31' },
      settings: {
        currency: 'BRL',
        userName: 'Test User',
        userPhoto: '',
        theme: 'light',
        savingsTarget: 20,
      },
    };

    mockSetters = {
      setTransactions: vi.fn(),
      setSubscriptions: vi.fn(),
      setInitialBalance: vi.fn(),
      setSalaryInfo: vi.fn(),
      setDateRange: vi.fn(),
      setSettings: vi.fn(),
      setCards: vi.fn(),
    };
  });

  it('saveNow is async, calls syncEngine.sync() and handles sync errors', async () => {
    vi.spyOn(syncEngine, 'getUserId').mockReturnValue('user-save-test');
    vi.spyOn(syncEngine, 'isOnline').mockReturnValue(true);
    const syncSpy = vi.spyOn(syncEngine, 'sync').mockResolvedValue(undefined);
    vi.spyOn(syncEngine, 'getStatus').mockReturnValue({
      isSyncing: false,
      lastSynced: new Date(),
      syncError: null,
      pendingMutationsCount: 0,
      isOnline: true,
    });

    const { result } = renderHook(() =>
      useAppPersistence(mockRepo, mockState, mockSetters)
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockRepo.write).toHaveBeenCalled();
    expect(syncSpy).toHaveBeenCalled();
  });

  it('saveNow throws when syncEngine reports a syncError', async () => {
    vi.spyOn(syncEngine, 'getUserId').mockReturnValue('user-save-err');
    vi.spyOn(syncEngine, 'isOnline').mockReturnValue(true);
    vi.spyOn(syncEngine, 'sync').mockResolvedValue(undefined);
    const syncErr = new Error('Sync failed due to server error');
    vi.spyOn(syncEngine, 'getStatus').mockReturnValue({
      isSyncing: false,
      lastSynced: null,
      syncError: syncErr,
      pendingMutationsCount: 1,
      isOnline: true,
    });

    const { result } = renderHook(() =>
      useAppPersistence(mockRepo, mockState, mockSetters)
    );

    await expect(result.current.saveNow()).rejects.toThrow('Sync failed due to server error');
  });

  it('updates base on remote update so subsequent local edits are diffed accurately', async () => {
    const enqueueSpy = vi.spyOn(syncEngine, 'enqueueStateDiff');
    vi.spyOn(syncEngine, 'getUserId').mockReturnValue('user-remote-upd');

    const { result, rerender } = renderHook(
      ({ state }) => useAppPersistence(mockRepo, state, mockSetters),
      { initialProps: { state: mockState } }
    );

    // Simulate remote update notification
    const remoteTx = {
      id: 'tx-remote-1',
      description: 'Remoto',
      amount: 50,
      entryType: 'EXPENSE' as const,
      date: '2026-10-01',
      comment: '',
    };

    act(() => {
      // Trigger remote update listener
      (syncEngine as any).notifyRemoteUpdate({
        transactions: [remoteTx],
      });
    });

    expect(mockSetters.setTransactions).toHaveBeenCalledWith([remoteTx]);

    // Now simulate local state updating to include remoteTx + a local edit
    const localNewTx = {
      id: 'tx-local-user',
      description: 'Criado pelo usuário',
      amount: 99,
      entryType: 'EXPENSE' as const,
      date: '2026-10-01',
      comment: '',
    };
    const newStateWithUserEdit = {
      ...mockState,
      transactions: [remoteTx, localNewTx],
    };

    rerender({ state: newStateWithUserEdit });

    // Wait for the debounced persistence (150ms)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // enqueueStateDiff should have been called comparing remote base against newStateWithUserEdit
    expect(enqueueSpy).toHaveBeenCalled();
  });
});
