import React, { createContext, useContext, useState } from 'react';

interface SyncContextType {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncError: Error | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const syncNow = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // Mock sync logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSynced(new Date());
    } catch (error) {
      setSyncError(error as Error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isSyncing, lastSynced, syncError, syncNow }}>
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
