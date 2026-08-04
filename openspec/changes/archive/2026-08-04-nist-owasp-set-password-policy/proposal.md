## Why

A tela de definição de senha no primeiro acesso (`SetPasswordView`) aceita senhas com apenas 6 caracteres e não orienta o usuário sobre boas práticas. Isso está abaixo das recomendações NIST SP 800-63B e OWASP para senhas memorizadas, aumentando o risco de credenciais fracas no primeiro contato com a plataforma.

## What Changes

- Aplicar política de senha alinhada a NIST/OWASP no fluxo de convite (`complete-invite` / `SetPasswordView`): comprimento mínimo de 8 e máximo de 64 caracteres, rejeição de senhas comuns/vazadas e sem regras arbitrárias de composição (maiúscula, símbolo, etc.).
- Validar a mesma política no backend (`CompleteInviteRequest` e serviço de convite) com mensagens de erro em pt-BR.
- Adicionar na tela um ícone de ajuda (`?`) com popup explicando como formar uma senha segura.
- Exibir indicador visual animado de força da senha (fraca, média ou forte) enquanto o usuário digita.
- Bloquear envio quando a senha não atender à política ou quando confirmação não coincidir.

## Capabilities

### New Capabilities

- `set-password-policy`: regras NIST/OWASP, validação backend/frontend, ajuda contextual e medidor de força na tela de definir senha no primeiro acesso.

### Modified Capabilities

<!-- Nenhuma capability existente cobre política de senha no fluxo de convite. -->

## Impact

- Frontend: `frontend/components/SetPasswordView.tsx`; utilitário compartilhado de política/força (ex.: `frontend/utils/passwordPolicy.ts`); possível componente reutilizável de ajuda e medidor.
- Backend: `backend/app/schemas/auth_schema.py` (`CompleteInviteRequest`); `backend/app/services/invite_service.py`; novo módulo de validação (ex.: `backend/app/core/password_policy.py`) com testes pytest.
- Sem mudança de contrato HTTP além de mensagens `detail` mais específicas para senha inválida.
- Fluxos fora do escopo nesta entrega: login, bootstrap master, edição de usuário (podem reutilizar o utilitário depois).
