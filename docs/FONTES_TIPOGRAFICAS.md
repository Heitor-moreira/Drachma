# Inventário tipográfico do Drachma

Fonte de verdade para qualquer tela, componente, botão, modal, formulário ou mensagem que contenha texto. A base é a tela de login.

## Regra principal

Antes de criar ou alterar uma interface com texto, consultar este arquivo e usar somente os tokens abaixo. Não criar novos tamanhos, pesos, trackings ou famílias sem atualizar este inventário e justificar a exceção.

## Famílias

- **Interface:** `Nunito Sans`, com fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`. Aplicada ao `body` em `index.html`.
- **Marca:** `Cinzel`, com fallback `Georgia, serif`. Usada somente no título "Drachma" (peso 600, `letter-spacing: 0.04em`).

## Pesos

- `font-normal` (400): corpo de texto e valores que não são destaque.
- `font-medium` (500): textos de apoio, controles selecionados e ênfases leves.
- `font-semibold` (600): **exclusivo da marca** (título "Drachma" e seu subtítulo). Não usar em outros componentes.
- `font-bold` (700): labels, botões, links de ação, mensagens de estado e indicadores.
- Peso 300 não deve ser usado.

## Escala

| Token | Classe Tailwind | Tamanho | Uso |
|---|---|---:|---|
| `brand-title` | `text-5xl` + Cinzel 600 | 48 px | título da marca na tela de login |
| `brand-subtitle` | `text-sm font-semibold uppercase tracking-[0.2em]` | 14 px | subtítulo da marca |
| `ui-caption` | `text-xs` | 12 px | links compactos, metadados e estados |
| `ui-label` | `text-xs font-bold uppercase tracking-wider` | 12 px | labels de campos e separadores curtos (ex.: "OU") |
| `ui-secondary` | `text-sm` | 14 px | mensagens, descrições, botões secundários e formulários |
| `ui-body` | `text-base` | 16 px | texto padrão, campos, botões principais e valores financeiros |
| `ui-title` | `text-2xl` | 24 px | títulos de tela, cabeçalhos mensais e títulos de seção |
| `ui-display` | `text-3xl` | 30 px | indicador ou título de destaque excepcional |
| `type-icon` | `type-icon-label` | 15 px | letras `E` e `C` dos ícones de tipo de lançamento |
| `modal-value` | `32px` | 32 px | valor principal do modal de lançamento |
| `modal-primary` | `25px` | 25 px | textos principais e títulos do modal de lançamento |
| `modal-option` | `21px` | 21 px | opções dos menus do modal de lançamento |

## Tracking (espaçamento entre letras)

Somente três valores são permitidos:

| Valor | Espaçamento | Uso |
|---|---:|---|
| `tracking-wider` | 0,05em | labels de campos e separador "OU" |
| `tracking-[0.2em]` | 0,2em | subtítulo da marca |
| `letter-spacing: 0.04em` | 0,04em | título "Drachma" (Cinzel) |

Não usar `tracking-widest` nem outros valores.

## Estilo

- Usar estilo normal por padrão.
- Usar `italic` somente para observações, mensagens de estado vazio ou texto auxiliar realmente necessário.
- Usar `uppercase` apenas em labels, subtítulos e separadores curtos, sempre com tracking; nunca em textos longos.

## Regras de implementação

1. Preferir sempre os tokens padrão acima (`text-xs`, `text-sm`, `text-base`, `text-2xl`, `text-3xl`).
2. Não usar `text-[...]`, `clamp(...)`, `text-xl`, `text-4xl` ou tamanhos menores que 12 px em novas interfaces.
3. Valores financeiros e saldos devem usar `text-base` (16 px), salvo quando forem um indicador principal, caso em que podem usar `text-2xl` ou `text-3xl`.
4. O modal de lançamento usa os tokens `modal-value`, `modal-primary` e `modal-option` para preservar a hierarquia visual solicitada.
5. Preservar contraste e legibilidade nos modos claro e escuro.
6. Ao alterar uma interface existente, migrar tamanhos fora da escala quando isso não alterar indevidamente o layout.

## Estado atual e migração

O código existente ainda contém alguns tamanhos legados (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xl`, `text-4xl` e `clamp(...)`). Eles devem ser substituídos gradualmente pela escala aprovada durante a manutenção de cada tela. O inventário define o padrão para todo código novo a partir de agora.

## Fonte global

As famílias Nunito Sans e Cinzel são carregadas em `index.html`; Nunito Sans é aplicada ao `body`. A tipografia é definida principalmente por classes utilitárias Tailwind nos componentes.
