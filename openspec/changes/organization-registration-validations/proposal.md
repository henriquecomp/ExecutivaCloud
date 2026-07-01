## Why

O formulário público de cadastro de organização (`RegisterOrganizationView`) precisa de validações e comportamentos mais rigorosos para reduzir erros de preenchimento, alinhar-se ao novo formato de CNPJ alfanumérico (a partir de julho/2026) e melhorar a experiência de busca por CEP.

## What Changes

- Exigir razão social com pelo menos dois nomes (ex.: `STELLANTIS DO BRASIL`).
- Atualizar validação e máscara de CNPJ para suportar o formato alfanumérico (12 posições A–Z/0–9 + 2 dígitos verificadores), mantendo compatibilidade com CNPJs numéricos existentes.
- Corrigir comportamento do CEP: ao sair do campo com CEP incompleto ou alterado, limpar logradouro, bairro, cidade e UF.
- Tornar logradouro, bairro, cidade e UF somente leitura, preenchidos exclusivamente pela busca de CEP.
- Exigir nome completo do administrador com pelo menos dois nomes (ex.: `Raythan Karabasappa`).
- Adicionar confirmação de e-mail (dupla digitação) no cadastro de organização, com validação de igualdade antes do envio.
- Replicar validações equivalentes no backend (`RegisterOrganizationRequest` e `auth_service`).

## Capabilities

### New Capabilities
- `legal-organization-registration`: Validações e regras de UX do cadastro público de organização jurídica + administrador.

### Modified Capabilities

## Impact

- **Frontend**: `RegisterOrganizationView.tsx`, `useCepAutoLookup.ts`, `brValidators.ts`, `authService.ts` (payload com `adminEmailConfirm`).
- **Backend**: `auth_schema.py`, `br_validators.py`, `auth_service.py`.
- **Testes**: `test_security_and_scoping.py` e/ou novos testes de validação de CNPJ alfanumérico.
