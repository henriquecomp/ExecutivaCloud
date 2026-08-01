## Why

Na tela de alteração de usuário (gestão), o telefone não deve ser editável pelo administrador — o contato é definido no fluxo de conclusão de perfil do próprio usuário (issue GitHub #8).

## What Changes

- Remover o campo Telefone do modal «Alterar usuário» no frontend.
- Deixar de enviar `phone` no PATCH de `/users/management/{id}`.
- Remover `phone` do schema `UserManagementPatch` e ignorar tentativas de alteração no service (contrato da API).

## Capabilities

### New Capabilities

- `user-management`: regras de edição de usuários pela gestão (sem alteração de telefone).

### Modified Capabilities

<!-- Nenhuma spec principal existente cobre gestão de usuários. -->

## Impact

- Frontend: `UserManagementView.tsx`, `userManagementService.ts`.
- Backend: `user_schema.py`, `user_management_service.py`.
- Sem migration.
