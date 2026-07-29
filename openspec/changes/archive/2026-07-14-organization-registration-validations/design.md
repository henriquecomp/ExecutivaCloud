## Context

O cadastro público de organização está em `RegisterOrganizationView` e usa `POST /auth/register-organization`. Hoje:

- Razão social e nome do admin aceitam qualquer texto com `minLength={2}`.
- CNPJ valida apenas 14 dígitos numéricos (`validateCNPJ` / `validate_cnpj`).
- CEP dispara busca no `onChange` quando há 8 dígitos, mas não limpa endereço ao editar CEP parcialmente após blur.
- Campos de endereço (exceto número e complemento) são editáveis manualmente.
- E-mail do administrador não tem confirmação (diferente do fluxo de convite em `InviteUserForm`).

## Goals / Non-Goals

**Goals:**
- Validar razão social e nome completo com pelo menos duas palavras (separadas por espaço).
- Suportar CNPJ numérico e alfanumérico (IN RFB 2.229/2024) em frontend e backend.
- CEP controla endereço: campos derivados readonly; limpar ao invalidar CEP.
- Dupla digitação de e-mail com mensagem pt-BR em caso de divergência.

**Non-Goals:**
- Alterar fluxos internos de criação de empresa (`OrganizationCompanyForm`) nesta entrega — foco no cadastro público.
- Migrar CNPJs já armazenados no banco.

## Decisions

1. **Validação de dois nomes**
   - *Rationale*: Regra de negócio simples — `trim().split(/\s+/).filter(Boolean).length >= 2`.
   - Aplicar em frontend (antes do submit) e backend (validador Pydantic reutilizável).

2. **CNPJ alfanumérico**
   - *Rationale*: A partir de jul/2026 novos CNPJs terão letras nas 12 primeiras posições; DV continua numérico.
   - Algoritmo: módulo 11 com `ord(char) - 48` (ASCII−48) para cada caractere da base.
   - Regex: `^[A-Z0-9]{12}\d{2}$` após normalização (maiúsculas, sem máscara).
   - Manter retrocompatibilidade com CNPJs puramente numéricos.

3. **CEP e endereço readonly**
   - *Rationale*: Evitar inconsistência entre CEP e endereço digitado manualmente.
   - `useCepAutoLookup`: adicionar handler `onBlur` que limpa endereço se CEP tiver menos de 8 dígitos ou se dígitos mudaram desde última busca bem-sucedida.
   - Campos `legalStreet`, `legalNeighborhood`, `legalCity`, `legalState`: `readOnly` no frontend.

4. **Confirmação de e-mail**
   - *Rationale*: Padrão já existente em `InviteUserForm` — reutilizar mensagem `"E-mail e confirmação não coincidem."`.
   - Adicionar `adminEmailConfirm` ao schema e payload; validar igualdade case-insensitive no backend.

## Risks / Trade-offs

- **Risk**: CEP sem retorno de algum campo (ViaCEP) → *Mitigation*: manter número e complemento editáveis; exibir erro se busca falhar.
- **Risk**: CNPJ alfanumérico com regras ainda em evolução (letras excluídas I, O, U, etc.) → *Mitigation*: seguir IN RFB 2.229/2024; regex ampla `[A-Z0-9]{12}`; ajustar se Receita publicar lista restrita.
