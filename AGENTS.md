# Instruções de interface

## Tipografia obrigatória

Antes de criar ou alterar qualquer tela, componente, botão, modal, formulário, tabela ou mensagem que contenha texto, consulte [FONTES_TIPOGRAFICAS.md](./FONTES_TIPOGRAFICAS.md).

Use somente a família, os pesos e a escala aprovados nesse inventário. Não introduza novos tamanhos ou pesos tipográficos sem atualizar o inventário e registrar a justificativa. Ao modificar código legado, prefira migrar os estilos tipográficos fora da escala aprovada.

## Inicialização local obrigatória

No início de cada nova conversa relacionada ao Drachma, encerre somente os processos que estiverem ocupando a porta `3000` e inicie novamente o servidor local com:

```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

Não encerre processos de outras portas ou serviços não relacionados ao Drachma.

## OpenCodeReview obrigatório para bugs

Sempre que o usuário solicitar a análise de possíveis bugs, a investigação de um comportamento incorreto ou a correção de bugs no app, siga esta ordem: (1) use primeiro o `code-review-graph` para mapear contexto, dependências, fluxos afetados e impacto; (2) execute depois o OpenCodeReview usando a skill/ferramenta nativa do Codex (`ocr_review`) para a análise especializada; (3) só então altere os arquivos e valide a correção. Para uma verificação do OpenCodeReview sem chamada ao LLM, use `preview=true`. As duas ferramentas são complementares e nenhuma substitui a outra.

## Cores obrigatórias

Antes de criar ou alterar qualquer asset visual, consulte [CORES_APP.md](./CORES_APP.md). Use a paleta aprovada para telas, componentes, botões, modais, formulários, tabelas, gráficos e ícones. Não introduza novas cores sem atualizar o inventário e registrar a justificativa.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
