# Convenções de código do Drachma

## Princípios

- preservar comportamento observável durante refatorações;
- preferir mudanças pequenas, coesas e verificáveis;
- remover código somente após confirmar ausência de importadores, chamadas e uso dinâmico;
- evitar duplicar regras; cada contrato deve ter uma única fonte de verdade;
- não introduzir dependências para resolver problemas já cobertos pela base atual.

## Arquitetura atual

- `App.tsx` é a raiz de composição, estado e navegação;
- `appStorage.ts` define o snapshot persistido e sua normalização;
- `hooks/useAppPersistence.ts` controla leitura, escrita automática, salvamento manual e estado `isDirty`;
- `finance.ts` concentra classificação, normalização, serialização, datas, recorrências e projeções;
- `types.ts` contém os contratos compartilhados;
- componentes de tela ficam em `components/` e funções de domínio testáveis permanecem fora do JSX quando possível.

## Finanças

- `EntryType` é a classificação canônica: `INCOME`, `EXPENSE`, `SAVINGS` ou `CARD`;
- usar `getTransactionEntryType` para interpretar lançamentos;
- usar `projectTransactions` para ocorrências recorrentes projetadas;
- recorrência e parcelamento são conceitos distintos;
- datas locais devem usar os utilitários existentes, evitando conversões UTC acidentais;
- compatibilidade de importação não autoriza novo código a gravar campos legados.

## Estado e dados

- não recarregar a aplicação enquanto `isDirty` estiver verdadeiro;
- diferenciar salvamento manual de automático;
- validar dados externos antes de incorporá-los ao estado;
- nunca incluir segredos, chaves administrativas ou dados reais em código, fixtures ou bundles.

## Testes

- funções de domínio novas ou alteradas devem possuir testes focados;
- testes devem cobrir resultado financeiro, limites e casos inválidos, não apenas renderização;
- preservar fixtures e backups não relacionados ao escopo.
