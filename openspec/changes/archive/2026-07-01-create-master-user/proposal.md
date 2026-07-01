## Why

O sistema precisa de uma forma de inicializar o primeiro usuário administrativo (usuário `master`) para configurar e gerenciar a plataforma. Esta é uma etapa crítica de bootstrap em novas implantações do Executiva Cloud, permitindo que um superadministrador inicial seja criado com segurança por meio de um token de setup.

## What Changes

- Documentar o endpoint existente `bootstrap-master` e seus requisitos (por exemplo, `X-Setup-Token`).
- Formalizar a estrutura do payload para criação do usuário master.
- Garantir que os contratos de frontend e backend deste fluxo estejam claramente especificados e em conformidade com os padrões do projeto.

## Capabilities

### New Capabilities
- `master-user-bootstrap`: Capacidade de criar o usuário master inicial usando um token de setup seguro.

### Modified Capabilities

## Impact

- **Frontend**: `authService.ts` (chamadas relacionadas a `bootstrap-master`, se existirem, ou documentação do contrato da API).
- **Backend**: router `auth.py` (`/auth/bootstrap-master`), `auth_service.py` e `auth_schema.py`.
- **Segurança**: Depende da variável de ambiente `EXECUTIVA_SETUP_TOKEN` e do header `X-Setup-Token`.
