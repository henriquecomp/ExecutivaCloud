## Context

O bootstrap do master usa `POST /auth/bootstrap-master` com header `X-Setup-Token`. A validação de tenant em `validate_user_tenant_scope` foi pensada para `admin_legal_organization` e `admin_company`, não para `master`.

A mensagem `"Administrador da empresa deve estar vinculado a uma empresa."` é disparada quando `role == "admin_company"` sem `organization_id`. Isso indica que o fluxo de bootstrap pode estar passando por validação de tenant indevidamente, ou que clientes estão usando `POST /users/` (papel padrão `admin_company`) em vez do endpoint correto.

## Goals / Non-Goals

**Goals:**
- Bootstrap cria o master quando não existe nenhum usuário com esse papel.
- Retorna erro claro em pt-BR quando o superusuário já foi cadastrado.
- Nunca retorna mensagem de vínculo com empresa no fluxo de bootstrap.

**Non-Goals:**
- Alterar regras de tenant para outros papéis (`admin_legal_organization`, `admin_company`, etc.).
- Criar tela de bootstrap no frontend (fora do escopo desta correção).

## Decisions

1. **Ignorar validação de tenant para `master`**
   - Em `validate_user_tenant_scope`, retornar cedo quando `role == "master"`.
   - Proteção defensiva caso algum caminho futuro chame a validação com papel master.

2. **Mensagem quando master já existe**
   - Alterar `detail` de `"Usuário master já existe."` para `"O superusuário já foi cadastrado."` (pt-BR, alinhado ao produto).

3. **Teste de regressão**
   - Garantir que `POST /auth/bootstrap-master` nunca retorna `"Administrador da empresa deve estar vinculado a uma empresa."`.
   - Garantir que segunda tentativa retorna `"O superusuário já foi cadastrado."`.

## Risks / Trade-offs

- **Risk**: Cliente continuar usando `POST /users/` → *Mitigation*: manter bloqueio existente e documentar endpoint correto no README.
- **Risk**: Ambiente em produção com código desatualizado → *Mitigation*: deploy com a correção e validação via pytest.
