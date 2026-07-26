# FinanFlow — Requisitos Funcionais (baseados em app de referência)

Levantamento extraído de 4 telas de onboarding de um app de controle financeiro (marca "escola do breno"). Serve como base de features para o FinanFlow.

## 1. Saldo diário projetado
- Tela principal lista **dia a dia** do mês: tipo de lançamento, valor e **saldo acumulado** resultante.
- Saldo de cada dia = saldo anterior +/- lançamentos daquele dia (recorrentes + pontuais).
- Navegação entre meses com setas `< mês/ano >`.
- Dias já passados recebem um ✅ ("realizado"); dias futuros ficam sem marcação (projeção).
- Filtro por tipo de lançamento (dropdown, ex: "diários" = gastos fixos do dia a dia).

## 2. Status visual por cor (regra de negócio)
| Cor | Significado |
|---|---|
| Verde | Saldo saudável/positivo |
| Vermelho | Saldo negativo (rombo no caixa) |
| Amarelo/areia | Saldo positivo, mas baixo (zona de atenção) |
| Verde-menta (destaque) | O ponto mais crítico do período (ex: menor saldo do mês) |

## 3. Dashboard mensal ("totais")
- **Performance**: entradas − saídas − gastos diários − economia − cartão → resultado do mês, com veredito em texto ("faltou dinheiro").
- **Economizado**: % da renda guardada, barra de progresso vs. meta, classificação ("abaixo do ideal").
- **Custo de vida**: soma de categorias fixas de despesa, comparado com a renda ("dentro da renda").
- **Diário médio**: gasto médio por dia (total diário ÷ dias já passados) vs. limite diário definido.
- **Movimentações do mês**: totais agregados por tipo (entradas, saídas, etc.).

## 4. Horizonte de saldos (projeção multi-mês)
- Tabela com **vários meses lado a lado**, cada um com a lista de dias e saldo projetado.
- Objetivo: ver o impacto de uma decisão financeira **antes** dela acontecer (ex: uma compra hoje reflete no saldo dos próximos meses).
- Mesma lógica de cores da seção 2 aplicada em cada coluna/mês.

## 5. Tags / Categorias
- Lista de tags com ícone (emoji), nome e valor total no período.
- Ações: criar tag (➕), editar tags (✏️), buscar/filtrar tags.
- Exemplos de tags: `! pagar` (contas a pagar — prefixo "!" como alerta), `viagem`, `saúde`, `compras`.

## 6. Navegação (bottom bar)
- **Saldos** · **Totais** · **+ (adicionar lançamento, botão central)** · **Tags** · **Menu**

## 7. Entidades de dados sugeridas
- `Lancamento`: id, tipo (diário/entrada/saída/cartão/economia), valor, data, tag(s), recorrente (bool)
- `SaldoDiario`: data, saldo_calculado, status (verde/amarelo/vermelho), realizado (bool)
- `Tag`: id, nome, ícone, cor
- `ResumoMensal`: mês, entradas_total, saidas_total, performance, pct_economizado, custo_de_vida, diario_medio

## Estrutura deste pacote
```
FinanFlow/
├── README.md        (este arquivo — requisitos)
├── notes.md         (análise, prioridades e ideias de adaptação)
└── screenshots/     (referência visual do app analisado)
```
