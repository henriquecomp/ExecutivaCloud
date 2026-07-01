# Cadastro público de organização jurídica

## Purpose

Validações e regras de UX do formulário público de cadastro de organização jurídica e administrador.

## Requirements

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
O sistema DEVE preencher logradouro, bairro, cidade e UF exclusivamente pela busca de CEP e torná-los somente leitura no formulário.

#### Scenario: CEP válido preenche endereço
- **WHEN** o usuário informa um CEP válido de 8 dígitos e a busca retorna dados
- **THEN** logradouro, bairro, cidade e UF são preenchidos automaticamente
- **THEN** esses campos permanecem somente leitura

#### Scenario: CEP alterado e incompleto limpa endereço
- **WHEN** o usuário tinha um CEP completo com endereço preenchido
- **AND** edita o CEP removendo dígitos e sai do campo (blur) com menos de 8 dígitos
- **THEN** logradouro, bairro, cidade e UF são limpos

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
