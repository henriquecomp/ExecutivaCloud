## 1. Validadores compartilhados

- [x] 1.1 Criar `validateFullNameTwoWords` em `frontend/utils/brValidators.ts` e equivalente em `backend/app/core/br_validators.py`
- [x] 1.2 Atualizar `validateCNPJ` / `maskCNPJ` no frontend para CNPJ alfanumérico (módulo 11 + ASCII−48)
- [x] 1.3 Atualizar `validate_cnpj` em `backend/app/core/br_validators.py` para CNPJ alfanumérico

## 2. Backend

- [x] 2.1 Adicionar validação de razão social e `adminName` (dois nomes) em `RegisterOrganizationRequest`
- [x] 2.2 Adicionar campo `adminEmailConfirm` e validar igualdade com `adminEmail` em `auth_schema.py`
- [x] 2.3 Garantir mensagens de erro em pt-BR no fluxo `register_organization`

## 3. Frontend

- [x] 3.1 Atualizar `useCepAutoLookup` com `onBlur` que limpa endereço quando CEP ficar incompleto
- [x] 3.2 Tornar logradouro, bairro, cidade e UF `readOnly` em `RegisterOrganizationView`
- [x] 3.3 Adicionar validações de razão social, nome completo e CNPJ alfanumérico no submit
- [x] 3.4 Adicionar campo de confirmação de e-mail e validação de igualdade
- [x] 3.5 Atualizar `RegisterOrganizationPayload` e `authService.registerOrganization` com `adminEmailConfirm`

## 4. Testes e verificação

- [x] 4.1 Adicionar testes de CNPJ alfanumérico e validações de cadastro no backend
- [x] 4.2 Testar manualmente fluxo completo em `RegisterOrganizationView`
