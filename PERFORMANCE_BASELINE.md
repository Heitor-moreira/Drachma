# Baseline de performance

Fixture determinística em `src/utils/finance.bench.ts`. Executar com:

```bash
npx vitest bench src/utils/finance.bench.ts --run
```

Registro inicial desta etapa:

- HEAD: `7016f19` (branch `main`)
- Node: `v26.7.0`
- npm: `11.19.0`
- projeção: média aproximada de `0,0001 ms/op`
- agrupamento da projeção: média aproximada de `0,0041 ms/op`
- referência ingênua (varredura de uma data): medir no mesmo comando para comparar a estratégia anterior
- validação funcional: 30 testes passando

Os tempos variam por máquina; a comparação deve ser feita no mesmo ambiente e usando a mesma fixture.
