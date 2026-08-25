# Drachma — índice operacional de desenvolvimento

Este arquivo define o fluxo obrigatório de trabalho. As convenções detalhadas vivem nos documentos indicados abaixo. O código atual continua sendo a referência final quando houver divergência entre documentação e implementação.

## Regras obrigatórias

1. Preserve mudanças, diffs, arquivos não rastreados, backups, fixtures e dados que não pertençam à tarefa. Não descarte, sobrescreva nem inclua esse material em commits sem autorização explícita.
2. Antes de explorar código, use primeiro o `code-review-graph`. Recorra a busca e leitura direta de arquivos somente para lacunas do grafo ou para confirmar detalhes da implementação.
3. Antes de alterar uma interface, consulte as convenções aplicáveis de tipografia, cores, layout, acessibilidade e responsividade. Parta dos padrões já consolidados no app e preserve rótulos, hierarquia, tokens e comportamento.
4. Não trate backups, propostas, planos ou o `README.md` como contrato vivo sem conferir o código, os tipos, a persistência e os fluxos atuais.
5. Faça alterações pequenas e focadas. Valide o impacto, os fluxos afetados e a cobertura pertinente antes de concluir.

## Inicialização local

No início de cada nova conversa relacionada ao Drachma, encerre somente os processos que estiverem ocupando a porta `3000` e inicie o servidor com:

```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

Não encerre processos de outras portas ou serviços não relacionados ao Drachma.

## Fluxo obrigatório para bugs

Para analisar, investigar ou corrigir comportamento incorreto, siga esta ordem:

1. Use o `code-review-graph` para mapear contexto, dependências, fluxos, impacto e testes.
2. Execute o OpenCodeReview pela skill ou ferramenta nativa do Codex (`ocr_review`). Para verificar a configuração sem chamada ao LLM, use `preview=true`.
3. Altere somente os arquivos necessários.
4. Valide conforme [VALIDACAO_APP.md](./VALIDACAO_APP.md).

O grafo e o OpenCodeReview são complementares; nenhum substitui o outro.

## Uso obrigatório do grafo

- Comece por contexto mínimo e verifique se o grafo está sincronizado com o `HEAD`.
- Use busca semântica ou consultas do grafo para localizar entidades e relações.
- Use raio de impacto e fluxos afetados antes de mudanças estruturais.
- Em revisões, detecte as mudanças e obtenha contexto focado.
- Consulte importadores, chamadores, dependências e testes pelo grafo antes de varrer arquivos.
- Se o grafo estiver desatualizado ou `head_matches_build=false`, informe isso e trate seus resultados apenas como orientação até confirmar no código vivo.

## Matriz de documentos por tipo de alteração

| Tipo de trabalho | Consulta obrigatória |
| --- | --- |
| Visão do produto, escopo e requisitos | [README.md](./README.md), apenas como vitrine do produto; não é fonte normativa |
| Texto, títulos, valores, controles e hierarquia tipográfica | [FONTES_TIPOGRAFICAS.md](./FONTES_TIPOGRAFICAS.md) |
| Cores, temas, estados financeiros, bordas e superfícies | [CORES_APP.md](./CORES_APP.md) |
| Telas, cabeçalhos, filtros, modais, espaçamentos e navegação | [LAYOUTS_APP.md](./LAYOUTS_APP.md) |
| Mobile, zoom, toque, teclado, foco, contraste e leitores de tela | [ACESSIBILIDADE_RESPONSIVIDADE.md](./ACESSIBILIDADE_RESPONSIVIDADE.md) |
| Tipos financeiros, importação, exportação, backup e armazenamento | [DADOS_E_PERSISTENCIA.md](./DADOS_E_PERSISTENCIA.md) |
| Testes, TypeScript, build, navegador e critérios de conclusão | [VALIDACAO_APP.md](./VALIDACAO_APP.md) |
| Arquitetura, organização, nomenclatura e padrões de implementação | [CONVENCOES_CODIGO.md](./CONVENCOES_CODIGO.md) |
| Status, staging, commits, proteção de mudanças e push | [CONVENCOES_GIT.md](./CONVENCOES_GIT.md) |

Consulte todos os documentos aplicáveis quando uma tarefa atravessar mais de um domínio.

## Referências operacionais

- Consulte [.github/code-review-graph.instruction.md](./.github/code-review-graph.instruction.md) para o uso detalhado do grafo na exploração, análise de impacto e revisão.
- Use [.codex/skills/drachma-investigate-finance/SKILL.md](./.codex/skills/drachma-investigate-finance/SKILL.md) ao investigar transações, saldos, recorrências, parcelas, totais, importação ou classificação financeira.
- Use [.codex/skills/drachma-validate-ui/SKILL.md](./.codex/skills/drachma-validate-ui/SKILL.md) ao alterar ou diagnosticar telas, componentes, modais, formulários, navegação, tipografia, cores, responsividade ou interações no navegador.

## Encerramento da tarefa

Antes de declarar uma mudança concluída:

1. Confirme que apenas o escopo solicitado foi alterado.
2. Execute as verificações proporcionais ao risco definidas em [VALIDACAO_APP.md](./VALIDACAO_APP.md).
3. Revise o diff e preserve mudanças não relacionadas.
4. Informe testes executados, limitações e qualquer documento ausente ou divergente.
