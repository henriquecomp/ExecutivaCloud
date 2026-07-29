## 1. Backend — normalização no update

- [x] 1.1 Em `LegalOrganizationUpdate`, persistir CNPJ (e CEP/UF se já validados) com o retorno de `validate_*` no `model_validator`, ou tipar com `OptionalCnpj` / `OptionalCep`
- [x] 1.2 Aplicar o mesmo em `OrganizationUpdate`
- [x] 1.3 Em `legal_organization_service` e `organization_service`, comparar CNPJ normalizado ao rejeitar alteração

## 2. Testes

- [x] 2.1 Adicionar teste: PUT com mesmo CNPJ mascarado (`XX.XXX.XXX/XXXX-XX`) retorna 200 na org jurídica
- [x] 2.2 Adicionar teste equivalente para empresa (`/organizations/{id}`)
- [x] 2.3 Manter/ajustar testes existentes de rejeição quando o CNPJ é realmente outro

## 3. Verificação

- [x] 3.1 Editar organização no UI, salvar sem mudar CNPJ e confirmar sucesso
