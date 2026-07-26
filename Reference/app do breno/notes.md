# Notas de análise — app de referência → FinanFlow

## Contexto
As 4 telas analisadas são material de onboarding/marketing de um app de finanças pessoais
(possivelmente vinculado a um curso, "escola do breno"). O foco do app não é registrar
gastos passados — é **projetar o saldo futuro** com base em lançamentos recorrentes
("diários") e pontuais. Esse é o diferencial em relação a apps de controle financeiro comuns.

## O que vale copiar para o FinanFlow (prioridade)

**Alta prioridade (núcleo do produto):**
1. Saldo diário projetado — sem isso o app não tem diferencial nenhum.
2. Cor por status (verde/amarelo/vermelho) — dá leitura instantânea sem precisar interpretar números.
3. Dashboard mensal com performance (entradas − saídas) e % economizado.

**Média prioridade:**
4. Horizonte multi-mês — é a feature mais "wow", mas pode vir depois do saldo diário de 1 mês
   estar sólido. Tecnicamente é o mesmo cálculo, só repetido para N meses.
5. Tags/categorias com total por tag.

**Baixa prioridade / polimento:**
6. Marcação de "realizado" (checkmark) nos dias passados.
7. Destaque especial (verde-menta) para o dia de saldo mínimo do mês — é um detalhe de UX,
   não afeta o cálculo, mas ajuda o usuário a identificar o "fundo do poço" do mês.

## Cálculo do saldo diário (como interpretei pelas imagens)
```
saldo[dia] = saldo[dia - 1] - lancamentos_do_dia
```
Os "diários" parecem ser um valor fixo recorrente (ex: R$ 142,83 repetido em quase todos
os dias) — provavelmente o orçamento diário definido pelo usuário, não um gasto real
lançado manualmente. Isso é diferente de um app tradicional: aqui o "diário" funciona como
uma **despesa fixa projetada**, não como transação real.

## Cálculo do "custo de vida" e "performance" (tela de totais)
Os ícones ao lado de cada métrica parecem ser a fórmula, tipo legenda:
- `performance = entradas − saídas − diário − economia − cartão − diário(recorrente)`
- `custo de vida = saídas + diário + cartão + diário(recorrente)`

Não é 100% garantido pela imagem — os ícones são pequenos. **Recomendo validar essa fórmula
com o usuário do FinanFlow antes de travar a lógica**, porque errar aqui distorce todo o
dashboard.

## Pontos de atenção / dúvidas em aberto
- Como o app trata lançamentos que se repetem em múltiplos meses no "horizonte de saldos"?
  Parece que o saldo inicial de cada mês carrega o saldo final do mês anterior.
- A tag "! pagar" usa "!" como prefixo — pode ser uma convenção de nomenclatura (tags que
  começam com símbolo aparecem destacadas/no topo da lista). Vale considerar isso no
  FinanFlow como forma simples de "pin" sem precisar de campo extra no banco.
- Não há sinal de conciliação bancária/import automático nessas telas — parece ser 100%
  lançamento manual. Bom saber para não assumir integração bancária como requisito implícito.

## Nota sobre a pasta screenshots/
As 4 imagens enviadas ficaram salvas no sistema de arquivos sob o mesmo nome, então apenas
**1 arquivo físico** foi recuperado (`01_referencia_app.png`). A análise acima, porém, cobre
as 4 telas completas, pois todas apareceram no conteúdo da conversa. Se quiser as 4 imagens
separadas na pasta, é só reenviar cada uma com nome de arquivo diferente e eu recoloco aqui.
