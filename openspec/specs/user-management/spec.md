# Gestão de usuários

## Purpose

Regras de edição e gestão de usuários autenticados em `/users/management`.

## Requirements

### Requirement: Telefone não editável na gestão de usuários
O sistema NÃO DEVE permitir alterar o telefone do usuário pelo fluxo de edição em `/users/management` (modal «Alterar usuário»).

#### Scenario: Administrador abre alteração de usuário
- **WHEN** um gestor autorizado abre o modal de alteração de um usuário
- **THEN** o formulário não exibe campo editável de telefone
- **AND** o PATCH de atualização não inclui `phone`

#### Scenario: Cliente tenta enviar phone no PATCH
- **WHEN** uma requisição PATCH para `/users/management/{id}` inclui apenas campos permitidos (nome, e-mail, status, etc.)
- **THEN** o telefone armazenado permanece inalterado
