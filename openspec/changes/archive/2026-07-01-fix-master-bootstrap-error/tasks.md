## 1. Correção backend

- [x] 1.1 Adicionar retorno antecipado para `role == "master"` em `validate_user_tenant_scope` (`tenant_scope.py`)
- [x] 1.2 Alterar mensagem em `bootstrap_master` para `"O superusuário já foi cadastrado."` (`auth_service.py`)
- [x] 1.3 Adicionar teste de regressão em `test_security_and_scoping.py` garantindo ausência do erro de vínculo com empresa

## 2. Verificação

- [x] 2.1 Executar `pytest tests/test_security_and_scoping.py`
- [x] 2.2 Validar manualmente `POST /auth/bootstrap-master` com e sem master existente
