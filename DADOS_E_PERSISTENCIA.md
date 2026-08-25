# Dados, persistência e segurança

Fonte de verdade para o contrato vigente de dados do Drachma.

## Armazenamento atual

O app é local-first e persiste um snapshot JSON no `localStorage`:

- chave: `drachma_app_state`;
- versão atual: `2`;
- escrita automática com debounce de `150ms`;
- salvamento manual disponível;
- importação e exportação em JSON;
- leitura compatível com chaves locais antigas para migração.

O `localStorage` não é armazenamento seguro. Dados financeiros e backups ficam em texto e devem ser tratados como sensíveis.

## Snapshot

O contrato `AppStateSnapshot` contém:

- `version`;
- `transactions`;
- `subscriptions`;
- `initialBalance`;
- `salaryInfo`;
- `dateRange`;
- `settings`;
- `cards`;
- `lastDataEvent` opcional.

`lastDataEvent` registra `SAVE`, `IMPORT`, `EXPORT` ou `DELETE`; salvamentos distinguem origem manual e automática.

## Transação canônica

| Campo | Regra vigente |
| --- | --- |
| `id` | identificador obrigatório e estável |
| `date` | data financeira em `YYYY-MM-DD` |
| `createdAt` | instante opcional de criação do registro |
| `description` | descrição do lançamento |
| `amount` | número finito representando valor monetário |
| `entryType` | `INCOME`, `EXPENSE`, `SAVINGS` ou `CARD` |
| `tags` | lista opcional de tags normalizadas |
| `comment` | observação livre, gravada como string |
| `cardId` | vínculo opcional com cartão; necessário para comportamento de cartão |
| `isFixed` | indica recorrência |
| `recurrenceFrequency` | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY` ou `YEARLY` |
| `recurrenceEndMode` | `INFINITE` ou `COUNT` |
| `recurrenceCount` | quantidade quando o término for por contagem |
| `recurrenceExcludedDates` | ocorrências excluídas sem apagar a série-base |
| `isInstallment` | indica compra parcelada |
| `installmentInfo` | parcela atual, total e `purchaseId` |
| `batchId`, `batchName`, `importDate` | metadados opcionais de lote |

`EntryType` é a classificação oficial. Campos antigos podem ser lidos e normalizados para manter importações existentes, mas não devem ser usados em novos fluxos.

## Regras de domínio implementadas

- recorrência não é parcelamento;
- projeções não substituem o registro-base persistido;
- uma exclusão pontual de recorrência usa `recurrenceExcludedDates`;
- cartões nunca devem armazenar número completo, CVV, senha ou credenciais bancárias.

## Importação e exportação

- exportar sempre o snapshot completo e normalizado;
- avisar que o arquivo contém dados financeiros sensíveis;
- importar somente JSON validado;
- não substituir o estado silenciosamente quando o arquivo for inválido;
- preservar backup antes de migrações destrutivas;
- não atualizar ou recarregar a aplicação enquanto houver alterações pendentes (`isDirty`).

## Limites atuais conhecidos

- a validação de importação confirma a estrutura básica e os campos mínimos de transações, mas ainda não valida profundamente todas as coleções;
- datas, limites numéricos, tamanhos de textos, arrays e contagens ainda não possuem validação completa;
- extensões, scripts ou vulnerabilidades na mesma origem podem acessar o `localStorage`;
- backups não possuem criptografia, checksum ou assinatura;
- `settings.userPhoto` deve ser tratado como URL externa não confiável.

Melhorias ainda não implementadas pertencem ao arquivo local `IDEIAS_FUTURAS.md`, não a este contrato.
