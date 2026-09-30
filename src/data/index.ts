/**
 * Barrel export da camada de dados.
 */
export type { DataRepository, ReadResult } from './repository';
export { LocalStorageRepository } from './localStorageRepository';
export { DataProvider, useDataRepository } from './DataContext';
