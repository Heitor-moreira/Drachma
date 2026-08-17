# Transactions Schema

Inventário do schema vivo de `transactions` dentro do app. Baseado no uso real do código, não apenas no backup exportado.

## Campos ativos

| Campo | Uso atual | Obrigatório | Estado | Compatibilidade |
| --- | --- | --- | --- | --- |
| `id` | Chave de identidade em edição, exclusão, agrupamento e projeção | Sim | Ativo | Necessário para qualquer lançamento persistido |
| `date` | Data principal usada em listas, horizonte e saldo | Sim | Ativo | Formato `YYYY-MM-DD` |
| `description` | Texto exibido em listas, filtros e importação | Sim | Ativo | Pode vir vazio em alguns fluxos legados, mas a UI assume preenchimento |
| `amount` | Valor monetário para totais e saldo | Sim | Ativo | Sempre numérico |
| `type` | Define entrada ou saída e impacta saldo | Sim | Ativo | `INCOME` ou `EXPENSE` |
| `category` | Classificação visual e analítica | Sim | Ativo | Usada em resumo, listagem e importação |
| `comment` | Campo de busca, exibição e observação livre | Sim no tipo | Ativo | O app assume string; lançamento manual normalmente grava `''` |
| `tags` | Lista usada para sugestão e filtro indireto | Não | Ativo | Opcional; pode faltar sem quebrar a UI |
| `financialGroup` | Classificação lógica para receitas, despesas e reserva | Não | Ativo | Importa na leitura, mas não é suficiente para cartão |
| `paymentMethod` | Diferencia cartão de crédito/débito e afeta leitura visual | Não | Ativo | `CREDIT_CARD` é o caso especial mais relevante |
| `cardId` | Vincula lançamento ao cartão cadastrado | Não | Ativo | Obrigatório na prática quando `paymentMethod === 'CREDIT_CARD'` |
| `purchaseDate` | Base de cálculo para impacto de crédito e projeções | Não | Ativo | Usado em lançamentos de cartão e recorrência projetada |
| `dueDate` | Override do vencimento para cartão | Não | Legado/ativo | Existe no tipo, mas o fluxo atual tende a calcular a partir do cartão |
| `isFixed` | Marca recorrência mensal/fixa | Não | Ativo | Usado por projeção e gerenciadores de recorrência |
| `isInstallment` | Marca parcelamento | Não | Ativo | Usado por gerenciadores e UI de parcelamento |
| `installmentInfo` | Metadados da parcela corrente e total | Não | Ativo | Necessário para rastrear grupos parcelados |
| `batchId` | Agrupa itens importados por planilha | Não | Ativo | Gerado na importação estruturada |
| `batchName` | Nome legível do lote importado | Não | Ativo | Ajuda na gestão de planilhas |
| `importDate` | Data do lote importado | Não | Ativo | Serve para ordenação e auditoria |

## Regras reais do app

- `INCOME` tende a usar `financialGroup: PERSONAL_INCOME`
- `EXPENSE` tende a usar `financialGroup: PERSONAL_EXPENSE`
- `SAVINGS` é tratado como despesa com `financialGroup: SAVINGS`
- `CARD` não é um `financialGroup` real; é identificado por `paymentMethod: CREDIT_CARD` e `cardId`
- `category === RESERVE` força leitura como reserva

## Campos legados ou frágeis

- `dueDate` existe, mas a lógica principal do cartão prefere o vencimento do cadastro do cartão
- `financialGroup` não cobre o caso especial de cartão sozinho
- `type` ainda é a chave mais usada para saldo e listagem, então não pode ser removido sem migração
- `comment` é tratado como sempre presente na interface, embora o tipo permita que seja omitido na origem importada

## Observação de backup

O backup exportado hoje é mais amplo que a leitura mínima da importação. A importação aceita `transactions` como array e preserva os demais blocos se existirem, mas não valida profundamente a estrutura interna de cada transação.
