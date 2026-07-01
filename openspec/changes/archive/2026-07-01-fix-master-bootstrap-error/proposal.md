## Why

Ao cadastrar o superusuário (`master`) via bootstrap, a API está retornando status 400 com a mensagem `"Administrador da empresa deve estar vinculado a uma empresa."`, que é indevida para esse fluxo. O bootstrap do master deve criar o primeiro superusuário quando não houver nenhum, ou informar claramente que o superusuário já foi cadastrado.

## What Changes

- Corrigir o fluxo de `POST /auth/bootstrap-master` para nunca aplicar validação de escopo de `admin_company`.
- Garantir mensagem pt-BR adequada quando o superusuário já existir: `"O superusuário já foi cadastrado."`.
- Adicionar teste de regressão que assegura que o bootstrap não retorna erro de vínculo com empresa.
- Reforçar na spec que `POST /users/` não é o caminho para criar master.

## Capabilities

### New Capabilities

### Modified Capabilities
- `master-user-bootstrap`: Ajustar requisitos de criação, mensagens de erro e cenários de regressão do bootstrap do master.

## Impact

- **Backend**: `tenant_scope.py`, `auth_service.py`, testes em `test_security_and_scoping.py`.
- **Spec principal**: `openspec/specs/master-user-bootstrap/spec.md`.
