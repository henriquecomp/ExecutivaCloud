## Context

`RegisterOrganizationView` já marca logradouro, bairro, cidade e UF como `readOnly` com estilo `READONLY_ADDRESS_CLASS`, preenchidos só via busca de CEP. Em `LegalOrganizationsView` (form de organização jurídica) e `OrganizationCompanyForm` (empresa), os mesmos campos ainda aceitam digitação livre via `onChange`.

## Goals / Non-Goals

**Goals:**

- Bloquear edição manual de rua/logradouro, bairro, cidade e UF nos formulários autenticados, com o mesmo comportamento do cadastro público.
- Manter CEP, número e complemento editáveis.
- Preservar preenchimento/limpeza via fluxo de CEP já existente (`applyCepAddress`, blur incompleto).

**Non-Goals:**

- Validação backend do endereço versus CEP.
- Extrair componente compartilhado de formulário de endereço (pode ser feito depois se houver mais duplicação).
- Alterar copy dos labels (Rua vs Logradouro).

## Decisions

1. **Escopo: org jurídica + empresa**  
   Ambos os formulários autenticados de endereço com CEP devem alinhar ao padrão do cadastro público, para UX consistente.

2. **Número e complemento continuam editáveis**  
   Como no cadastro público; o bloqueio vale apenas aos campos derivados do CEP.

3. **Implementação local com `readOnly` + classe visual**  
   Replicar o padrão de `RegisterOrganizationView` (`readOnly`, `tabIndex={-1}`, fundo/estilo de somente leitura). Remover `onChange` desses inputs.

4. **MODIFIED na spec existente**  
   Ampliar “Endereço controlado pelo CEP” para cobrir formulários autenticados, em vez de criar capability nova.

## Risks / Trade-offs

- **[Risk]** Endereços legados cadastrados com rua divergente do CEP não poderão mais ser “corrigidos” digitando a rua → **Mitigation** Correção via troca/rebusca de CEP; número/complemento seguem editáveis.
- **[Trade-off]** Duplicação breve do estilo `READONLY_ADDRESS_*` em até dois arquivos até eventual extração.
