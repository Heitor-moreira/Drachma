/**
 * DataRepository — contrato de acesso a dados do Drachma.
 *
 * Interface independente de backend: a implementação concreta pode ser
 * LocalStorage, IndexedDB, Supabase ou qualquer outro. Componentes e
 * hooks consomem apenas este contrato, nunca o mecanismo de persistência.
 *
 * Fase 3 do plano de login — camada de acesso a dados.
 */

import type { AppStateSnapshot, DataEvent } from '../utils/appStorage';

// ---------------------------------------------------------------------------
// Resultado de leitura
// ---------------------------------------------------------------------------

/** O snapshot pode voltar parcial quando não houver dados gravados. */
export type ReadResult = Partial<AppStateSnapshot> | undefined;

// ---------------------------------------------------------------------------
// Contrato principal
// ---------------------------------------------------------------------------

export interface DataRepository {
  /** Lê o snapshot completo (ou parcial) do armazenamento. */
  read(): ReadResult;

  /** Grava o snapshot no armazenamento. */
  write(state: Omit<AppStateSnapshot, 'version'>): void;

  /**
   * Lê uma chave JSON arbitrária (usada para chaves legadas durante
   * a migração). Implementações que não possuem chaves avulsas podem
   * retornar `undefined`.
   */
  readLegacyKey(key: string): unknown;

  /**
   * Remove uma chave individual do armazenamento.
   * Usada durante a limpeza de dados legados.
   */
  removeLegacyKey(key: string): void;
}
