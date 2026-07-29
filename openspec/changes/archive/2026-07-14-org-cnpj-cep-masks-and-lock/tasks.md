## 1. Frontend — máscaras no popup e digitação

- [x] 1.1 Em `LegalOrganizationsView.tsx`, inicializar CNPJ e CEP com `maskCNPJ` / `maskCEP` ao abrir o formulário (criar/editar)
- [x] 1.2 Em `OrganizationCompanyForm.tsx`, inicializar CNPJ e CEP com `maskCNPJ` / `maskCEP`
- [x] 1.3 Confirmar que `RegisterOrganizationView` mantém máscaras de CNPJ e CEP na digitação; ajustar só se houver regressão
- [x] 1.4 Garantir que cópia de dados da organização jurídica para empresa aplica as máscaras (já parcial — validar)

## 2. Frontend — CNPJ somente leitura na edição

- [x] 2.1 Em `LegalOrganizationsView.tsx`, tornar CNPJ `readOnly` quando existir `id` (estilo de campo bloqueado)
- [x] 2.2 Em `OrganizationCompanyForm.tsx`, tornar CNPJ `readOnly` quando existir `id`
- [x] 2.3 Na criação, manter CNPJ editável com máscara

## 3. Backend — imutabilidade do CNPJ

- [x] 3.1 Em `legal_organization_service` update, rejeitar CNPJ diferente do persistido com 400 e mensagem pt-BR
- [x] 3.2 Em `organization_service` update, rejeitar CNPJ diferente do persistido com 400 e mensagem pt-BR
- [x] 3.3 Adicionar ou ajustar teste pytest cobrindo rejeição de alteração de CNPJ

## 4. Verificação

- [x] 4.1 Abrir edição de organização jurídica e empresa: CNPJ/CEP mascarados; CNPJ não editável; CEP editável com máscara
- [x] 4.2 Criar nova organização: CNPJ e CEP mascarados na digitação
