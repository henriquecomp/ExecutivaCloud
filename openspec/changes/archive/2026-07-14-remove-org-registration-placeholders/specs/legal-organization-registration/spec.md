## ADDED Requirements

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
