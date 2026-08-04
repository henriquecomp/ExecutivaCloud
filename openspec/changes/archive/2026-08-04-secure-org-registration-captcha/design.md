## Context

`AuthService.register_organization` verifica e-mail e CNPJ antes de criar tenant e retorna erros específicos (`400` / `409`). O frontend exibe essas mensagens em `RegisterOrganizationView`. Não há CAPTCHA no projeto.

Recomendações OWASP (Authentication, Account Enumeration): endpoints públicos de registro devem retornar **respostas idênticas** independentemente de o identificador já existir, evitando vazamento de informação. Para bots, CAPTCHA com verificação server-side é prática padrão.

## Goals / Non-Goals

**Goals:**

- Impedir enumeração de e-mail (e CNPJ) no cadastro público.
- CAPTCHA obrigatório no formulário público com validação no backend.
- Mensagem de sucesso genérica e única para o usuário final em pt-BR.
- Testes automatizados cobrindo os fluxos críticos.

**Non-Goals:**

- Rate limiting global ou WAF (complementar futuro; não substitui CAPTCHA).
- CAPTCHA em login, convites internos ou bootstrap master.
- Notificar por e-mail o titular quando alguém tentar cadastrar com e-mail existente (pode ser fase 2).

## Decisions

1. **Resposta anti-enumeração (e-mail e CNPJ)**  
   Quando `adminEmail` já existir **ou** `legalCnpj` já estiver cadastrado:
   - Retornar **HTTP 201** (ou 200, mantendo contrato atual de sucesso) com a **mesma** `RegisterOrganizationResponse.message` usada no cadastro real.
   - **Não** criar `LegalOrganization`, usuário ou token de convite.
   - **Não** enviar e-mail.
   - Registrar tentativa em log interno (sem expor ao cliente) para auditoria.
   - Validações de formato (CNPJ inválido, campos obrigatórios) continuam retornando erros específicos — apenas duplicidade de identificadores sensíveis usa resposta genérica.

2. **Mensagem genérica sugerida (pt-BR)**  
   *"Se o cadastro for elegível, enviaremos um e-mail com instruções para definir sua senha e concluir o primeiro acesso."*  
   Alinhar mensagem de sucesso real à mesma copy, para que sucesso verdadeiro e “falso sucesso” sejam indistinguíveis na UI.

3. **Provedor de CAPTCHA: Cloudflare Turnstile**  
   - Gratuito, boa UX, verificação server-side via `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
   - Alternativa descartada: reCAPTCHA (maior dependência Google / privacidade).
   - Chaves: `TURNSTILE_SITE_KEY` (frontend via `VITE_TURNSTILE_SITE_KEY`) e `TURNSTILE_SECRET_KEY` (backend).

4. **Contrato da API**  
   Adicionar `captchaToken` (camelCase) em `RegisterOrganizationRequest`. Backend rejeita com `400` e mensagem pt-BR genérica (`Não foi possível validar a verificação de segurança.`) se token ausente ou inválido — sem detalhar motivo técnico ao usuário.

5. **Frontend**  
   - Widget Turnstile no final do formulário, antes do botão enviar.
   - Botão desabilitado até `captchaToken` obtido.
   - Reset do widget após erro ou envio.
   - Em desenvolvimento, suportar chaves de teste do Turnstile documentadas na Cloudflare.

6. **Ordem de validação no backend**  
   1. Schema Pydantic (incl. `captchaToken`)  
   2. Verificar CAPTCHA (falha → 400 genérico)  
   3. Checar duplicidade e-mail/CNPJ → resposta genérica de sucesso se duplicado  
   4. Fluxo normal de criação

## Risks / Trade-offs

- **[Risk]** Atacante ainda testa e-mails por timing → **Mitigation** resposta genérica + CAPTCHA; rate limit pode vir depois.
- **[Risk]** Usuário legítimo com e-mail já cadastrado não entende o que houve → **Mitigation** copy orienta a verificar e-mail; suporte pode ajudar sem confirmar existência na API.
- **[Risk]** Turnstile indisponível bloqueia cadastros → **Mitigation** monitorar falhas; chaves e domínio configurados corretamente no painel Cloudflare.
- **[Trade-off]** CNPJ duplicado também fica opaco — alinhado à segurança; usuário com CNPJ já cadastrado deve usar recuperação/suporte.

## Migration Plan

- Configurar chaves Turnstile no `.env` e no build do frontend antes do deploy.
- Deploy backend + frontend juntos; contrato da API ganha campo obrigatório `captchaToken` (**BREAKING** para clientes que chamam o endpoint sem CAPTCHA).

## Open Questions

- Confirmar domínio(s) de produção no painel Turnstile (localhost + staging + prod).
