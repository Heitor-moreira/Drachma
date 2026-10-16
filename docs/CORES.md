# Padrão de cores do Drachma

Fonte de verdade para a criação ou alteração de qualquer tela, componente, botão, modal, formulário, tabela, gráfico, ícone ou outro asset visual.

## Regra principal

Consultar este arquivo antes de criar novos assets. Usar os tokens e combinações abaixo sempre que a função visual já estiver contemplada. Não introduzir novas cores sem atualizar este inventário e justificar a exceção.

---

## ☀️ Modo claro · Tokens (Base Ivory & Tinta Navy)

Base Ivory `#FAF7F0` (derivado do marfim da paleta) + Navy 900 `#0F1F3D` como cor de texto e contraste principal.

> **Analogia:** Se o tema escuro é a mesa de feltro de cassino, o tema claro é o papel nobre de uma carta timbrada: fundo ivory, tinta navy e o dourado reservado para o selo/destaque.

### Fundos

| Token | Hex | Uso |
|---|---|---|
| `bg-app` | `#FAF7F0` | Fundo principal da aplicação |
| `bg-sunken` | `#F1EBDC` | Inputs, áreas rebaixadas e campos de busca |
| `bg-surface` | `#FFFFFF` | Cards e superfícies principais |
| `bg-elevated` | `#FFFFFF` | Modais, menus e dropdowns (com sombra suave) |
| `bg-hover` | `#EFE8D6` | Hover de linhas, listas e itens |
| `bg-overlay` | `rgba(15, 31, 61, 0.48)` | Fundo atrás de modais (Navy 900 com opacidade) |

### Texto e Contraste

| Token | Hex | Contraste sobre o ivory (`#FAF7F0`) |
|---|---|---|
| `text-primary` | `#0F1F3D` | 15,3:1 |
| `text-secondary` | `#3D4F70` | 7,7:1 |
| `text-muted` | `#5F6E8A` | 4,8:1 |
| `text-disabled` | `#9AA5BA` | 2,3:1 (intencional para estados desabilitados) |
| `text-on-accent` | `#0F1F3D` | 7,5:1 sobre Gold 500 (`#D9A83A`) |
| `text-on-action` | `#FAF7F0` | 8,0:1 sobre Royal (`#2A4A8C`) |

### Bordas

| Token | Hex | Uso |
|---|---|---|
| `border-subtle` | `#E3DAC3` | Divisores, bordas de cards |
| `border-strong` | `#CFC3A5` | Inputs, bordas com mais peso |
| `border-focus` | `#2A4A8C` | Anel de foco acessível (Royal) |

### Destaque (Dourado)

| Token | Hex | Uso |
|---|---|---|
| `accent` | `#D9A83A` | Preenchimento de botão primário (texto navy `#0F1F3D`) |
| `accent-hover` | `#E4BC5A` | Hover do botão de destaque |
| `accent-pressed` | `#B88A26` | Pressionado / ativo |
| `accent-subtle` | `#F0D48A` | Realces e fundos suaves |
| `accent-text` | `#8F6A1B` | Texto e ícone dourado (4,6:1 sobre o ivory) |

### Interação

| Token | Hex | Uso |
|---|---|---|
| `action` | `#2A4A8C` | Botão secundário, com texto ivory |
| `link` | `#2A4A8C` | Links (8,0:1 sobre o ivory) |

### Estados Financeiros

| Token | Cor (Texto & Ícone) | Fundo suave | Contraste Par |
|---|---|---|---|
| `success` | `#1F7A4D` | `#E3F4EA` | > 4,5:1 (Receitas, confirmações, saldos positivos) |
| `danger` | `#B3372A` | `#FBE5E2` | > 4,5:1 (Despesas, erros, saldos negativos) |
| `info` | `#2A4A8C` | `#E4EAF7` | > 4,5:1 (Informativos, badges neutros) |
| `warning` | `#7F5F17` | `#FBF0D3` | > 4,5:1 (Avisos, pendências, atenção) |

---

## 🌙 Modo escuro · Tokens (Base Navy Profundo)

Paleta construída a partir do logo (moeda dourada) com o navy profundo `#0F1F3D` como cor base.

> **Analogia:** Pense numa mesa de jogo de cassino. O navy é o feltro, que ocupa quase tudo (80%). O dourado são as fichas (5%): aparecem pouco e chamam atenção justamente por isso.

### Fundo e superfícies

| Cor / Token | Hex | Uso |
|---|---|---|
| Navy 950 (`dark-bg-deepest`) | `#0A1529` | Fundo mais profundo (rodapé, áreas de contraste) |
| Navy 900 (`dark-bg-app`) | `#0F1F3D` | Base / fundo principal |
| Navy 800 (`dark-bg-surface`) | `#162A4F` | Cards e superfícies |
| Navy 700 (`dark-bg-elevated`) | `#1F3868` | Superfície elevada, bordas |
| Navy 600 (`dark-bg-hover`) | `#2C4A85` | Hover, bordas fortes |

### Dourado (destaque)

| Cor / Token | Hex | Uso |
|---|---|---|
| Gold 300 | `#F0D48A` | Brilho, realce suave |
| Gold 400 | `#E4BC5A` | Hover do destaque |
| Gold 500 | `#D9A83A` | Destaque principal |
| Gold 600 | `#B88A26` | Pressionado / ativo |
| Gold 700 | `#8F6A1B` | Detalhes escuros |

### Texto e Contraste (sobre Navy 900)

| Cor | Hex | Contraste sobre `#0F1F3D` |
|---|---|---|
| Marfim | `#F5EFE0` | 14,3:1 (Texto principal) |
| Azul-névoa | `#B8C2D6` | 9,1:1 (Texto secundário) |
| Dourado | `#D9A83A` | 7,5:1 (Destaques e ícones) |
| Cinza-azul | `#7D8AA5` | 4,7:1 (Texto discreto, placeholders) |

### Interação e estados

| Cor | Hex | Uso / Contraste |
|---|---|---|
| Royal | `#2A4A8C` | Botões e elementos interativos |
| Azul-link | `#6D8FD6` | Links sobre fundo escuro (5,1:1) |
| Sucesso | `#4CB782` | Receita, confirmação (6,5:1) |
| Perigo | `#E5675A` | Despesa, erro (5,0:1) |

---

## Diferenças e Diretrizes de Aplicação

- **Dourado:** No escuro, ele vale com conforto como texto e ícone. No claro, vira preenchimento de botões/badges (com texto Navy `#0F1F3D`), e o texto dourado passa a usar o Gold 700 (`#8F6A1B`) para garantir contraste.
- **Estados:** No claro, as cores semânticas são mais escuras (ex: sucesso `#4CB782` virou `#1F7A4D`) para não sumirem sobre o Ivory.
- **Profundidade:** No escuro, o que está mais "alto" é mais claro (Navy 900 -> 800 -> 700). No claro, a camada vem do branco puro dos cards sobre o ivory, mais uma sombra suave.
- **Links:** No claro, o Royal (`#2A4A8C`) serve tanto de link quanto de botão secundário (8,0:1 sobre ivory). No escuro, links usam Azul-link (`#6D8FD6`).
- **Proporção de uso:** Regra de referência: **80% base/fundo, 15% texto e superfícies, 5% dourado.**
