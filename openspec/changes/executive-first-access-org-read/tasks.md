## 1. Backend

- [x] 1.1 Ampliar `organization_scope` para leitura da própria empresa (executive/secretary)
- [x] 1.2 Ajustar get/list no service; writes continuam manager-only
- [x] 1.3 Pytest: executive lê própria, 403 em outra; create 403

## 2. Frontend

- [x] 2.1 Mapear `organizationId` em `mapApiUserToAppUser` para executive
- [x] 2.2 Corrigir loaders de perfil (complete/modal executive e secretary) para `getOne`/`getByOrg`
- [x] 2.3 Completar `req()` e `fieldErrors` de RG, emissor, datas, nacionalidade e estado civil

## 3. Entrega

- [x] 3.1 Sync spec principal, pytest, commit e push seguro em main
