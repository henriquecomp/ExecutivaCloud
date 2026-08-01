## Why

Issue GitHub #7: convite e conclusão de perfil do usuário executivo (erro ao carregar dados, nome com dois nomes, escopo de API).

## What Changes

- Convite: nome com pelo menos dois nomes (BE + FE).
- Executivo no primeiro acesso pode ler o próprio cadastro e listar executivos da mesma empresa.
- Preencher `workEmail` com o e-mail de login ao carregar o perfil.
- Itens restantes da issue (rótulos, máscaras, banco BC, remoção de campos HR, etc.) permanecem em follow-up.

## Capabilities

### New Capabilities

- `user-onboarding`: convite e conclusão de perfil executivo.

## Impact

- `auth_schema.py`, `InviteUserForm.tsx`, `executive_service.py`, `executive_scope.py`, `CompleteExecutiveProfileView.tsx`.
