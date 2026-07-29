## ADDED Requirements

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
O sistema DEVE impedir a alteração do CNPJ de organização jurídica e de empresa após a criação. Na UI de edição o campo DEVE ser somente leitura. A API DEVE rejeitar tentativa de alterar o CNPJ em update.

#### Scenario: Edição na UI não permite alterar CNPJ
- **WHEN** o usuário abre o formulário de edição de uma organização jurídica ou empresa já cadastrada
- **THEN** o campo CNPJ está somente leitura
- **THEN** o usuário ainda pode editar demais campos permitidos (ex.: nome, CEP, número, complemento)

#### Scenario: API rejeita mudança de CNPJ
- **WHEN** uma requisição de update envia um CNPJ diferente do cadastrado
- **THEN** o sistema rejeita com status 400 e mensagem em pt-BR indicando que o CNPJ não pode ser alterado

#### Scenario: Update com mesmo CNPJ ou sem CNPJ
- **WHEN** uma requisição de update omite o CNPJ ou envia o mesmo CNPJ já persistido
- **THEN** a atualização dos demais campos pode prosseguir (se válidos)
