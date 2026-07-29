## Why

Nos formulários de organização jurídica e empresa, CNPJ e CEP precisam aparecer sempre mascarados. Ao abrir o popup de edição, os valores vêm crus da API e as máscaras falham na exibição. Além disso, o CNPJ não deve poder ser alterado após o cadastro.

## What Changes

- Garantir máscara de CNPJ e CEP na digitação (cadastro) e na abertura do formulário de edição (aplicar `maskCNPJ` / `maskCEP` nos valores iniciais).
- Tornar o campo CNPJ somente leitura na edição de organização jurídica e de empresa.
- Rejeitar alteração de CNPJ no backend em updates (proteção além da UI), com mensagem em pt-BR.
- Manter CEP editável (com máscara), pois o endereço continua sendo atualizado via busca de CEP.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova. -->

### Modified Capabilities

- `legal-organization-registration`: máscaras de CNPJ/CEP nos formulários; corretude ao abrir edição; CNPJ imutável após criação (organização jurídica e empresa).

## Impact

- Frontend: `LegalOrganizationsView.tsx`, `OrganizationCompanyForm.tsx`; conferir `RegisterOrganizationView.tsx` (já mascara na digitação).
- Backend: serviços/schemas de update de `legal_organization` e `organization` para impedir mudança de CNPJ.
- Sem migration de schema de banco.
