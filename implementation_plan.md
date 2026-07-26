# Plano de Implementação - Aplicativo de Fluxo de Caixa Pessoal (Finanflow)

Criar um aplicativo focado em **gestão de fluxo de caixa pessoal** com interface **mobile-first**, lançamento rápido de receitas e despesas, sistema de tags/categorias customizáveis, datas e dashboards com gráficos interativos e informativos.

---

## User Review Required

> [!IMPORTANT]
> **Tecnologia Proposta: Mobile-First Web App (PWA) vs React Native/Expo**
> - **Opção Recomendada (PWA / Web Mobile)**: Desenvolver usando **React + Vite + Tailwind CSS + Lucide Icons + Recharts / Chart.js**. Pode ser instalado no celular como um app nativo (com ícone na tela inicial, funcionamento offline e armazenamento local via `IndexedDB`/`LocalStorage`), permitindo prototipação e teste instantâneos.
> - **Opção Nativa (React Native + Expo)**: Desenvolver um aplicativo nativo para Android/iOS usando Expo.
>
> *Recomendamos a opção **PWA (Mobile-First Web App)** para termos visualização imediata no navegador com alta performance, suporte a PWA em dispositivos móveis e excelente UX/UI.*

---

## Open Questions

> [!NOTE]
> 1. **Armazenamento de Dados**: Inicialmente o aplicativo salvará os dados localmente no dispositivo (offline-first). Você pretende sincronizar com alguma conta/banco de dados em nuvem no futuro (ex: Firebase/Supabase)?
> 2. **Metas / Orçamentos**: Além de registrar receitas e despesas com tags, você gostaria de definir metas de gastos mensais por categoria (ex: limite para alimentação)?

---

## Proposed Changes

### Estrutura Geral da Aplicação (`Finanflow`)

#### [NEW] [package.json](file:///Users/heitor/Finanflow/package.json)
- Dependências: `react`, `react-dom`, `lucide-react`, `recharts`, `clsx`, `tailwind-merge`, `date-fns`.
- Scripts de desenvolvimento e build (`vite`).

#### [NEW] [vite.config.js](file:///Users/heitor/Finanflow/vite.config.js)
- Configuração do Vite com suporte a PWA/Mobile View.

#### [NEW] [index.html](file:///Users/heitor/Finanflow/index.html)
- Configurações de viewport para dispositivos móveis (`viewport-fit=cover`, `user-scalable=no`).

#### [NEW] [src/types/finance.ts](file:///Users/heitor/Finanflow/src/types/finance.ts)
- Modelos de dados:
  - `Transaction`: `id`, `description`, `amount`, `type` (`'income'` | `'expense'`), `category`, `tags` (`string[]`), `date`, `paymentMethod`, `notes`.
  - `Category`: `id`, `name`, `color`, `icon`, `type`.
  - `FilterOptions`: `startDate`, `endDate`, `type`, `selectedTags`, `searchQuery`.

#### [NEW] [src/services/storageService.ts](file:///Users/heitor/Finanflow/src/services/storageService.ts)
- Persistência local (LocalStorage com fallback/IndexedDB).
- Funções para importação/exportação de dados em JSON/CSV e reset de dados de exemplo.

#### [NEW] [src/components/Header.tsx](file:///Users/heitor/Finanflow/src/components/Header.tsx)
- Topbar mobile com saldo atual, seletor de período (Mês Atual / Personalizado) e botão de backup/configurações.

#### [NEW] [src/components/SummaryCards.tsx](file:///Users/heitor/Finanflow/src/components/SummaryCards.tsx)
- Cards resumo em carrossel ou grid:
  - **Saldo Total**
  - **Receitas do Mês**
  - **Despesas do Mês**
  - **Balanço / Taxa de Poupança (%)**

#### [NEW] [src/components/TransactionFormModal.tsx](file:///Users/heitor/Finanflow/src/components/TransactionFormModal.tsx)
- Formulário intuitivo estilo bottom-sheet/modal:
  - Toggle rápido entre **Receita** (verde) e **Despesa** (vermelho).
  - Campo de valor numérico amigável com teclado numérico.
  - Seleção/Criação de **Tags** dinâmicas (ex: `#alimentacao`, `#lazer`, `#salario`, `#fixo`).
  - Seletor de data (padrão: Hoje).
  - Descrição e observações opcionais.

#### [NEW] [src/components/TransactionList.tsx](file:///Users/heitor/Finanflow/src/components/TransactionList.tsx)
- Lista de transações agrupada por data.
- Chips de tags clicáveis para filtragem rápida.
- Ações de deslizar/clicar para editar ou excluir.

#### [NEW] [src/components/ChartsDashboard.tsx](file:///Users/heitor/Finanflow/src/components/ChartsDashboard.tsx)
- **Gráficos Simples e Informativos (Recharts)**:
  1. **Gráfico de Rosca / Donut**: Distribuição das Despesas por Tag/Categoria no período.
  2. **Gráfico de Barras Comparativo**: Comparativo de Receitas vs Despesas dos últimos 6 meses.
  3. **Gráfico de Linha de Fluxo Diário**: Evolução do saldo ou fluxo diário no mês.

---

## Verification Plan

### Automated Verification
- Executar `npm run build` para garantir compilação TypeScript e sintaxe sem erros.

### Manual Verification
- Testar adição de receitas e despesas com diferentes tags e datas.
- Verificar se os totais dos cards atualizam em tempo real.
- Validar se os gráficos (Donut, Barras e Linha) refletem corretamente os lançamentos e filtros aplicados.
- Testar responsividade em viewport de celular (iOS/Android).
