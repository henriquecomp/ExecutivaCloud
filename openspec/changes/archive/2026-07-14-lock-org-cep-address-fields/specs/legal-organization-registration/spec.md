## MODIFIED Requirements

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
