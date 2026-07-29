## Why

No cadastro público, logradouro, bairro, cidade e UF já são somente leitura após a busca de CEP. Nos formulários autenticados de organização jurídica e de empresa esses campos ainda podem ser editados manualmente, quebrando a mesma regra de UX e permitindo endereço inconsistente com o CEP.

## What Changes

- Tornar somente leitura os campos preenchidos pelo CEP (logradouro/rua, bairro, cidade e UF) nos formulários autenticados de organização jurídica e de empresa.
- Manter editáveis CEP, número e complemento — igual ao cadastro público (`RegisterOrganizationView`).
- Reutilizar o mesmo padrão visual de campos somente leitura já usado no cadastro público.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova; alinhamento de UX com a regra já existente de endereço via CEP. -->

### Modified Capabilities

- `legal-organization-registration`: ampliar o requisito de endereço controlado pelo CEP para os formulários autenticados de organização jurídica e empresa (além do cadastro público).

## Impact

- Frontend: `LegalOrganizationsView.tsx` (form de criação/edição de organização jurídica) e `OrganizationCompanyForm.tsx` (empresa).
- Sem alteração de API, schemas, serviços ou banco.
- Spec delta em `legal-organization-registration`.
