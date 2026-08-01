## 1. Backend

- [x] 1.1 `InviteUserRequest`: dois nomes no `fullName`
- [x] 1.2 `get_executive`: executivo pode ler o próprio registro
- [x] 1.3 `list_executives` + `scoped_executives_query`: executivo lista colegas da mesma empresa

## 2. Frontend

- [x] 2.1 `InviteUserForm`: validação de dois nomes
- [x] 2.2 `CompleteExecutiveProfileView`: `workEmail` padrão = e-mail do login

## 3. Pendente (requisitos 1–37 da issue)

- [x] 3.1 Ajustar `ExecutiveProfileForm` (rótulos, obrigatoriedades, máscaras telefone, CEP readonly, banco/agência/conta, remover remuneração e nível de acesso)
- [x] 3.2 Validações de conclusão de perfil alinhadas ao backend (`ExecutiveProfileComplete` / endpoint complete-profile)
- [ ] 3.3 Secretária: paridade no fluxo de conclusão se aplicável
