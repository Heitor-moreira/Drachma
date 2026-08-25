# Convenções de Git do Drachma

## Segurança do trabalho local

- inspecionar `git status` antes de alterar ou preparar arquivos;
- preservar mudanças, arquivos não rastreados, backups e notas fora do escopo;
- preparar explicitamente somente os arquivos da alteração atual;
- nunca usar comandos destrutivos para limpar mudanças existentes;
- nunca fazer push automaticamente; o usuário decide quando publicar.

## Commits

- usar mensagens curtas, em português e no imperativo;
- prefixos permitidos: `feat:`, `fix:`, `docs:`, `refactor:` e `chore:`;
- manter uma ideia por commit;
- validar o diff preparado antes de criar o commit;
- separar código, documentação e migrações quando puderem ser revisados independentemente.

## Verificação antes do commit

```bash
git diff --check
git diff --cached --name-status
```

Executar também as verificações correspondentes em [VALIDACAO_APP.md](./VALIDACAO_APP.md).
