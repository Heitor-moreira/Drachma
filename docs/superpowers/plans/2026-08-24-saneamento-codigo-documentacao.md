# Saneamento de Código e Documentação — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover código órfão e dependências sem uso, consolidar as convenções do Drachma e tornar README e AGENTS adequados aos seus públicos.

**Architecture:** A limpeza será incremental e preservará comportamento, dados e compatibilidade de importação. O `AGENTS.md` será um índice operacional; cada domínio terá uma fonte normativa própria na raiz.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Markdown e Git.

## Global Constraints

- Preservar UI, UX, textos, navegação e comportamento financeiro observável.
- Preservar `FinancialGroup`, `TransactionType` e a compatibilidade de importação legada.
- Não alterar nem incluir arquivos não rastreados alheios ao escopo.
- Não fazer push.
- Validar TypeScript, testes, build, diff e dependências após cada etapa relevante.

---

### Task 1: Remover componentes e dependências órfãs

**Files:**
- Delete: `components/AiInsights.tsx`
- Delete: `components/Dashboard.tsx`
- Delete: `components/FixedExpensesManager.tsx`
- Delete: `components/ImportModal.tsx`
- Delete: `components/SheetsManager.tsx`
- Delete: `components/TemplateImport.tsx`
- Delete: `components/TransactionList.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: composição atual de `App.tsx`.
- Produces: árvore de dependências sem `@google/genai`, `recharts` e `xlsx`.

- [ ] Confirmar ausência de importadores com grafo e busca textual.
- [ ] Remover os sete componentes.
- [ ] Remover as três dependências com o gerenciador de pacotes.
- [ ] Executar TypeScript, testes e build.
- [ ] Criar commit local focado.

### Task 2: Consolidar convenções e documentação do produto

**Files:**
- Modify: `README.md`
- Create: `LAYOUTS_APP.md`
- Create: `ACESSIBILIDADE_RESPONSIVIDADE.md`
- Create: `DADOS_E_PERSISTENCIA.md`
- Create: `VALIDACAO_APP.md`
- Create: `CONVENCOES_CODIGO.md`
- Create: `CONVENCOES_GIT.md`
- Delete: `TRANSACTIONS_SCHEMA.md`
- Delete: `SEGURANCA_DADOS_E_PERSISTENCIA.md`

**Interfaces:**
- Consumes: regras atuais do `AGENTS.md`, inventários de fontes/cores e contratos vivos do código.
- Produces: fontes normativas separadas por responsabilidade.

- [ ] Reescrever o README como vitrine, instalação e resumo funcional.
- [ ] Extrair regras de layout, acessibilidade, validação, código e Git.
- [ ] Consolidar dados, persistência e segurança no contrato vigente.
- [ ] Separar claramente comportamento implementado de ideias futuras.
- [ ] Revisar links e contradições.

### Task 3: Reorganizar AGENTS e ideias futuras

**Files:**
- Modify: `AGENTS.md`
- Modify: `.gitignore`
- Create local ignored: `IDEIAS_FUTURAS.md`
- Consume and remove: `PLANO_SUPABASE_DRACHMA.md`

**Interfaces:**
- Consumes: documentos normativos da Task 2 e plano local Supabase.
- Produces: índice operacional enxuto e arquivo local de ideias não versionado.

- [ ] Incorporar o plano Supabase em `IDEIAS_FUTURAS.md`.
- [ ] Ignorar `IDEIAS_FUTURAS.md`.
- [ ] Remover o arquivo Supabase incorporado após comparar o conteúdo.
- [ ] Integrar e revisar a edição do `AGENTS.md` feita pelo subagente.
- [ ] Executar validação documental, TypeScript, testes, build e diff.
- [ ] Criar commit local focado.
