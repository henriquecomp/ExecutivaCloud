## ADDED Requirements

### Requirement: Leitura da própria empresa no onboarding
O sistema MUST permitir que `executive` e `secretary` autenticados leiam apenas a `Organization` cujo `id` é igual ao `organization_id` do usuário. Mutações MUST continuar restritas a `master` e `admin_legal_organization`.

#### Scenario: Executivo lista só a própria empresa
- **WHEN** um `executive` com `organization_id` válido solicita `GET /organizations/`
- **THEN** a resposta contém apenas essa empresa

#### Scenario: Executivo lê a própria empresa por id
- **WHEN** um `executive` solicita `GET /organizations/{id}` da sua empresa
- **THEN** o sistema retorna a empresa

#### Scenario: Executivo não lê outra empresa
- **WHEN** um `executive` solicita `GET /organizations/{id}` de outra empresa
- **THEN** o sistema responde 403

#### Scenario: Executivo não cria empresa
- **WHEN** um `executive` solicita `POST /organizations/`
- **THEN** o sistema responde 403

## MODIFIED Requirements

### Requirement: Visibilidade de empresas por tenant
O sistema MUST restringir a listagem e a gestão de entidades `Organization` (empresas) ao usuário `master` (acesso global) e ao `admin_legal_organization` cuja `LegalOrganization` está vinculada à empresa. Além disso, `executive` e `secretary` MUST poder **ler** apenas a própria empresa (sem mutação). Demais papéis MUST receber acesso negado a listagens/gestão administrativas.

#### Scenario: Master lista todas as empresas
- **WHEN** um usuário `master` autenticado solicita `GET /organizations/`
- **THEN** o sistema retorna todas as empresas cadastradas

#### Scenario: Organização lista apenas suas empresas
- **WHEN** um `admin_legal_organization` autenticado solicita `GET /organizations/`
- **THEN** o sistema retorna somente empresas com `legalOrganizationId` igual ao `legal_organization_id` do usuário

#### Scenario: Papel sem vínculo de empresa não lista
- **WHEN** um usuário autenticado que não é `master`, `admin_legal_organization`, `executive` nem `secretary` (ou executive/secretary sem `organization_id`) solicita `GET /organizations/`
- **THEN** o sistema responde com HTTP 403 e mensagem em pt-BR

#### Scenario: Isolamento entre organizações
- **WHEN** um `admin_legal_organization` da matriz A solicita empresas e existe empresa vinculada à matriz B
- **THEN** a empresa da matriz B NÃO aparece na resposta
