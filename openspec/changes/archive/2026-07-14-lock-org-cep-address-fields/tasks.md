## 1. Organização jurídica (autenticada)

- [x] 1.1 Em `LegalOrganizationsView.tsx`, tornar somente leitura os inputs de rua, bairro, cidade e UF (padrão `readOnly` + estilo do cadastro público)
- [x] 1.2 Remover `onChange` desses campos e garantir que CEP, número e complemento continuam editáveis
- [x] 1.3 Confirmar que busca/limpeza de CEP (`applyCepAddress` / blur incompleto) ainda atualiza os campos somente leitura

## 2. Empresa

- [x] 2.1 Em `OrganizationCompanyForm.tsx`, aplicar o mesmo bloqueio em rua, bairro, cidade e UF
- [x] 2.2 Remover `onChange` desses campos e manter CEP, número e complemento editáveis
- [x] 2.3 Confirmar que busca/limpeza de CEP e cópia de endereço da organização jurídica ainda funcionam nos campos somente leitura

## 3. Verificação

- [x] 3.1 Abrir criar/editar organização jurídica e empresa e validar que endereço derivado do CEP não é digitável, mas número/complemento sim
