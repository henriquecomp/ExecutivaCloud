# Bootstrap do usuário master

## Purpose

Permitir a criação segura do primeiro usuário `master` da plataforma, protegido por token de setup.

## Requirements

### Requirement: Endpoint de bootstrap do usuário master
O sistema DEVE fornecer um endpoint para criar o usuário `master` inicial, protegido por um token de setup. O fluxo NÃO DEVE aplicar validações de vínculo com empresa (`admin_company`).

#### Scenario: Criação bem-sucedida
- **WHEN** uma requisição é feita ao endpoint de bootstrap com um header `X-Setup-Token` válido e dados válidos do usuário (e-mail, senha, nome completo)
- **AND** não existe usuário com o papel `master` no banco de dados
- **THEN** o sistema cria o usuário com o papel `master`
- **THEN** o sistema retorna status 201 e um access token (`TokenResponse`)
- **THEN** o sistema NÃO retorna a mensagem `"Administrador da empresa deve estar vinculado a uma empresa."`

#### Scenario: Token de setup inválido
- **WHEN** uma requisição é feita com header `X-Setup-Token` incorreto ou ausente
- **THEN** o sistema rejeita a requisição com erro de não autorizado

#### Scenario: Superusuário já cadastrado
- **WHEN** uma requisição é feita com header `X-Setup-Token` válido
- **AND** já existe usuário com o papel `master` no banco de dados
- **THEN** o sistema retorna status 400
- **THEN** o `detail` informa que o superusuário já foi cadastrado (pt-BR)
