# Validação do Drachma

Toda conclusão deve ser baseada em evidência executada após a alteração.

## Validação mínima

```bash
npx tsc --noEmit
npm test -- --run
npm run build
git diff --check
```

## Matriz por tipo de mudança

| Mudança | Validação adicional |
| --- | --- |
| Regra financeira, recorrência ou parcela | testes focados do domínio, cenários de projeção e benchmark (`npx vitest bench src/utils/finance.bench.ts --run`) |
| Persistência, importação ou exportação | testes de snapshot válido, inválido e compatibilidade |
| Interface, layout ou texto | navegador desktop e mobile, temas claro e escuro |
| Modal, formulário ou menu | teclado, foco, fechamento, conteúdo longo e estados inválidos |
| PWA ou versão | build, manifesto, comportamento offline e atualização com `isDirty` |
| Dependências ou arquivos removidos | busca por referências, TypeScript, testes e build completo |

## Ferramentas de análise

- consultar o Code Review Graph antes de buscas amplas;
- verificar se `head_matches_build=true`; se estiver desatualizado, usar o grafo apenas como roteador e confirmar no código vivo;
- para bugs, seguir: grafo → OpenCodeReview → alteração → validação;
- após commits relevantes, reconstruir ou verificar o grafo antes de declarar sincronização.
