## ADDED Requirements

### Requirement: Visibilidade de empresas por tenant
O sistema MUST restringir a listagem e a gestão de entidades `Organization` (empresas) ao usuário `master` (acesso global) e ao `admin_legal_organization` cuja `LegalOrganization` está vinculada à empresa. Demais papéis MUST receber acesso negado.

#### Scenario: Master lista todas as empresas
- **WHEN** um usuário `master` autenticado solicita `GET /organizations/`
- **THEN** o sistema retorna todas as empresas cadastradas

#### Scenario: Organização lista apenas suas empresas
- **WHEN** um `admin_legal_organization` autenticado solicita `GET /organizations/`
- **THEN** o sistema retorna somente empresas com `legalOrganizationId` igual ao `legal_organization_id` do usuário

#### Scenario: Outro papel não lista empresas
- **WHEN** um usuário autenticado que não é `master` nem `admin_legal_organization` solicita `GET /organizations/`
- **THEN** o sistema responde com HTTP 403 e mensagem em pt-BR

#### Scenario: Isolamento entre organizações
- **WHEN** um `admin_legal_organization` da matriz A solicita empresas e existe empresa vinculada à matriz B
- **THEN** a empresa da matriz B NÃO aparece na resposta

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

## MODIFIED Requirements

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
