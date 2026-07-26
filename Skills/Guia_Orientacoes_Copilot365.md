# Guia de Orientação para Resolução de Problemas e Planejamento com Microsoft Copilot 365

Este guia reúne metodologias e estruturas de prompts para orientar o Copilot Pro / Microsoft 365 na investigação de erros, condução de sessões de *brainstorming* e estruturação de planos de ação em projetos do seu dia a dia.

---

## 🔍 1. Investigar Erros e Depuração Sistemática

Utilize esta estrutura quando encontrar falhas em scripts, planilhas, fluxos do Power Automate ou comportamentos inesperados em sistemas.

### Instruções para o Copilot
> *"Atue como um especialista em depuração e análise de causa raiz. Siga a metodologia de depuração sistemática contida nas instruções abaixo para me ajudar a diagnosticar o problema de forma estruturada. Não sugira soluções precipitadas antes de isolarmos a causa exata."*

### Roteiro de Análise:
1. **Coleta de Evidências:**
   - Descreva a mensagem de erro exata ou o comportamento inesperado recebido.
   - Forneça o contexto do ambiente (ex.: Power Automate, Excel, código Python/C++, API).
2. **Isolamento de Variáveis:**
   - Peça ao Copilot para identificar em qual etapa exata o fluxo/código falha.
   - Liste o que mudou no sistema entre o funcionamento correto e a ocorrência da falha.
3. **Formulação e Teste de Hipóteses:**
   - Solicite que o Copilot proponha 2 a 3 hipóteses ordenadas por probabilidade.
   - Execute testes incrementais para validar ou descartar cada hipótese sequencialmente.
4. **Resolução e Prevenção:**
   - Aplique a correção na causa raiz identificada.
   - Documente a solução e adicione verificações de borda para evitar retrabalho futuro.

---

## 💡 2. Brainstorming e Estruturação de Ideias

Utilize este fluxo nas fases iniciais de um projeto, criação de automações ou definição de novos processos.

### Instruções para o Copilot
> *"Atue como um facilitador de inovação e arquiteto de soluções. Siga o guia de brainstorming abaixo para me fazer perguntas iterativas antes de propor uma solução final."*

### Roteiro de Análise:
1. **Definição de Objetivos:**
   - Qual o problema principal que esta solução deve resolver?
   - Quais são os entregáveis esperados ao final do processo?
2. **Mapeamento de Restrições e Contexto:**
   - Quais ferramentas e tecnologias devem ser utilizadas prioritariamente?
   - Existem limitações técnicas, de prazo ou de permissões/acessos?
3. **Sessão Iterativa de Perguntas:**
   - Faça 3 a 5 perguntas pontuais para esclarecer pontos cegos do projeto.
   - Aguarde minhas respostas antes de gerar o documento preliminar de arquitetura ou fluxo.
4. **Síntese e Mapeamento de Propostas:**
   - Apresente abordagens alternativas (ex.: abordagem simples vs. abordagem altamente escalável).
   - Destaque prós, contras e nível de esforço de cada alternativa.

---

## 📋 3. Elaboração e Execução de Planos de Ação

Utilize esta estrutura para transformar uma ideia ou requisito de projeto em etapas claras e executáveis.

### Instruções para o Copilot
> *"Com base nos requisitos fornecidos, atue como um gerente de projetos técnico. Crie um plano de ação detalhado, dividido em marcos (*milestones*) e microtarefas encadeadas logicamente."*

### Roteiro de Análise:
1. **Divisão em Fases (*Phases & Milestones*):**
   - **Fase 1: Preparação e Configuração de Ambiente** (Permissões, dados de entrada, dependências).
   - **Fase 2: Desenvolvimento do Núcleo da Solução** (Lógica principal, integração de APIs, regras de negócio).
   - **Fase 3: Validação e Testes** (Testes funcionais, tratamento de exceções).
   - **Fase 4: Implantação e Documentação** (Entrega final, manuais de uso e transferência de conhecimento).
2. **Estrutura de Cada Tarefa:**
   - Descrição objetiva da ação.
   - Critério de aceite (como saber que a tarefa foi concluída com sucesso).
   - Dependências prévias necessárias.
3. **Acompanhamento de Progresso:**
   - Atualize o status de cada microtarefa à medida que for executada.
   - Registre eventuais bloqueios para ajuste imediato do plano.
