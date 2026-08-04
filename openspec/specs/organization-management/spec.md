# Gestão de organizações (empresas)

## Purpose

Fluxo autenticado de criação e atualização de entidades `Organization` (empresa/filial) vinculadas a uma `LegalOrganization`. Visibilidade administrativa restrita à organização matriz responsável e ao usuário `master`. Executivos e secretárias podem **ler** apenas a própria empresa (onboarding/perfil).

## Requirements

### Requirement: Gestão de Organization
O sistema DEVE permitir que usuários autenticados com permissão adequada gerenciem entidades `Organization` dentro da sua `LegalOrganization`, e que o `master` gerencie empresas de qualquer matriz. Endpoints de empresa MUST exigir autenticação.

#### Scenario: Criar nova organização
- **WHEN** um `admin_legal_organization` envia dados válidos para uma nova `Organization`
- **THEN** o sistema cria a `Organization` vinculada à `LegalOrganization` do usuário

#### Scenario: Master cria empresa em qualquer matriz
- **WHEN** um `master` envia dados válidos incluindo `legalOrganizationId` de uma matriz existente
- **THEN** o sistema cria a `Organization` vinculada a essa matriz

#### Scenario: Atualizar endereço da organização
- **WHEN** um administrador autorizado atualiza o endereço de uma `Organization` no seu escopo
- **THEN** o sistema DEVE validar que todos os campos obrigatórios de endereço (CNPJ, logradouro, número, bairro, cidade, UF, CEP) são enviados em conjunto

#### Scenario: Limpar complemento opcional
- **WHEN** um administrador autorizado atualiza uma `Organization` e limpa o campo complemento
- **THEN** o frontend envia `null` para o complemento
- **THEN** o backend atualiza o registro no banco para `null`

### Requirement: Visibilidade de empresas por tenant
O sistema MUST restringir a **gestão** de entidades `Organization` ao usuário `master` (acesso global) e ao `admin_legal_organization` cuja `LegalOrganization` está vinculada à empresa. Além disso, `executive` e `secretary` MUST poder **ler** apenas a própria empresa (sem mutação).

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

### Requirement: Cadastro e mutação no escopo da matriz
O sistema MUST vincular novas empresas à matriz do `admin_legal_organization` autenticado e MUST impedir update/delete fora do escopo do ator (exceto `master`).

#### Scenario: Criar empresa como organização
- **WHEN** um `admin_legal_organization` envia `POST /organizations/` com dados válidos
- **THEN** o sistema cria a empresa com `legalOrganizationId` igual ao `legal_organization_id` do usuário (independente de valor divergente no body)

#### Scenario: Atualizar ou excluir empresa da própria matriz
- **WHEN** um `admin_legal_organization` atualiza ou exclui uma empresa da sua matriz
- **THEN** a operação é concluída com sucesso

#### Scenario: Bloquear mutação cross-tenant
- **WHEN** um `admin_legal_organization` tenta atualizar ou excluir empresa de outra matriz
- **THEN** o sistema responde com HTTP 403 ou 404 e não altera o registro
