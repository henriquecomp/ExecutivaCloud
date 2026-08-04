## ADDED Requirements

### Requirement: CAPTCHA obrigatório no cadastro público
O sistema DEVE exigir token de CAPTCHA válido no cadastro público de organização jurídica (`POST /auth/register-organization`). O frontend DEVE exibir o widget de verificação e o backend DEVE validar o token com o provedor configurado antes de processar o cadastro.

#### Scenario: Cadastro sem token de CAPTCHA
- **WHEN** o cliente envia o formulário de cadastro público sem `captchaToken`
- **THEN** o sistema rejeita a requisição com erro em pt-BR sem processar o cadastro

#### Scenario: Cadastro com CAPTCHA inválido
- **WHEN** o cliente envia `captchaToken` inválido ou expirado
- **THEN** o sistema rejeita a requisição com erro genérico em pt-BR
- **THEN** nenhuma organização ou usuário é criado

#### Scenario: Cadastro com CAPTCHA válido
- **WHEN** o cliente envia dados válidos e `captchaToken` verificado com sucesso pelo backend
- **THEN** o fluxo de cadastro pode prosseguir conforme as demais regras do endpoint

#### Scenario: Formulário bloqueia envio sem CAPTCHA
- **WHEN** o usuário preenche o formulário público mas não conclui o CAPTCHA
- **THEN** o botão de envio permanece desabilitado ou o envio é impedido no frontend

## MODIFIED Requirements

### Requirement: Cadastro público de tenant
O sistema DEVE fornecer um endpoint público para cadastrar uma nova `LegalOrganization` e seu primeiro usuário administrador. Quando o e-mail do administrador ou o CNPJ da organização já existir na base, o sistema DEVE responder com a mesma mensagem de sucesso e status de cadastro bem-sucedido, sem revelar que o identificador já está cadastrado e sem criar novos registros nem enviar e-mail.

#### Scenario: Cadastro bem-sucedido
- **WHEN** o usuário envia dados válidos da organização (CNPJ, endereço) e do administrador (nome, e-mail) com CAPTCHA válido
- **AND** o e-mail e o CNPJ não existem previamente na base
- **THEN** o sistema cria uma `LegalOrganization` e um usuário com o papel `admin_legal_organization`
- **THEN** o sistema envia e-mail de convite para o administrador definir a senha
- **THEN** a resposta contém mensagem genérica de sucesso em pt-BR

#### Scenario: E-mail do administrador já cadastrado
- **WHEN** o usuário envia cadastro público com e-mail de administrador que já existe na base
- **AND** o CAPTCHA é válido
- **THEN** o sistema NÃO cria organização nem usuário
- **THEN** o sistema NÃO envia e-mail
- **THEN** a resposta HTTP e a mensagem são indistinguíveis de um cadastro bem-sucedido

#### Scenario: CNPJ já cadastrado
- **WHEN** o usuário envia cadastro público com CNPJ já existente na base
- **AND** o CAPTCHA é válido
- **THEN** o sistema NÃO cria organização nem usuário
- **THEN** o sistema NÃO envia e-mail
- **THEN** a resposta HTTP e a mensagem são indistinguíveis de um cadastro bem-sucedido

#### Scenario: CNPJ inválido no cadastro público
- **WHEN** o usuário envia um CNPJ inválido
- **THEN** o sistema rejeita a requisição com erro de validação em pt-BR

#### Scenario: Endereço incompleto no cadastro público
- **WHEN** o usuário envia endereço sem campos obrigatórios (ex.: bairro ou cidade)
- **THEN** o sistema rejeita a requisição com erro de validação
