# Drachma

O Drachma é um aplicativo de finanças pessoais, mobile-first, para registrar movimentações manualmente e entender com clareza para onde o dinheiro está indo.

Ele reúne lançamentos, saldos, cartões, recorrências, parcelas, assinaturas e análises por período ou tag em uma interface direta. Os dados permanecem no navegador e podem ser exportados ou importados em JSON.

## O que o Drachma resolve

- centraliza entradas, saídas, economias e gastos com cartão;
- reduz a dificuldade de acompanhar recorrências e compras parceladas;
- separa data financeira, criação do registro e projeções futuras;
- permite localizar movimentações por período, tipo, tag e descrição;
- oferece visão diária, mensal, anual e por horizonte de saldo;
- mantém controle manual e portabilidade dos dados, sem depender de integração bancária.

## Funcionalidades

- criação, edição e exclusão de lançamentos;
- entradas, saídas, economias e gastos com cartão;
- tags múltiplas e filtros de busca;
- recorrências diárias, semanais, mensais e anuais;
- controle de parcelas, cartões, assinaturas e salário;
- saldos diários, totais mensais, economia anual e projeções;
- modos claro e escuro;
- salvamento automático e manual no navegador;
- importação e exportação de backup JSON;
- verificação não bloqueante de novas versões;
- instalação como aplicativo pelo manifesto web.

## Instalação local

Pré-requisitos: Node.js e npm.

```bash
git clone <URL_DO_REPOSITORIO>
cd Drachma
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

Acesse `http://127.0.0.1:3000`.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm test         # testes automatizados
npx tsc --noEmit # verificação de tipos
npm run build    # build de produção
npm run preview  # prévia local do build
```

## Dados e privacidade

O estado do aplicativo é salvo em `localStorage`. O backup JSON contém informações financeiras em texto e deve ser armazenado com cuidado. Consulte [DADOS_E_PERSISTENCIA.md](./DADOS_E_PERSISTENCIA.md) para o contrato atual e os limites de segurança.

## Desenvolvimento

As regras para agentes e contribuidores começam em [AGENTS.md](./AGENTS.md). Convenções específicas de código, interface, validação e Git ficam nos documentos referenciados por ele.
