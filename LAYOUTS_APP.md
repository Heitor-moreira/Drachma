# Convenções de layout do Drachma

Fonte de verdade para estrutura, dimensões e posicionamento das interfaces.

## Regra geral

Novas telas devem partir dos padrões já consolidados no app. Um padrão só deve mudar quando a finalidade da tela exigir e a alteração tiver sido aprovada.

## Cabeçalhos com período e filtros

A tela **Saldos** é a referência visual para Tags, Totais, Movimentações do mês e demais telas com navegação de período.

- cabeçalho de período com `76px` de altura;
- período centralizado em `text-2xl`;
- ícones de `24px` (`h-6 w-6`), botões com `p-1` e navegação com `gap-0.5`;
- `px-4` no cabeçalho;
- slots laterais simétricos de `32px` (`w-8`) quando uma ação não existir;
- a seta de voltar tem prioridade; o calendário aparece somente quando não houver volta;
- ações auxiliares existentes devem ser preservadas.

## Linha de filtros

- divisórias superior e inferior;
- `py-3` no contêiner externo;
- controles lado a lado, com gap pequeno, sem rolagem horizontal ou corte;
- redução responsiva de padding e largura interna quando necessário;
- pílula com `h-11`, superfície semântica, borda, sombra suave, texto `text-base font-medium` e chevron à direita;
- ícone de quatro pontos à esquerda, exceto quando o controle exigir um ícone semântico, como ordenação;
- em telas estreitas, conteúdo interno com `py-1` ou `py-1.5`.

## Modais e áreas fixas

- preservar dimensões aprovadas antes de alterar geometria;
- manter cabeçalho, conteúdo rolável e ações sem sobreposição;
- respeitar áreas seguras em dispositivos móveis;
- não ampliar uma correção localizada para problemas visuais fora do escopo.

## Referências relacionadas

- [FONTES_TIPOGRAFICAS.md](./FONTES_TIPOGRAFICAS.md)
- [CORES_APP.md](./CORES_APP.md)
- [ACESSIBILIDADE_RESPONSIVIDADE.md](./ACESSIBILIDADE_RESPONSIVIDADE.md)
