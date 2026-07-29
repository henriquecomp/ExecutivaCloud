# Gestão de organizações (empresas)

## Purpose

Fluxo autenticado de criação e atualização de entidades `Organization` (empresa/filial) vinculadas a uma `LegalOrganization`.

## Requirements

### Requirement: Gestão de Organization
O sistema DEVE permitir que usuários autenticados com permissão adequada gerenciem entidades `Organization` dentro da sua `LegalOrganization`.

#### Scenario: Criar nova organização
- **WHEN** um `admin_legal_organization` envia dados válidos para uma nova `Organization`
- **THEN** o sistema cria a `Organization` vinculada à `LegalOrganization` do usuário

#### Scenario: Atualizar endereço da organização
- **WHEN** um administrador atualiza o endereço de uma `Organization`
- **THEN** o sistema DEVE validar que todos os campos obrigatórios de endereço (CNPJ, logradouro, número, bairro, cidade, UF, CEP) são enviados em conjunto

#### Scenario: Limpar complemento opcional
- **WHEN** um administrador atualiza uma `Organization` e limpa o campo complemento
- **THEN** o frontend envia `null` para o complemento
- **THEN** o backend atualiza o registro no banco para `null`
