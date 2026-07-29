## Context

Na digitação, `LegalOrganizationsView` e `OrganizationCompanyForm` já chamam `maskCNPJ` / `maskCEP` (via `handleCepInputChange`). O cadastro público também mascara. O bug do popup de edição ocorre porque o estado inicial usa o valor cru da API (`useState(organization.cnpj || '')`), sem passar pelas máscaras. O CNPJ ainda é editável na UI e o backend aceita mudança de CNPJ no update.

## Goals / Non-Goals

**Goals:**

- Exibir CNPJ e CEP sempre mascarados ao abrir criar/editar.
- Bloquear edição de CNPJ quando o registro já existe (`id` presente).
- Impedir alteração de CNPJ na API (legal organization e organização/empresa).

**Non-Goals:**

- Alterar formato de persistência no banco (continua sem pontuação).
- Bloquear edição de CEP (permanece editável com máscara e lookup).
- Extrair componente compartilhado de form de endereço (fora do escopo mínimo).

## Decisions

1. **Corrigir máscaras na inicialização do estado**  
   Usar `maskCNPJ(...)` e `maskCEP(...)` nos `useState` iniciais (e em qualquer reset a partir da entidade). Assim o popup de edição já abre formatado.

2. **CNPJ somente leitura na edição (FE)**  
   Quando `legalOrganization.id` / `organization.id` existir: `readOnly` (ou `disabled` com valor enviado) + estilo de campo bloqueado, sem `onChange`. Na criação, permanece editável com máscara.

3. **Backend rejeita mudança de CNPJ**  
   Nos services de update: se o payload trouxer `cnpj` diferente do persistido, retornar HTTP 400 com detalhe pt-BR (ex.: `CNPJ não pode ser alterado.`). Se vier igual ou omitido, seguir o fluxo atual. Evita bypass da UI.

4. **Cadastro público**  
   Já mascara CNPJ/CEP na digitação; apenas validar regressão — sem mudança obrigatória, salvo se algum valor inicial sem máscara for encontrado.

## Risks / Trade-offs

- **[Risk]** Clients antigos que enviam CNPJ no PATCH com valor diferente quebram → **Mitigation** Resposta 400 clara; comportamento desejado (imutabilidade).
- **[Trade-off]** Correção de CNPJ digitado errado no cadastro exige exclusão/recriação (ou fluxo futuro de suporte), não edição.
