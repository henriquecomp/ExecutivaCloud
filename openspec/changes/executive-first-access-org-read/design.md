## Context

`company-tenant-visibility` restringiu `/organizations` a managers. O primeiro acesso chama `organizationService.getAll()` / `getOne` e recebe 403.

## Goals / Non-Goals

**Goals:** leitura da própria empresa para executive/secretary; FE carrega empresa/depts/gestores; labels de obrigatoriedade no perfil.

**Non-Goals:** incluir admin_company no gestor (FK só para Executive); tabela BC no banco (lista COMPE estática permanece); remover e-mail adicional.

## Decisions

1. Read scope: `executive`/`secretary` com `organization_id` veem só essa empresa em GET list/get.
2. Writes: `assert_organization_manager` inalterado.
3. FE: mapear `organizationId` no executive; carregar via `getOne` usando user ou executive.organizationId.
4. Gestor: filtrar executivos da mesma empresa (já existente após load).

## Risks / Trade-offs

- [Risk] Spec anterior dizia 403 para não-managers → Mitigation: delta permitindo read-own
