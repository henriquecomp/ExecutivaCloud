# E-mail de convite — branding HMR

## Purpose

Conteúdo, formato e identidade visual do e-mail de convite para definição de senha no Executiva Cloud.

## Requirements

### Requirement: E-mail de convite com branding HMR / Executiva Cloud
O sistema DEVE enviar o e-mail de convite para definição de senha com conteúdo profissional em pt-BR, identificando a HMR e o produto Executiva Cloud. O e-mail DEVE incluir saudação com o nome do destinatário, chamada clara para criar a senha e o link de `set-password` fornecido pelo backend.

#### Scenario: Cadastro público dispara convite profissional
- **WHEN** uma organização é cadastrada pela tela pública de cadastro (fluxo de login)
- **THEN** o administrador recebe um e-mail cujo assunto referencia Executiva Cloud e HMR
- **THEN** o corpo cumprimenta pelo nome e orienta a criação da senha
- **THEN** o e-mail contém o link de definição de senha (`flow=set-password` com token)

#### Scenario: Convite interno usa o mesmo padrão
- **WHEN** um usuário é convidado pelo fluxo autenticado de convite
- **THEN** o e-mail segue o mesmo padrão profissional de branding e copy do cadastro público

### Requirement: Convite em HTML com fallback texto
O sistema DEVE enviar o e-mail de convite em formato multipart contendo versão HTML e alternativa em texto puro, ambas com o mesmo link de criação de senha e aviso para ignorar o e-mail se o acesso não foi solicitado.

#### Scenario: Cliente de e-mail renderiza HTML
- **WHEN** o destinatário abre o e-mail em um cliente que aceita HTML
- **THEN** a mensagem apresenta layout estruturado (cabeçalho/marca, texto, CTA e rodapé de segurança)

#### Scenario: Cliente de e-mail só texto
- **WHEN** o destinatário abre o e-mail em um cliente que não renderiza HTML
- **THEN** a alternativa text/plain permanece legível e inclui o link de criação de senha

### Requirement: Cores do e-mail alinhadas ao menu
O sistema DEVE renderizar o HTML do e-mail de convite com a paleta slate escura do menu lateral (preto/cinza), e NÃO DEVE usar indigo/azul como cor principal de cabeçalho ou CTA.

#### Scenario: Cabeçalho e CTA no tom do menu
- **WHEN** o destinatário abre o e-mail de convite em HTML
- **THEN** o cabeçalho e o botão de ação usam tons slate escuros equivalentes ao menu (`slate-800` / `slate-900`)
- **THEN** o texto sobre esses fundos permanece claro e legível

#### Scenario: Sem indigo como cor de marca no HTML
- **WHEN** o template HTML do convite é gerado
- **THEN** não há uso de indigo (`#4f46e5` ou equivalente) no cabeçalho nem no botão CTA
