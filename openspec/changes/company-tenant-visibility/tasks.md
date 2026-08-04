## 1. Backend — escopo de tenant

- [x] 1.1 Criar `organization_scope.py` (filter/assert para master e admin_legal_organization)
- [x] 1.2 Atualizar `OrganizationService` para list/get/create/update/delete com escopo e forçar `legalOrganizationId` no create da matriz
- [x] 1.3 Exigir `get_current_user` no router `organization.py` e mapear 403/404 com detail em pt-BR

## 2. Frontend — listagem estável

- [x] 2.1 Adicionar geração/Abort em `loadCoreData` no `MainAppLayout` para descartar respostas obsoletas
- [x] 2.2 Em `OrganizationsView`, após create bem-sucedido atualizar estado com a resposta e manter busca/edição/exclusão para admin de matriz
- [x] 2.3 Corrigir import de `FREE_TEXT_MAX` no formulário de departamento em `OrganizationsView` se ainda faltar

## 3. Testes e entrega

- [x] 3.1 Adicionar pytest: matriz vê/cria só suas empresas; cross-tenant bloqueado; master vê todas
- [x] 3.2 Ajustar testes existentes de `/organizations/` para autenticar
- [x] 3.3 Rodar pytest afetados, commit e push seguro em `origin/main` (sem force)
