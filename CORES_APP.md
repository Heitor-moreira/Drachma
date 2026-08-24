# Padrão de cores do Drachma

Fonte de verdade para a criação ou alteração de qualquer tela, componente, botão, modal, formulário, tabela, gráfico, ícone ou outro asset visual.

## Regra principal

Consultar este arquivo antes de criar novos assets. Usar os tokens e combinações abaixo sempre que a função visual já estiver contemplada. Não introduzir novas cores sem atualizar este inventário e justificar a exceção.

## Cores de marca

| Token | Cor | Uso |
|---|---|---|
| `brand` | `#35B784` | marca, ações principais, destaques e gráficos |
| `danger` | `#B8353A` | erros, exclusões, saídas e saldos negativos |
| `accent-ochre` | `#C58A3A` | complemento da marca, saldos neutros/zerados e atenção |

`#1D6BA0` está removido e não deve ser usado.

## Modo claro

| Token | Cor | Uso |
|---|---|---|
| `light-background` | `#F8FAFC` | fundo geral |
| `light-surface` | `#FFFFFF` | cards, modais e áreas principais |
| `light-surface-secondary` | `#F1F5F9` | superfícies secundárias |
| `light-text-primary` | `#1E293B` | texto principal; azul-escuro acinzentado, não preto puro |
| `light-text-secondary` | `#64748B` | textos auxiliares |
| `light-border` | `#E2E8F0` | bordas e divisores |

## Modo escuro

| Token | Cor | Uso |
|---|---|---|
| `dark-background` | `#000000` | fundo geral OLED |
| `dark-surface` | `#050505` | cards, modais e áreas principais |
| `dark-surface-secondary` | `#0D0D0D` | superfícies secundárias |
| `dark-text-primary` | `#F8FAFC` | texto principal |
| `dark-text-secondary` | `#C4CBD1` | textos auxiliares |
| `dark-border` | `#262626` | bordas e divisores |

O modo escuro usa uma escala OLED neutra, com preto real no fundo e tons quase pretos nas superfícies. Não combinar superfícies `slate` azuladas com as superfícies neutras do app.

## Estados de saldo

### Positivo

- Claro: fundo `#E8F7F1`, texto `#176B4D`.
- Escuro: fundo `#163D32`, texto `#75D6AF`.

### Negativo

- Claro: fundo `#FBEAEC`, texto `#8F2B31`.
- Escuro: fundo `#4A2226`, texto `#F08A8E`.
- A cor-base semântica é sempre `#B8353A`.

### Neutro ou saldo zero

- Claro: fundo `#FFF3D6`, texto `#79551F`.
- Escuro: fundo `#51401F`, texto `#F0C875`.
- A cor-base complementar é sempre o ocre `#C58A3A`.

## Regras de uso

1. Usar `#35B784` como verde oficial da marca.
2. Usar `#B8353A` quando houver necessidade de vermelho.
3. Usar `#C58A3A` como complementar quente ao verde, principalmente em células de saldo neutro/zerado.
4. No modo claro, usar `#1E293B` para texto principal em vez de preto puro.
5. No modo escuro, usar as superfícies e textos definidos na seção correspondente.
6. Priorizar classes ou tokens semânticos centralizados; evitar hexadecimais espalhados diretamente nos componentes.
7. Preservar contraste suficiente entre texto, fundo, borda e estados interativos nos dois temas.
