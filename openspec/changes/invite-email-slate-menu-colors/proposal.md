## Why

O e-mail de convite HTML usa indigo/azul no cabeçalho e no botão CTA, enquanto o menu lateral do app é slate escuro (preto → cinza). A identidade visual fica inconsistente entre produto e comunicação.

## What Changes

- Trocar as cores azul/indigo do template HTML do e-mail de convite pela paleta do menu (`slate-800` / `slate-900` / cinzas adjacentes).
- Manter contraste legível (texto branco no cabeçalho/CTA sobre fundo escuro).
- Sem alteração de copy, fluxo ou multipart (texto + HTML).

## Capabilities

### New Capabilities

<!-- Nenhuma. -->

### Modified Capabilities

- `invite-email-branding`: paleta do e-mail HTML alinhada às cores do menu (slate escuro, não indigo).

## Impact

- Backend: `backend/app/services/email_service.py` (`_invite_email_html`).
- Sem mudança de API, schemas ou frontend da aplicação.
