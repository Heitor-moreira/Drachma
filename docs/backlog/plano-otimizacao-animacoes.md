# Plano de Otimização de Animações e UX

## Contexto
A introdução de modais tipo Bottom Sheet (Drawers) e gestos de Swipe-to-action com `framer-motion` causou uma percepção de lentidão no uso do aplicativo. Este plano visa mitigar o problema baseando-se nas premissas de performance já estabelecidas no projeto.

## Análise do Baseline Atual
Os arquivos de benchmark existentes (`src/utils/performance.bench.ts` e `src/utils/finance.bench.ts`) em conjunto com `PERFORMANCE_BASELINE.md` garantem que a camada de dados é extremamente rápida:
- A projeção financeira custa `~0,0001 ms/op`.
- A filtragem de transações recentes suporta milhares de itens sub-milissegundos.
- A serialização de estados também é instantânea.

**Conclusão:** O gargalo *não* está no processamento de dados (JavaScript thread), mas sim na renderização do React (Main thread) e no Compositor (GPU) durante os gestos e transições.

## Hipóteses da Lentidão Visual
1. **Física da Mola (Spring):** Os parâmetros padrão ou inseridos no Framer Motion (`stiffness: 200`, `damping: 25`) podem ser longos demais para um app mobile, passando a sensação de uma interface "pesada".
2. **Re-renders Excessivos:** Arrastar uma linha (Swipe) pode estar disparando renders indesejados no componente pai inteiro (`RecentTransactionsView` ou `DailyBalanceView`), quebrando a marca de 60fps.
3. **Reflows de Layout:** Ausência de aceleração de hardware (`will-change: transform`).

## Plano de Ação Estruturado

### Etapa 1: Calibração das Constantes de Animação (Tuning)
- Ajustar as propriedades de transição dos Bottom Sheets para um comportamento mais "Snappy" (rápido):
  - Recomendado: `transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}`.
  - Alternativa: mudar para `type: "tween", ease: "easeOut", duration: 0.25`.

### Etapa 2: Otimização de Renderização (Swipe-to-action)
- Investigar as views de listas (`RecentTransactionsView`, `DailyBalanceView`) com o **React Profiler**.
- Isolar cada item da lista em um componente com `React.memo` para que o arrasto não re-renderize as outras 50+ transações da tela.
- Certificar-se de que o estado do arrasto usa apenas `useMotionValue` do framer-motion (que atua direto no DOM sem passar pelo ciclo de render do React).

### Etapa 3: Aceleração de Hardware (GPU)
- Adicionar a propriedade `style={{ willChange: "transform" }}` ou a classe Tailwind `will-change-transform` aos elementos `motion.div` pesados, transferindo o trabalho de interpolação estritamente para a GPU.

### Etapa 4: Testes Unitários e de Renderização
- Como o repositório já se apoia em `vitest`, adicionar testes usando `@testing-library/react` combinados com contadores de renderização para garantir que os componentes de lista (Transactions) tenham um número de renders `<= 2` ao sofrer interações na UI.
- Criar um registro no `PERFORMANCE_BASELINE.md` constando os limites aceitáveis de Tempo de Render (medidos pela React DevTools).

## Critérios de Aceite
- [ ] Modais de menu e formulários abrem/fecham de forma instantânea na percepção do usuário (< 300ms de cauda de animação).
- [ ] O arrasto de linhas opera cravado a 60fps em aparelhos móveis sem engasgos ("jank").
- [ ] O baseline numérico permanece íntegro e os testes do vitest continuam passando 100%.
