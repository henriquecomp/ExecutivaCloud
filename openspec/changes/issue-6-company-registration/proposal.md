## Why

Issue GitHub #6: cadastro de empresa com nome em duas palavras, CEP limpando endereço ao ficar inválido, e demais regras já parcialmente implementadas.

## What Changes

- Validar nome da empresa com pelo menos dois nomes (BE + FE).
- Usar `handleCepBlur` do hook de CEP para limpar logradouro/bairro/cidade/UF quando o CEP ficar incompleto.
- Departamentos na empresa já existem em `OrganizationsView` (sem alteração).

## Capabilities

### Modified Capabilities

- `organization-management`: nome da empresa com dois nomes.

## Impact

- `organization_schema.py`, `OrganizationCompanyForm.tsx`.
