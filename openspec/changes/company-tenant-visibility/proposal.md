## Why

Administradores de organização (`admin_legal_organization`) cadastram empresas, mas a listagem de Empresas não garante que só a organização responsável (e o master) vejam e gerenciem essas empresas. Hoje o endpoint de empresas não aplica escopo de tenant, e o frontend depende só de filtro local — o que falha ou deixa dados inconsistentes.

## What Changes

- Autenticar e escopar `GET/POST/PUT/DELETE /organizations/` por papel:
  - **master**: acesso global a todas as empresas
  - **admin_legal_organization**: apenas empresas vinculadas à sua `LegalOrganization`
  - demais papéis: sem listagem/gestão de empresas (403)
- Forçar no create o vínculo `legalOrganizationId` da matriz autenticada
- Endurecer o carregamento no frontend (evitar corrida que apaga a lista após cadastro) e manter busca + ações de edição/exclusão para a organização responsável
- Testes de regressão cobrindo isolamento entre tenants e acesso master

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova; estende gestão de empresas existente. -->

### Modified Capabilities

- `organization-management`: visibilidade e mutações de `Organization` restritas à organização matriz que cadastrou + master com acesso global

## Impact

- Backend: `organization` router/service (e helper de escopo), testes em `test_security_and_scoping.py` (e correlatos sem auth)
- Frontend: `MainAppLayout.tsx` (carga/refresh), `OrganizationsView.tsx` (listagem/ações)
- Contrato: listagem autenticada e filtrada por tenant (**BREAKING** para clientes anônimos que chamavam `/organizations/` sem token)
- Sem migration de banco
