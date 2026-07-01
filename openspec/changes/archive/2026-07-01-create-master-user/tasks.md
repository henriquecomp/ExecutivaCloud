## 1. Documentação e verificação

- [x] 1.1 Verificar se o schema `BootstrapMasterRequest` em `auth_schema.py` está conforme a spec documentada
- [x] 1.2 Verificar se o endpoint `bootstrap_master` em `auth.py` aplica a lógica do `X-Setup-Token`
- [x] 1.3 Verificar se a lógica de `bootstrap_master` em `auth_service.py` rejeita a requisição quando já existe usuário master
- [x] 1.4 Validar se a API não está retornando um erro "detail": "Administrador da empresa deve estar vinculado a uma empresa."
- [x] 1.5 Arquivar esta change para sincronizar as specs com o repositório principal
