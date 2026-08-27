# Acessibilidade e responsividade

Fonte de verdade para comportamento móvel, interação e acessibilidade do Drachma.

## Mobile

- campos editáveis devem usar no mínimo `16px` para evitar zoom automático indesejado;
- não bloquear zoom manual com configurações restritivas de viewport;
- preservar áreas seguras, teclado virtual e conteúdo rolável;
- filtros não podem depender de rolagem horizontal nem cortar rótulos;
- validar larguras estreitas e conteúdo longo em português.

## Interação

- botões somente com ícone precisam de nome acessível;
- modais devem expor semântica de diálogo, título associado e fechamento previsível;
- menus e listas selecionáveis devem permitir teclado, foco visível, `Escape` e clique externo quando aplicável;
- ações destrutivas exigem confirmação e devem explicar o impacto;
- ações inválidas devem permanecer desabilitadas, com motivo visível quando necessário;
- estados vazio, carregando, erro, sucesso e desabilitado devem ser distinguíveis sem depender apenas de cor.

## Validação visual

Conferir no navegador:

- foco e ordem de tabulação;
- abertura e fechamento de menus e modais;
- alinhamento e quebra de texto;
- contraste nos temas claro e escuro;
- toque, swipe e navegação mensal quando existirem;
- ausência de sobreposição com navegação fixa e teclado móvel.
