# Segurança de dados e persistência

Documento de referência para a melhoria gradual da segurança do Drachma.

## Ponto mais crítico atual

O principal ponto de atenção é o fluxo de importação e persistência local:

- `App.tsx` — `importAppData` e `exportAppData`;
- `appStorage.ts` — `validateSnapshot` e `normalizeSnapshot`;
- `hooks/useAppPersistence.ts` — leitura e gravação no `localStorage`.

O Drachma atual não apresenta uma superfície aparente de SQL Injection: não há banco SQL, API de dados ou consultas SQL no frontend. O risco atual é a confiança excessiva em dados fornecidos pelo usuário e armazenados no navegador.

## Pontos de atenção

### 1. Validação insuficiente do JSON importado — prioridade alta

O snapshot valida apenas a existência de `transactions` e alguns campos básicos. Outros dados entram praticamente sem validação profunda:

- `entryType`, datas, valores e recorrências;
- parcelas e limites de cartão;
- `salaryInfo` e descontos;
- `settings`, incluindo `userPhoto`;
- `subscriptions`, `cards` e listas de tags.

Riscos: alteração silenciosa de saldos, classificações incorretas, recorrências indevidas, corrupção de cálculos e arquivos gigantes capazes de degradar a aplicação.

Melhoria gradual:

1. definir um schema completo para o snapshot;
2. validar enums, datas, números finitos, limites e tamanhos;
3. rejeitar campos desconhecidos ou remover campos não permitidos;
4. validar cada coleção, não apenas `transactions`;
5. adicionar testes para snapshots malformados, incompletos e excessivamente grandes.

### 2. Dados financeiros no `localStorage` — prioridade alta

O histórico financeiro, salários, cartões e configurações ficam disponíveis em texto no navegador. Qualquer XSS, extensão maliciosa ou dependência comprometida na mesma origem pode tentar ler esses dados.

Melhoria gradual:

- tratar o `localStorage` como armazenamento não confiável;
- reduzir dados sensíveis armazenados no cliente;
- adotar autenticação e autorização no servidor;
- considerar criptografia local apenas como camada adicional, não como substituto de autorização;
- nunca armazenar segredos de servidor no frontend.

### 3. Backup JSON sem proteção — prioridade média/alta

O backup exportado contém dados financeiros em texto puro e pode ser copiado, enviado ou alterado sem detecção.

Melhoria gradual:

- documentar que o arquivo contém dados sensíveis;
- adicionar checksum ou assinatura para detectar alteração;
- considerar criptografia com senha fornecida pelo usuário;
- validar novamente o arquivo no momento da importação;
- evitar backups automáticos em locais não confiáveis.

### 4. Ausência de limites e invariantes — prioridade média

É necessário restringir valores e estruturas antes de incorporá-los ao estado:

- valores devem ser números finitos e estar dentro de limites razoáveis;
- datas devem seguir o formato esperado e ser datas válidas;
- contagens de parcelas e recorrências devem ser inteiras e limitadas;
- IDs e textos devem ter tamanho máximo;
- arrays devem ter quantidade máxima de itens;
- enums devem aceitar apenas valores conhecidos.

### 5. XSS e URLs externas — prioridade média

Não foram encontrados `eval`, `new Function`, `dangerouslySetInnerHTML` ou uso direto de `innerHTML`. Os textos renderizados pelo React usam escaping padrão.

Ainda assim, `settings.userPhoto` aceita uma URL importada. Deve-se validar o protocolo e, de preferência, aceitar somente `https:` ou imagens locais controladas pelo aplicativo.

## Banco de dados recomendado

### Recomendação principal: Supabase com PostgreSQL

Para o Drachma, a opção mais equilibrada é Supabase/PostgreSQL:

- banco hospedado na web;
- autenticação integrada;
- Row Level Security (RLS) para garantir que cada usuário leia e altere apenas seus próprios dados;
- backups e recursos de recuperação conforme o plano;
- possibilidade de usar uma API sem expor credenciais administrativas.

O RLS deve ser habilitado em todas as tabelas expostas, com políticas baseadas no usuário autenticado. A chave `service_role` jamais deve ir para o navegador. A documentação oficial recomenda RLS combinado com Supabase Auth para proteger o acesso direto pelo cliente.

### Alternativas

#### Neon PostgreSQL

Boa opção se o Drachma tiver uma API própria, por exemplo em Vercel Functions. É PostgreSQL gerenciado, mas a camada de autenticação, autorização e API ficará mais sob responsabilidade do aplicativo.

#### Turso/libSQL

É uma alternativa web próxima do SQLite, útil se a prioridade for compatibilidade com o modelo mental do SQLite. Ainda assim, a autorização por usuário e a proteção da API precisam ser desenhadas cuidadosamente.

## Decisão sugerida

1. Primeiro fortalecer o contrato de importação/exportação sem mudar o armazenamento.
2. Depois introduzir autenticação.
3. Em seguida migrar os dados para Supabase/PostgreSQL com uma coluna `user_id` em todas as entidades financeiras.
4. Habilitar RLS antes de liberar o acesso pelo frontend.
5. Manter exportação e importação como mecanismo de backup e migração, não como fonte confiável de autorização.

O SQLite local continua útil para modo offline ou protótipo. Para dados financeiros sincronizados e acessíveis pela web, recomendo Supabase/PostgreSQL, desde que Auth, RLS, políticas e chaves sejam configurados corretamente.

## Referências oficiais

- [Supabase Database](https://supabase.com/docs/guides/database/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API Security](https://supabase.com/docs/guides/api/securing-your-api)
- [Turso/libSQL](https://docs.turso.tech/libsql)
