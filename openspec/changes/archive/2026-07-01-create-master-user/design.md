## Context

A plataforma Executiva Cloud precisa de um mecanismo seguro para criar o primeiro usuário do sistema, que terá o papel `master`. Esse usuário é responsável pela configuração inicial e pela gestão da plataforma. Como, no início, não há usuários para autenticar essa requisição, é necessário um mecanismo seguro de bootstrap.

## Goals / Non-Goals

**Goals:**
- Documentar o design técnico do endpoint `bootstrap-master`.
- Formalizar o mecanismo de segurança usando o header `X-Setup-Token`.
- Definir as restrições (por exemplo, só pode ser usado se ainda não existir usuário master).

**Non-Goals:**
- Alterar a implementação existente de `bootstrap-master`.
- Documentar outros fluxos de criação de usuário (como convites ou cadastro padrão).

## Decisions

1. **Uso de token de setup (`X-Setup-Token`):**
   - *Rationale*: Para impedir que usuários não autorizados criem uma conta master em uma API publicamente acessível, o endpoint exige um token secreto. Esse token deve corresponder à variável de ambiente `EXECUTIVA_SETUP_TOKEN` configurada no servidor.
   - *Alternatives Considered*: Conta admin padrão hardcoded (rejeitada por risco de segurança se a senha padrão não for alterada).

2. **Idempotência / uso único:**
   - *Rationale*: O endpoint deve verificar se já existe um usuário master no banco de dados. Se existir, a requisição deve ser rejeitada, mesmo com token de setup válido. Isso evita tomadas de controle indevidas caso o token de setup permaneça configurado por engano.

3. **Autenticação imediata:**
   - *Rationale*: O endpoint retorna um `TokenResponse` (access token) após a criação bem-sucedida, permitindo que o cliente entre imediatamente e comece a configurar o sistema sem uma requisição de login separada.

## Risks / Trade-offs

- **Risk: vazamento do token de setup** → *Mitigation*: O endpoint fica desabilitado (retorna erro) se já existir usuário master, limitando a janela de vulnerabilidade. O token deve ser forte e, idealmente, removido do ambiente após o bootstrap.
- **Risk: força bruta no token** → *Mitigation*: Deve haver rate limiting padrão, e o token de setup deve ser uma string longa e criptograficamente segura.
