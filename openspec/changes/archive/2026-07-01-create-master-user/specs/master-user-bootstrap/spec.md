## ADDED Requirements

### Requirement: Endpoint de bootstrap do usuário master
O sistema DEVE fornecer um endpoint para criar o usuário `master` inicial, protegido por um token de setup.

#### Scenario: Criação bem-sucedida
- **WHEN** uma requisição é feita ao endpoint de bootstrap com um header `X-Setup-Token` válido e dados válidos do usuário (e-mail, senha, nome completo)
- **AND** não existe usuário com o papel `master` no banco de dados
- **THEN** o sistema cria o usuário com o papel `master`
- **THEN** o sistema retorna um access token (`TokenResponse`)

#### Scenario: Token de setup inválido
- **WHEN** uma requisição é feita com header `X-Setup-Token` incorreto ou ausente
- **THEN** o sistema rejeita a requisição com erro de não autorizado

#### Scenario: Usuário master já existe
- **WHEN** uma requisição é feita com header `X-Setup-Token` válido
- **AND** já existe usuário com o papel `master` no banco de dados
- **THEN** o sistema rejeita a requisição para impedir a criação de múltiplos usuários master ou a substituição do existente
