# Drachma — Especificação do Produto

## 1. Visão do Produto

O **Drachma** é um aplicativo de gestão de fluxo de caixa pessoal, com interface **mobile-first**, focado em lançamento rápido de receitas e despesas, organização por categorias e múltiplas tags, controle de cartões, análise financeira e dashboards interativos.

O objetivo é permitir que o usuário acompanhe sua movimentação financeira de forma simples, rápida e visual, sem distorcer os dados com entradas ou saídas que não representam receitas ou gastos pessoais reais.

---

## 2. Problema que o Produto Resolve

> **PREENCHER**

Descreva os principais problemas que o Drachma pretende resolver.

Exemplos:

- dificuldade para registrar gastos rapidamente;
- falta de flexibilidade nas categorias;
- relatórios que misturam salário, reembolso e transferências;
- dificuldade para acompanhar cartões, faturas e compras parceladas;
- pouca clareza sobre o destino do dinheiro.

---

## 3. Público-Alvo

> **PREENCHER**

Descreva os principais perfis de usuário do FinanFlow.

Exemplos:

- pessoas que desejam controlar o fluxo de caixa pessoal;
- usuários que preferem registrar movimentações manualmente;
- pessoas que utilizam diferentes cartões e métodos de pagamento;
- usuários que desejam análises por tags personalizadas.

---

## 4. Escopo Inicial

### 4.1 Incluído no MVP

- Cadastro de receitas e despesas.
- Uso de categorias e múltiplas tags por transação.
- Filtros por período, tipo, categoria, tag e método de pagamento.
- Dashboard com resumos e gráficos.
- Cadastro de cartões.
- Vinculação de despesas a cartões.
- Controle básico de parcelas.
- Armazenamento local.
- Importação e exportação de dados.
- Interface mobile-first.
- Instalação como PWA.

### 4.2 Fora do Escopo Inicial

> **PREENCHER**

Exemplos:

- integração automática com bancos;
- sincronização entre dispositivos;
- compartilhamento de contas;
- conciliação bancária;
- acesso por múltiplos usuários;
- inteligência artificial para classificação automática.

---

## 5. Regras de Negócio

### RN-001 — Categorias e tags

Cada transação deve possuir uma categoria principal e pode possuir múltiplas tags.

### RN-002 — Reembolso

Entradas classificadas como **Reembolso** não devem ser consideradas receita recorrente ou renda pessoal normal.

### RN-003 — Adiantamento a terceiros

Saídas classificadas como **Adiantamento a terceiros** não devem ser consideradas gasto pessoal definitivo.

### RN-004 — Tipos de transação

As transações devem ser classificadas inicialmente como:

- receita;
- despesa.

Subtipos ou classificações especiais poderão ser usados para diferenciar salário, reembolso, transferência, adiantamento e outras movimentações.

### RN-005 — Compras parceladas

Uma compra parcelada deve gerar lançamentos distribuídos entre os meses correspondentes.

### RN-006 — Cartões

Uma despesa paga com cartão deve poder ser vinculada a um cartão previamente cadastrado.

### RN-007 — Cálculo de saldo

> **PREENCHER**

Definir quais tipos de transação entram no cálculo do saldo, receitas, despesas e taxa de poupança.

### RN-008 — Fechamento de fatura

> **PREENCHER**

Definir como compras realizadas antes e depois do fechamento serão atribuídas às faturas.

---

## 6. Requisitos Funcionais

### RF-001 — Cadastro de transações

O sistema deve permitir cadastrar receitas e despesas.

Cada transação deve conter:

- valor;
- descrição;
- tipo;
- data;
- categoria;
- método de pagamento;
- zero ou mais tags;
- observações opcionais.

### RF-002 — Múltiplas tags

O sistema deve permitir associar múltiplas tags a uma mesma transação.

### RF-003 — Categorias customizáveis

O sistema deve permitir criar, editar e excluir categorias.

Cada categoria pode conter:

- nome;
- cor;
- ícone;
- tipo.

### RF-004 — Tags customizáveis

O sistema deve permitir criar, editar e excluir tags.

### RF-005 — Edição de transações

O usuário deve poder editar transações cadastradas.

### RF-006 — Exclusão de transações

O usuário deve poder excluir transações mediante confirmação.

### RF-007 — Listagem de transações

O sistema deve exibir as transações agrupadas por data.

### RF-008 — Filtros

O sistema deve permitir filtrar transações por:

- período;
- tipo;
- categoria;
- tag;
- método de pagamento;
- cartão;
- texto da descrição.

### RF-009 — Lançamento pelos cards

O usuário deve poder clicar diretamente nos cards de receitas e despesas para criar um lançamento.

O formulário deve abrir com o tipo correspondente já preenchido.

### RF-010 — Feedback de salvamento

O sistema deve apresentar feedback visual após salvar, editar ou excluir uma transação.

### RF-011 — Resumo nos cards

Cada card deve poder exibir:

- total acumulado;
- quantidade de registros no período;
- ação rápida para novo lançamento.

### RF-012 — Métodos de pagamento

O sistema deve permitir selecionar o método de pagamento.

Métodos iniciais:

- dinheiro;
- Pix;
- cartão de débito;
- cartão de crédito;
- transferência;
- outros.

### RF-013 — Cadastro de cartões

O sistema deve permitir cadastrar cartões com:

- nome;
- banco;
- limite;
- dia de fechamento;
- dia de vencimento.

### RF-014 — Vinculação de despesas a cartões

Quando o método de pagamento for cartão, o usuário deve poder selecionar um cartão cadastrado.

### RF-015 — Parcelamento

O sistema deve permitir informar:

- quantidade de parcelas;
- parcela atual;
- valor total;
- valor de cada parcela.

### RF-016 — Resumo por cartão

O sistema deve apresentar:

- gastos por cartão;
- total da fatura;
- limite utilizado;
- limite disponível;
- compras parceladas futuras.

### RF-017 — Dashboard

O sistema deve exibir:

- saldo total;
- receitas do período;
- despesas do período;
- balanço;
- taxa de poupança;
- quantidade de registros.

### RF-018 — Gráfico por categoria ou tag

O sistema deve exibir um gráfico de distribuição de despesas por categoria ou tag.

### RF-019 — Comparativo mensal

O sistema deve exibir um gráfico comparando receitas e despesas dos últimos meses.

### RF-020 — Fluxo diário

O sistema deve exibir a evolução diária do saldo ou do fluxo financeiro no período selecionado.

### RF-021 — Importação e exportação

O sistema deve permitir importar e exportar dados em:

- JSON;
- CSV.

### RF-022 — Backup

O sistema deve permitir gerar um backup dos dados armazenados localmente.

### RF-023 — Dados de demonstração

O sistema deve permitir carregar e remover dados de exemplo.

### RF-024 — Metas e orçamentos

> **PREENCHER / DECIDIR**

Definir se o usuário poderá criar limites mensais por categoria ou tag.

### RF-025 — Sincronização em nuvem

> **PREENCHER / FUTURO**

Definir se haverá sincronização com Supabase, Firebase ou outro serviço.

### RF-026 — Funcionalidades adicionais

> **PREENCHER**

Adicione novos requisitos funcionais identificados durante o desenvolvimento ou pesquisa de concorrentes.

---

## 7. Requisitos Não Funcionais

### RNF-001 — Mobile-first

A interface deve ser projetada prioritariamente para dispositivos móveis.

### RNF-002 — Responsividade

O sistema deve funcionar adequadamente em celulares, tablets e computadores.

### RNF-003 — Desempenho

As principais operações devem permanecer rápidas mesmo com uma quantidade elevada de transações.

> **PREENCHER MÉTRICA**

Definir quantidade de registros e tempo máximo aceitável para carregamento e filtros.

### RNF-004 — Funcionamento offline

O usuário deve poder consultar e cadastrar dados sem conexão com a internet.

### RNF-005 — Persistência local

Os dados devem permanecer disponíveis após o fechamento ou recarregamento da aplicação.

### RNF-006 — Instalação como PWA

A aplicação deve poder ser instalada em dispositivos compatíveis.

### RNF-007 — Privacidade

Os dados financeiros não devem ser enviados a serviços externos sem consentimento explícito.

### RNF-008 — Compatibilidade

A aplicação deve funcionar nas versões recentes de:

- Safari;
- Chrome;
- Edge.

### RNF-009 — Acessibilidade

A interface deve possuir:

- contraste adequado;
- áreas de toque confortáveis;
- textos legíveis;
- navegação por teclado;
- identificação acessível dos controles.

### RNF-010 — Segurança

> **PREENCHER**

Definir requisitos de proteção local, autenticação, criptografia, backup e sincronização.

### RNF-011 — Disponibilidade

> **PREENCHER**

Aplicável principalmente quando houver backend e sincronização em nuvem.

### RNF-012 — Manutenibilidade

O código deve ser organizado em componentes, serviços, tipos e módulos reutilizáveis.

### RNF-013 — Testabilidade

As regras de cálculo financeiro devem ser separadas da interface para permitir testes automatizados.

### RNF-014 — Usabilidade

O cadastro de uma transação deve exigir o menor número possível de interações.

> **PREENCHER MÉTRICA**

Definir número máximo desejado de passos ou toques.

---

## 8. Experiência do Usuário

### 8.1 Navegação principal

> **PREENCHER**

Definir as telas e a estrutura de navegação.

Sugestão inicial:

- Início;
- Transações;
- Cartões;
- Relatórios;
- Configurações.

### 8.2 Ações rápidas

- Adicionar receita pelo card de receitas.
- Adicionar despesa pelo card de despesas.
- Botão global de novo lançamento.
- Filtros rápidos por tag.
- Edição e exclusão pela lista.

### 8.3 Estados da interface

> **PREENCHER**

Definir comportamento para:

- carregamento;
- lista vazia;
- erro;
- operação concluída;
- confirmação de exclusão;
- ausência de conexão;
- dados inválidos.

---

## 9. Modelo de Dados

### 9.1 Transaction

```ts
type Transaction = {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  tags: string[]
  date: string
  paymentMethod: string
  cardId?: string
  installmentId?: string
  notes?: string
}
```

### 9.2 Category

```ts
type Category = {
  id: string
  name: string
  color: string
  icon: string
  type: 'income' | 'expense' | 'both'
}
```

### 9.3 Card

```ts
type Card = {
  id: string
  name: string
  bank: string
  limit: number
  closingDay: number
  dueDay: number
}
```

### 9.4 FilterOptions

```ts
type FilterOptions = {
  startDate?: string
  endDate?: string
  type?: 'income' | 'expense'
  selectedCategories?: string[]
  selectedTags?: string[]
  paymentMethods?: string[]
  cardIds?: string[]
  searchQuery?: string
}
```

### 9.5 Installment

> **PREENCHER**

Definir a estrutura usada para compras parceladas e recorrências.

### 9.6 Demais entidades

> **PREENCHER**

Avaliar necessidade de entidades para:

- orçamento;
- meta;
- conta;
- fatura;
- recorrência;
- usuário;
- sincronização;
- backup.

---

## 10. Arquitetura Técnica

### 10.1 Tecnologia recomendada

Desenvolver inicialmente como uma **PWA mobile-first**.

Tecnologias propostas:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- Lucide Icons;
- Recharts ou Chart.js;
- date-fns;
- IndexedDB ou LocalStorage.

### 10.2 Alternativa nativa

Uma versão futura poderá utilizar React Native com Expo, caso sejam necessárias integrações nativas mais profundas.

### 10.3 Persistência

Na primeira versão, os dados serão armazenados localmente.

> **DECIDIR**

Escolher entre:

- IndexedDB;
- LocalStorage;
- combinação dos dois.

### 10.4 Sincronização futura

> **PREENCHER**

Avaliar:

- Supabase;
- Firebase;
- backend próprio;
- sincronização opcional e criptografada.

---

## 11. Estrutura Proposta da Aplicação

```text
Finanflow/
├── README.md
├── PRODUCT_SPEC.md
├── NOTES.md
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── components/
    │   ├── Header.tsx
    │   ├── SummaryCards.tsx
    │   ├── TransactionFormModal.tsx
    │   ├── TransactionList.tsx
    │   └── ChartsDashboard.tsx
    ├── services/
    │   └── storageService.ts
    ├── types/
    │   └── finance.ts
    └── ...
```

> **PREENCHER**

Atualizar esta estrutura conforme novos módulos forem criados.

---

## 12. Plano de Implementação

### Etapa 1 — Configuração inicial

- Criar o projeto com React, TypeScript e Vite.
- Configurar Tailwind CSS.
- Instalar dependências.
- Configurar a estrutura de pastas.
- Validar o build inicial.

### Etapa 2 — Modelos e persistência

- Criar os tipos financeiros.
- Implementar persistência local.
- Criar operações de inclusão, leitura, edição e exclusão.
- Implementar importação e exportação.

### Etapa 3 — Cadastro de transações

- Criar formulário de receitas e despesas.
- Implementar categorias.
- Implementar múltiplas tags.
- Adicionar métodos de pagamento.
- Implementar validações.

### Etapa 4 — Lista e filtros

- Criar lista agrupada por data.
- Implementar busca e filtros.
- Adicionar edição e exclusão.
- Criar filtros rápidos por tags.

### Etapa 5 — Resumos e dashboard

- Criar cards de resumo.
- Implementar cálculos financeiros.
- Criar gráficos por categoria e tag.
- Criar comparativo mensal.
- Criar fluxo diário.

### Etapa 6 — Cartões e parcelas

- Criar cadastro de cartões.
- Vincular despesas.
- Implementar parcelamento.
- Criar resumo de faturas.

### Etapa 7 — PWA e funcionamento offline

- Criar manifesto.
- Configurar service worker.
- Testar instalação.
- Validar funcionamento offline.

### Etapa 8 — Melhorias futuras

> **PREENCHER**

Definir prioridades futuras, responsáveis e dependências.

---

## 13. Critérios de Aceitação

### CA-001 — Cadastro de despesa

- O usuário consegue informar valor, data, categoria e método de pagamento.
- O usuário consegue adicionar múltiplas tags.
- A transação aparece na lista após o salvamento.
- Os totais e gráficos são atualizados.

### CA-002 — Cadastro de receita

- O usuário consegue registrar uma entrada.
- O usuário consegue classificar a entrada como salário, reembolso ou outro tipo.
- A classificação influencia corretamente os indicadores.

### CA-003 — Compra no cartão

- O usuário consegue selecionar um cartão.
- A despesa aparece no resumo do cartão.
- O valor é considerado na fatura correspondente.

### CA-004 — Compra parcelada

- O usuário consegue informar o número de parcelas.
- As parcelas são distribuídas nos meses corretos.
- As parcelas futuras aparecem no resumo.

### CA-005 — Funcionamento offline

- O usuário consegue abrir o aplicativo sem conexão.
- O usuário consegue visualizar dados salvos.
- O usuário consegue cadastrar uma nova transação.
- Os dados permanecem salvos após reabrir o aplicativo.

### Outros critérios

> **PREENCHER**

Adicionar critérios de aceitação para cada requisito importante.

---

## 14. Plano de Verificação

### 14.1 Verificação automatizada

- Executar `npm run build`.
- Validar compilação TypeScript.
- Executar testes das regras financeiras.
- Validar importação e exportação.

### 14.2 Verificação manual

- Testar receitas e despesas.
- Testar múltiplas tags.
- Testar diferentes períodos.
- Validar atualização dos cards.
- Validar gráficos.
- Testar responsividade.
- Testar Safari no iPhone.
- Testar instalação como PWA.
- Testar funcionamento offline.
- Testar cartões e parcelas.

### 14.3 Casos adicionais

> **PREENCHER**

Adicionar cenários de borda e casos de erro.

---

## 15. Questões em Aberto

1. O aplicativo usará IndexedDB, LocalStorage ou ambos?
2. Haverá sincronização em nuvem?
3. O usuário poderá definir metas mensais?
4. Haverá contas bancárias além de cartões?
5. Como transferências entre contas serão tratadas?
6. Como reembolsos serão vinculados às despesas originais?
7. Como adiantamentos a terceiros serão baixados?
8. Como compras parceladas serão editadas ou excluídas?
9. A aplicação terá autenticação?
10. Haverá suporte a múltiplas moedas?
11. Quais dados serão considerados na taxa de poupança?
12. Como será feito o fechamento das faturas?
13. Será possível cadastrar receitas e despesas recorrentes?
14. Haverá sincronização entre dispositivos?
15. Será necessário criptografar dados locais?

---

## 16. Backlog Futuro

> **PREENCHER E PRIORIZAR**

Possíveis itens:

- sincronização em nuvem;
- autenticação;
- integração bancária;
- recorrências;
- metas e orçamentos;
- notificações;
- widgets;
- compartilhamento familiar;
- múltiplas contas;
- múltiplas moedas;
- relatórios avançados;
- insights automáticos;
- classificação assistida por IA;
- anexos e comprovantes;
- conciliação de reembolsos e adiantamentos.

---

## 17. Pesquisa de Concorrentes e Referências

### Aplicativos analisados

> **PREENCHER**

Para cada aplicativo, registrar:

- nome;
- funcionalidades relevantes;
- pontos positivos;
- limitações;
- ideias aplicáveis ao FinanFlow;
- recursos que não serão adotados.

### Referências

- Conversa no Claude:
  - https://claude.ai/share/04c7dbe6-0337-499a-b371-50a323c00587

### Pesquisa pendente

- Identificar aplicativos semelhantes.
- Avaliar tratamento de reembolsos.
- Avaliar tratamento de adiantamentos a terceiros.
- Comparar gestão de cartões e faturas.
- Comparar parcelamentos.
- Identificar boas práticas de lançamento rápido.

---

## 18. Decisões Registradas

### DR-001 — Aplicação mobile-first

**Status:** aprovada.

O FinanFlow será desenvolvido inicialmente como uma aplicação web mobile-first.

### DR-002 — PWA como primeira versão

**Status:** proposta recomendada.

A primeira versão será uma PWA para facilitar desenvolvimento, testes e instalação.

### DR-003 — Armazenamento local

**Status:** aprovado para o MVP.

Os dados serão armazenados inicialmente no dispositivo.

### DR-004 — Múltiplas tags

**Status:** aprovado.

Uma transação poderá possuir mais de uma tag.

### Novas decisões

> **PREENCHER**

Registrar decisões importantes com:

- identificador;
- data;
- status;
- contexto;
- decisão;
- consequências.
