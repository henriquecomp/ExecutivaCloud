# Cadastro público de organização jurídica

## Purpose

Validações e regras de UX do formulário público de cadastro de organização jurídica e administrador, e alinhamento dos formulários autenticados de organização jurídica e empresa (endereço via CEP, máscaras e imutabilidade de CNPJ).

## Requirements

### Requirement: Cadastro público de tenant
O sistema DEVE fornecer um endpoint público para cadastrar uma nova `LegalOrganization` e seu primeiro usuário administrador.

#### Scenario: Cadastro bem-sucedido
- **WHEN** o usuário envia dados válidos da organização (CNPJ, endereço) e do administrador (nome, e-mail)
- **THEN** o sistema cria uma `LegalOrganization` e um usuário com o papel `admin_legal_organization`
- **THEN** o sistema envia e-mail de convite para o administrador definir a senha

#### Scenario: CNPJ inválido no cadastro público
- **WHEN** o usuário envia um CNPJ inválido
- **THEN** o sistema rejeita a requisição com erro de validação em pt-BR

#### Scenario: Endereço incompleto no cadastro público
- **WHEN** o usuário envia endereço sem campos obrigatórios (ex.: bairro ou cidade)
- **THEN** o sistema rejeita a requisição com erro de validação

### Requirement: Normalização do complemento no cadastro
O sistema DEVE normalizar o complemento opcional no cadastro público.

#### Scenario: Complemento vazio
- **WHEN** o usuário envia o formulário de cadastro com complemento vazio
- **THEN** o frontend envia `null` no campo `legalComplement`
- **THEN** o backend persiste `null` no banco

### Requirement: Razão social com pelo menos dois nomes
O sistema DEVE exigir que a razão social contenha pelo menos duas palavras separadas por espaço.

#### Scenario: Razão social válida
- **WHEN** o usuário informa razão social com duas ou mais palavras (ex.: `STELLANTIS DO BRASIL`)
- **THEN** a validação é aceita

#### Scenario: Razão social com um único nome
- **WHEN** o usuário informa razão social com apenas uma palavra (ex.: `STELLANTIS`)
- **THEN** o sistema rejeita com mensagem em pt-BR informando que são necessários pelo menos dois nomes

### Requirement: CNPJ numérico e alfanumérico
O sistema DEVE validar CNPJ nos formatos numérico (legado) e alfanumérico (12 posições A–Z/0–9 + 2 dígitos verificadores numéricos), conforme IN RFB 2.229/2024.

#### Scenario: CNPJ numérico válido
- **WHEN** o usuário informa um CNPJ numérico válido com 14 dígitos
- **THEN** a validação é aceita

#### Scenario: CNPJ alfanumérico válido
- **WHEN** o usuário informa um CNPJ alfanumérico válido (ex.: letras nas 12 primeiras posições e DV numérico)
- **THEN** a validação é aceita

#### Scenario: CNPJ inválido
- **WHEN** o usuário informa CNPJ com formato ou dígito verificador incorreto
- **THEN** o sistema rejeita com mensagem em pt-BR

### Requirement: Endereço controlado pelo CEP
O sistema DEVE preencher logradouro (rua), bairro, cidade e UF exclusivamente pela busca de CEP e torná-los somente leitura. Essa regra DEVE valer no formulário público de cadastro de organização jurídica e nos formulários autenticados de organização jurídica e de empresa. Número e complemento DEVEM permanecer editáveis.

#### Scenario: CEP válido preenche endereço
- **WHEN** o usuário informa um CEP válido de 8 dígitos e a busca retorna dados
- **THEN** logradouro, bairro, cidade e UF são preenchidos automaticamente
- **THEN** esses campos permanecem somente leitura

#### Scenario: CEP alterado e incompleto limpa endereço
- **WHEN** o usuário tinha um CEP completo com endereço preenchido
- **AND** edita o CEP removendo dígitos e sai do campo (blur) com menos de 8 dígitos
- **THEN** logradouro, bairro, cidade e UF são limpos

#### Scenario: Formulário autenticado de organização jurídica bloqueia endereço
- **WHEN** o usuário abre o formulário autenticado de criar ou editar organização jurídica
- **THEN** rua/logradouro, bairro, cidade e UF são somente leitura
- **THEN** CEP, número e complemento permanecem editáveis

#### Scenario: Formulário de empresa bloqueia endereço
- **WHEN** o usuário abre o formulário de criar ou editar empresa
- **THEN** rua/logradouro, bairro, cidade e UF são somente leitura
- **THEN** CEP, número e complemento permanecem editáveis

### Requirement: Nome completo do administrador com dois nomes
O sistema DEVE exigir que o nome completo do administrador contenha pelo menos duas palavras.

#### Scenario: Nome completo válido
- **WHEN** o usuário informa nome com duas ou mais palavras (ex.: `Raythan Karabasappa`)
- **THEN** a validação é aceita

#### Scenario: Nome com um único nome
- **WHEN** o usuário informa apenas um nome (ex.: `Raythan`)
- **THEN** o sistema rejeita com mensagem em pt-BR

### Requirement: Confirmação de e-mail do administrador
O sistema DEVE exigir dupla digitação do e-mail do administrador e validar que ambos coincidem.

#### Scenario: E-mails coincidem
- **WHEN** o usuário informa e-mail e confirmação idênticos
- **THEN** o cadastro pode prosseguir

#### Scenario: E-mails divergentes
- **WHEN** o usuário informa e-mail e confirmação diferentes
- **THEN** o sistema rejeita com mensagem em pt-BR (ex.: `E-mail e confirmação não coincidem.`)

### Requirement: Inputs do cadastro sem placeholder
O sistema DEVE renderizar os inputs do formulário público de cadastro de organização jurídica e administrador sem atributo `placeholder`. A identificação do campo DEVE vir exclusivamente do rótulo (label) visível.

#### Scenario: Formulário sem placeholders
- **WHEN** o usuário abre a tela de cadastro de organização
- **THEN** nenhum input do formulário (organização jurídica e administrador) apresenta texto de placeholder
- **THEN** cada campo permanece identificado pelo respectivo label

#### Scenario: Campos que antes tinham exemplo
- **WHEN** o usuário foca nos campos Razão social ou Nome completo
- **THEN** o input permanece vazio até a digitação do usuário
- **THEN** não há texto de exemplo no interior do campo

### Requirement: Máscaras de CNPJ e CEP nos formulários de organização
O sistema DEVE aplicar máscara de CNPJ e de CEP nos formulários de cadastro e edição de organização jurídica e de empresa, inclusive ao abrir o popup de edição com dados já existentes. Os valores exibidos DEVEM estar formatados (pontuação da máscara), mesmo quando a API armazena/retorna o valor sem máscara.

#### Scenario: Digitação aplica máscara no cadastro
- **WHEN** o usuário digita CNPJ ou CEP no formulário de criação
- **THEN** o valor no input é exibido com a máscara correspondente (`maskCNPJ` / `maskCEP`)

#### Scenario: Popup de edição abre com valores mascarados
- **WHEN** o usuário abre o formulário de edição de organização jurídica ou empresa com CNPJ e CEP já salvos
- **THEN** o CNPJ é exibido mascarado
- **THEN** o CEP é exibido mascarado

### Requirement: CNPJ imutável após o cadastro
O sistema DEVE impedir a alteração do CNPJ de organização jurídica e de empresa após a criação. Na UI de edição o campo DEVE ser somente leitura. A API DEVE rejeitar tentativa de alterar o CNPJ em update. O sistema DEVE aceitar update quando o CNPJ enviado for o mesmo já persistido, independentemente de máscara/formatação.

#### Scenario: Edição na UI não permite alterar CNPJ
- **WHEN** o usuário abre o formulário de edição de uma organização jurídica ou empresa já cadastrada
- **THEN** o campo CNPJ está somente leitura
- **THEN** o usuário ainda pode editar demais campos permitidos (ex.: nome, CEP, número, complemento)

#### Scenario: API rejeita mudança de CNPJ
- **WHEN** uma requisição de update envia um CNPJ normalizado diferente do persistido
- **THEN** o sistema rejeita com status 400 e mensagem `CNPJ não pode ser alterado.`

#### Scenario: Salvar edição sem mudar CNPJ (com máscara)
- **WHEN** o usuário edita organização jurídica ou empresa e salva com o mesmo CNPJ exibido mascarado
- **THEN** a atualização é aceita (status 2xx)
- **THEN** o sistema NÃO retorna `CNPJ não pode ser alterado.`

#### Scenario: Update com mesmo CNPJ ou sem CNPJ
- **WHEN** uma requisição de update omite o CNPJ ou envia o mesmo CNPJ já persistido
- **THEN** a atualização dos demais campos pode prosseguir (se válidos)
