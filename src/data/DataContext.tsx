/**
 * DataContext — injeta o DataRepository em toda a árvore React.
 *
 * O provider padrão usa LocalStorageRepository.
 * Para testes ou quando o Supabase entrar, basta trocar a instância
 * passada no `value` sem mexer em nenhum componente.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { DataRepository } from './repository';
import { LocalStorageRepository } from './localStorageRepository';

const DataContext = createContext<DataRepository | null>(null);

interface DataProviderProps {
  /** Repositório customizado. Se omitido, usa LocalStorageRepository. */
  repository?: DataRepository;
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ repository, children }) => {
  const repo = useMemo(
    () => repository ?? new LocalStorageRepository(),
    [repository]
  );
  return <DataContext.Provider value={repo}>{children}</DataContext.Provider>;
};

/**
 * Hook para acessar o DataRepository.
 * Lança erro se chamado fora do DataProvider (bug de configuração).
 */
export const useDataRepository = (): DataRepository => {
  const repo = useContext(DataContext);
  if (!repo) {
    throw new Error('useDataRepository deve ser usado dentro de <DataProvider>.');
  }
  return repo;
};
