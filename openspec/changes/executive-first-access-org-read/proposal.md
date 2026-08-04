## Why

O primeiro acesso do executivo quebra com 403 em `GET /organizations/` após o escopo de tenant (só master/matriz). Sem a empresa, departamento e gestor não carregam.

## What Changes

- Permitir leitura da **própria** empresa para `executive` e `secretary` (list/get); writes continuam só master/matriz
- Mapear `organizationId` no usuário executivo e carregar empresa/depts pelo ID da empresa
- Completar labels/mensagens dos campos obrigatórios no formulário de conclusão de perfil
- Manter e-mail de login somente leitura + e-mail adicional opcional; gestor = executivos da mesma empresa

## Capabilities

### New Capabilities

<!-- nenhuma -->

### Modified Capabilities

- `organization-management`: leitura da própria empresa para executive/secretary
- (UX) formulário de conclusão de perfil executivo

## Impact

- Backend: `organization_scope.py`, `organization_service.py`, testes
- Frontend: `authService.ts`, loaders de perfil, `ExecutiveProfileForm.tsx`
- Sem migration
