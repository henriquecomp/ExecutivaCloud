## Why

Na tela pública de cadastro de organização, os campos de razão social e nome do administrador exibem placeholders de exemplo. A orientação de UX é que os inputs dessa tela não tenham placeholder — o rótulo do campo já identifica o dado esperado.

## What Changes

- Remover o atributo `placeholder` de todos os inputs do formulário de cadastro de organização (`RegisterOrganizationView`).
- Garantir que nenhum input dessa tela volte a usar placeholder (rótulo visível permanece como única pista de preenchimento).

## Capabilities

### New Capabilities

<!-- Nenhuma capacidade nova; ajuste de UX na capability existente. -->

### Modified Capabilities

- `legal-organization-registration`: exigir que os inputs do formulário público de cadastro não utilizem `placeholder`.

## Impact

- Frontend: `frontend/components/RegisterOrganizationView.tsx` (hoje com placeholders em razão social e nome completo).
- Sem alteração de API, schemas, serviços ou banco.
- Spec: `openspec/specs/legal-organization-registration/spec.md` (delta nesta change).
