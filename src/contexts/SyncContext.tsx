import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { syncEngine, SyncEngineStatus } from '../data';

export interface SyncContextType {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncError: Error | null;
  syncNow: () => Promise<void>;
  pendingMutationsCount: number;
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncEngineStatus>(() => syncEngine.getStatus());

  useEffect(() => {
    syncEngine.setUserId(isAuthenticated && user ? user.id : null);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    return syncEngine.subscribeStatus(setStatus);
  }, []);

  const syncNow = async () => {
    await syncEngine.sync();
  };

  return (
    <SyncContext.Provider
      value={{
        isSyncing: status.isSyncing,
        lastSynced: status.lastSynced,
        syncError: status.syncError,
        pendingMutationsCount: status.pendingMutationsCount,
        isOnline: status.isOnline,
        syncNow
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
