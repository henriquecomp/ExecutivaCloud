## Why

O e-mail enviado após o cadastro de organização (e nos demais convites para criar senha) é texto simples e genérico (“Olá… Você foi convidado…”). Isso não transmite a identidade profissional da HMR / Executiva Cloud no primeiro contato do administrador com a plataforma.

## What Changes

- Reformular o conteúdo (assunto e corpo) do e-mail de convite / definição de senha com tom institucional e branding HMR + Executiva Cloud.
- Enviar o convite em formato profissional (HTML + fallback em texto puro), mantendo o link de `set-password` e o aviso de segurança para quem não esperava o e-mail.
- Aplicar o mesmo padrão a todos os fluxos que usam `send_invite_email` (cadastro público de organização e convites internos).
- Não alterar a lógica de geração do token nem o fluxo de definir senha no frontend.

## Capabilities

### New Capabilities

- `invite-email-branding`: conteúdo e apresentação profissional do e-mail de convite para criar senha, com a cara da HMR / Executiva Cloud.

### Modified Capabilities

<!-- Nenhuma capability existente cobre o template do e-mail de convite. -->

## Impact

- Backend: `backend/app/services/email_service.py` (`send_invite_email` e envio SMTP).
- Consumidores existentes: cadastro público (`auth_service.register_organization`), convites (`invite_service`, `user_management_service`).
- Sem mudança de API HTTP, schemas ou banco.
- Assunto/corpo do e-mail passam a ser HTML multipart com alternativa text/plain.
