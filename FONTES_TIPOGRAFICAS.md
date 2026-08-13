# Inventário tipográfico do Drachma

Fonte de verdade para qualquer tela, componente, botão, modal, formulário ou mensagem que contenha texto.

## Regra principal

Antes de criar ou alterar uma interface com texto, consultar este arquivo e usar somente os tokens abaixo. Não criar novos tamanhos, pesos ou famílias sem atualizar este inventário e justificar a exceção.

## Família

- **Inter**, com fallback `sans-serif`.
- Pesos permitidos: **400**, **500** e **700**.
- Classes Tailwind correspondentes: `font-normal`, `font-medium` e `font-bold`.
- Pesos 300 e 600 não devem ser usados em novos componentes.

## Escala mínima aprovada

| Token | Classe Tailwind | Tamanho | Uso |
|---|---|---:|---|
| `ui-caption` | `text-xs` | 12 px | metadados, labels auxiliares, estados e navegação compacta |
| `ui-secondary` | `text-sm` | 14 px | descrições, textos secundários, formulários e tabelas auxiliares |
| `ui-body` | `text-base` | 16 px | texto padrão, valores financeiros e controles principais |
| `ui-title` | `text-2xl` | 24 px | títulos de tela, cabeçalhos mensais e títulos de seção |
| `ui-display` | `text-3xl` | 30 px | indicador ou título de destaque excepcional |
| `modal-value` | `32px` | 32 px | valor principal do modal de lançamento |
| `modal-primary` | `25px` | 25 px | textos principais e títulos do modal de lançamento |
| `modal-option` | `21px` | 21 px | opções dos menus do modal de lançamento |

### Uso dos pesos

- `font-normal` (400): corpo de texto e valores que não são destaque.
- `font-medium` (500): controles selecionados e ênfases intermediárias.
- `font-bold` (700): títulos, labels importantes, botões e indicadores.

### Estilo

- Usar estilo normal por padrão.
- Usar `italic` somente para observações, mensagens de estado vazio ou texto auxiliar realmente necessário.
- Usar `uppercase` apenas em labels curtos e auxiliares; nunca em textos longos.

## Regras de implementação

1. Preferir sempre os tokens padrão acima (`text-xs`, `text-sm`, `text-base`, `text-2xl`, `text-3xl`).
2. Não usar `text-[...]`, `clamp(...)`, `text-xl`, `text-4xl` ou tamanhos menores que 12 px em novas interfaces.
3. Valores financeiros e saldos devem usar `text-base` (16 px), salvo quando forem um indicador principal, caso em que podem usar `text-2xl` ou `text-3xl`.
4. O modal de lançamento usa os tokens `modal-value`, `modal-primary` e `modal-option` para preservar a hierarquia visual solicitada.
4. Preservar contraste e legibilidade nos modos claro e escuro.
5. Ao alterar uma interface existente, migrar tamanhos fora da escala quando isso não alterar indevidamente o layout.

## Estado atual e migração

O código existente ainda contém alguns tamanhos legados (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xl`, `text-4xl` e `clamp(...)`). Eles devem ser substituídos gradualmente pela escala aprovada durante a manutenção de cada tela. O inventário define o padrão para todo código novo a partir de agora.

## Fonte global

A família Inter é carregada e aplicada ao `body` em `index.html`. A tipografia é definida principalmente por classes utilitárias Tailwind nos componentes.
