/**
 * LocalStorageRepository — implementação concreta do DataRepository
 * usando localStorage (o mecanismo atual do Drachma).
 *
 * Encapsula toda a leitura e escrita em localStorage, incluindo as
 * chaves legadas. Nenhum outro módulo deve acessar localStorage para
 * dados financeiros diretamente.
 */

import type { DataRepository, ReadResult } from './repository';
import type { AppStateSnapshot } from '../utils/appStorage';
import { readSnapshot, writeSnapshot, readJson } from '../utils/appStorage';

export class LocalStorageRepository implements DataRepository {
  read(): ReadResult {
    return readSnapshot();
  }

  write(state: Omit<AppStateSnapshot, 'version'>): void {
    writeSnapshot(state);
  }

  readLegacyKey(key: string): unknown {
    return readJson(key);
  }

  removeLegacyKey(key: string): void {
    localStorage.removeItem(key);
  }
}
