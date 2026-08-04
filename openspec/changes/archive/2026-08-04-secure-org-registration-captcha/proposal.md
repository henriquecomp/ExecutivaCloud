## Why

O cadastro público de organização (`POST /auth/register-organization`) hoje responde com `Este e-mail já está cadastrado.` quando o e-mail do administrador já existe. Isso permite **enumeração de contas** (descobrir quais e-mails estão na base) e facilita ataques direcionados. O formulário também não possui proteção contra envio automatizado por bots.

## What Changes

- Adotar resposta **genérica e uniforme** no cadastro público quando o e-mail do administrador já existir: mesma mensagem de sucesso e status HTTP de cadastro bem-sucedido, **sem** criar nova organização nem reenviar convite.
- Aplicar a mesma abordagem anti-enumeração ao **CNPJ já cadastrado** (hoje retorna conflito explícito), mantendo mensagem genérica ao usuário.
- Exigir **CAPTCHA** no formulário público de cadastro de organização, com validação obrigatória no backend antes de processar o cadastro.
- Integrar widget de CAPTCHA no frontend (`RegisterOrganizationView`) e bloquear envio até conclusão válida.
- Documentar variáveis de ambiente para chaves do provedor de CAPTCHA.

## Capabilities

### New Capabilities

- `public-registration-captcha`: verificação de CAPTCHA no cadastro público de organização (frontend + backend).

### Modified Capabilities

- `legal-organization-registration`: resposta anti-enumeração para e-mail/CNPJ duplicados no endpoint público de cadastro.

## Impact

- Backend: `auth_service.register_organization`, `auth_schema.RegisterOrganizationRequest`, novo serviço de verificação CAPTCHA, `.env.example`.
- Frontend: `RegisterOrganizationView.tsx`, `authService.ts`, variável `VITE_TURNSTILE_SITE_KEY` (ou equivalente).
- Testes pytest: cenários de e-mail/CNPJ duplicado com resposta genérica; CAPTCHA inválido/ausente; cadastro válido com token mockado.
- Dependência frontend para widget Turnstile (ou similar) e chamada HTTP do backend ao endpoint de verificação do provedor.
