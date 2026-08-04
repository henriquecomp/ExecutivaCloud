## 1. Backend — anti-enumeração

- [x] 1.1 Em `auth_service.register_organization`, retornar resposta genérica de sucesso (mesma mensagem) quando e-mail ou CNPJ já existir, sem criar registros nem enviar e-mail
- [x] 1.2 Unificar mensagem de sucesso real com a mensagem anti-enumeração em `RegisterOrganizationResponse`
- [x] 1.3 Adicionar log interno (sem expor ao cliente) para tentativas bloqueadas por duplicidade

## 2. Backend — CAPTCHA Turnstile

- [x] 2.1 Criar `backend/app/core/captcha_service.py` (ou `services/captcha_service.py`) com verificação Turnstile via `siteverify`
- [x] 2.2 Adicionar `captchaToken` obrigatório em `RegisterOrganizationRequest`
- [x] 2.3 Validar CAPTCHA no início de `register_organization`; falha → `400` com mensagem genérica pt-BR
- [x] 2.4 Documentar `TURNSTILE_SECRET_KEY` em `backend/.env.example` (e raiz se aplicável)

## 3. Frontend — formulário público

- [x] 3.1 Adicionar dependência/widget Turnstile e `VITE_TURNSTILE_SITE_KEY`
- [x] 3.2 Integrar CAPTCHA em `RegisterOrganizationView.tsx` (token no estado, reset após envio/erro)
- [x] 3.3 Enviar `captchaToken` em `registerOrganization` (`authService.ts` / payload)
- [x] 3.4 Desabilitar envio até CAPTCHA concluído; exibir mensagem genérica de sucesso da API (sem tratar e-mail duplicado de forma distinta)

## 4. Testes e verificação

- [x] 4.1 Testes pytest: e-mail duplicado retorna mesma mensagem/status sem criar tenant
- [x] 4.2 Testes pytest: CNPJ duplicado retorna mesma mensagem/status sem criar tenant
- [x] 4.3 Testes pytest: CAPTCHA ausente/inválido rejeita cadastro (mock `siteverify`)
- [x] 4.4 Testes pytest: cadastro válido com CAPTCHA mockado continua funcionando
- [x] 4.5 Verificação manual: formulário exige CAPTCHA; resposta idêntica para e-mail novo e e-mail já existente
