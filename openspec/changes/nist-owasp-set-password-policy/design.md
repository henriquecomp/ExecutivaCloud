## Context

O fluxo de primeiro acesso usa `SetPasswordView` (link `?flow=set-password&token=...`) e o endpoint `POST /auth/complete-invite`. Hoje a validação é mínima: `min_length=6` no Pydantic e checagem equivalente no frontend. Não há orientação ao usuário nem feedback de força.

NIST SP 800-63B (memorized secrets) e OWASP Authentication Cheat Sheet recomendam: comprimento mínimo (8+), comprimento máximo generoso (64+), **sem** impor regras de composição (maiúscula, dígito, símbolo), verificar senhas comuns/vazadas e permitir gerenciadores de senha (colar, todos os caracteres Unicode).

## Goals / Non-Goals

**Goals:**

- Política única e compartilhada entre frontend e backend para o fluxo `complete-invite`.
- UX na tela de definir senha: ícone `?` com popup de ajuda em pt-BR e medidor animado (fraca / média / forte).
- Mensagens de erro claras em pt-BR quando a senha violar a política.
- Testes pytest cobrindo validação no backend.

**Non-Goals:**

- Aplicar a política em bootstrap master, login, criação/edição de usuário autenticado ou redefinição de senha (reutilização futura do módulo é desejável, mas fora do escopo).
- Integração com API externa de vazamentos (Have I Been Pwned); lista local de senhas comuns é suficiente na v1.
- Adicionar biblioteca pesada de UX (ex.: `zxcvbn`) sem necessidade; heurística leve baseada em comprimento e entropia estimada.

## Decisions

1. **Regras da política (NIST/OWASP)**  
   - Mínimo: **8** caracteres.  
   - Máximo: **64** caracteres (limite de input e validação).  
   - **Sem** exigência de maiúscula, minúscula, número ou símbolo.  
   - Rejeitar senhas presentes em lista interna de senhas comuns (top ~100, arquivo estático ou constante no backend; espelho reduzido no frontend para feedback imediato).  
   - Mensagens pt-BR exemplos: “A senha deve ter entre 8 e 64 caracteres.” / “Esta senha é muito comum. Escolha outra.”

2. **Módulo compartilhado no backend**  
   Criar `backend/app/core/password_policy.py` com `validate_password(password) -> None` (levanta `ValueError` com mensagem pt-BR) e constantes `MIN_LENGTH`, `MAX_LENGTH`. Usar em `invite_service.complete_invite` após checagem de confirmação. Atualizar `CompleteInviteRequest` para `min_length=8`, `max_length=64` e validador Pydantic que delega ao módulo.

3. **Utilitário no frontend**  
   `frontend/utils/passwordPolicy.ts` exporta as mesmas regras (`isPasswordPolicyValid`, `getPasswordPolicyError`, `getPasswordStrength`). O medidor de força é **orientativo**; o envio só é permitido quando `isPasswordPolicyValid` retorna true e as senhas coincidem.

4. **Classificação de força (fraca / média / forte)**  
   Heurística simples e previsível (sem impor composição):  
   - **Fraca**: não passa na política OU comprimento &lt; 10 OU só caracteres repetitivos/sequência óbvia.  
   - **Média**: passa na política com 8–11 caracteres ou entropia moderada.  
   - **Forte**: passa na política com ≥ 12 caracteres e entropia razoável (variedade de caracteres), sem ser senha comum.  
   Barra de progresso com transição CSS (`transition-all duration-300`) e cores: vermelho (fraca), âmbar (média), verde (forte). Rótulo textual acessível (“Senha fraca” / “Senha média” / “Senha forte”).

5. **Ícone de ajuda**  
   Botão ícone `?` ao lado do rótulo “Nova senha” (`type="button"`, `aria-label` descritivo). Ao clicar/focar, exibir painel popup (não modal bloqueante) com bullet list em pt-BR: comprimento 8–64, evitar senhas comuns, preferir frase longa ou gerenciador de senha, sem exigência de símbolos. Fechar ao clicar fora ou Esc. Reutilizar padrões visuais do app (slate/indigo, `AppButton` ghost se couber no layout da tela pública).

6. **Componentização**  
   Se o medidor + ajuda couberem em um único bloco reutilizável (`PasswordFieldWithStrength` ou similar em `frontend/components/ui/`), extrair apenas se mantiver `SetPasswordView` legível; caso contrário, implementar inline nesta tela para minimizar escopo.

## Risks / Trade-offs

- **[Risk]** Lista local de senhas comuns não cobre todas as vazadas → **Mitigation** comprimento mínimo + lista razoável; API HIBP pode ser fase 2.
- **[Risk]** Divergência FE/BE nas regras → **Mitigation** mesma tabela de constantes documentada; backend é fonte de verdade; testes pytest + validação manual.
- **[Risk]** Usuário confunde “forte” no medidor com “aceita qualquer senha longa” → **Mitigation** submit bloqueado pela política; medidor é complementar.
- **[Trade-off]** Não estender política a outros fluxos nesta entrega deixa brecha temporária em bootstrap/edição de usuário.

## Migration Plan

- Deploy backend e frontend juntos; senhas já criadas não são afetadas.
- Usuários com link de convite pendente passam a ver novos requisitos ao definir senha.
- Rollback: reverter validação e UI sem migração de banco.

## Open Questions

- Nenhuma bloqueante; confirmar na implementação se a heurística de “forte” (≥ 12 caracteres) atende expectativa do produto.
