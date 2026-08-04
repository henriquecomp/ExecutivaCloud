## ADDED Requirements

### Requirement: Política de senha NIST/OWASP no convite
O sistema DEVE aplicar, no fluxo de definição de senha via convite (`complete-invite`), uma política alinhada a NIST SP 800-63B e OWASP para senhas memorizadas: comprimento entre 8 e 64 caracteres, sem exigência de regras arbitrárias de composição (maiúscula, dígito ou símbolo obrigatórios) e rejeição de senhas presentes em lista de senhas comuns.

#### Scenario: Senha válida é aceita
- **WHEN** o usuário envia uma senha com 8 a 64 caracteres que não está na lista de senhas comuns e a confirmação coincide
- **THEN** o sistema define a senha e conclui o convite com sucesso

#### Scenario: Senha curta é rejeitada
- **WHEN** o usuário envia uma senha com menos de 8 caracteres
- **THEN** o sistema rejeita com mensagem em pt-BR informando o comprimento mínimo

#### Scenario: Senha longa demais é rejeitada
- **WHEN** o usuário envia uma senha com mais de 64 caracteres
- **THEN** o sistema rejeita com mensagem em pt-BR informando o comprimento máximo

#### Scenario: Senha comum é rejeitada
- **WHEN** o usuário envia uma senha presente na lista de senhas comuns do sistema
- **THEN** o sistema rejeita com mensagem em pt-BR orientando a escolher outra senha

### Requirement: Ajuda contextual na tela de definir senha
A tela de definir senha no primeiro acesso DEVE exibir um ícone de ajuda (`?`) ao lado do campo de nova senha que, ao ser acionado, mostra um popup explicando em pt-BR como formar uma senha segura conforme a política (comprimento, evitar senhas comuns, uso de frase longa ou gerenciador de senha, sem exigência de símbolos).

#### Scenario: Usuário abre a ajuda
- **WHEN** o usuário clica ou ativa o ícone de ajuda no campo de nova senha
- **THEN** um popup com as orientações da política é exibido

#### Scenario: Usuário fecha a ajuda
- **WHEN** o usuário clica fora do popup ou pressiona Escape
- **THEN** o popup é ocultado

### Requirement: Indicador animado de força da senha
A tela de definir senha no primeiro acesso DEVE exibir, enquanto o usuário digita a nova senha, um indicador visual animado classificando a força como fraca, média ou forte, com rótulo textual acessível em pt-BR.

#### Scenario: Senha fraca
- **WHEN** o usuário digita uma senha que não atende à política ou é classificada como fraca pela heurística do sistema
- **THEN** o indicador mostra estado “fraca” com feedback visual distinto (ex.: cor vermelha)

#### Scenario: Senha média
- **WHEN** o usuário digita uma senha que atende à política e é classificada como média
- **THEN** o indicador mostra estado “média” com feedback visual distinto (ex.: cor âmbar)

#### Scenario: Senha forte
- **WHEN** o usuário digita uma senha que atende à política e é classificada como forte
- **THEN** o indicador mostra estado “forte” com feedback visual distinto (ex.: cor verde)

#### Scenario: Envio bloqueado sem política válida
- **WHEN** a senha não atende à política ou a confirmação não coincide
- **THEN** o formulário não envia a requisição de conclusão do convite
