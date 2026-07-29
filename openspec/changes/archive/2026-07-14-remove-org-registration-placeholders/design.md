## Context

O formulário público em `RegisterOrganizationView` já usa labels visíveis em todos os campos. Dois inputs ainda carregam `placeholder` com exemplos (`Ex.: STELLANTIS DO BRASIL` na razão social e `Ex.: Raythan Karabasappa` no nome do administrador). A regra de UX pedida é não usar placeholder nessa tela.

## Goals / Non-Goals

**Goals:**

- Remover `placeholder` de todos os inputs do cadastro público de organização.
- Documentar o requisito na spec `legal-organization-registration`.

**Non-Goals:**

- Alterar validações (razão social, CNPJ, CEP, e-mail, etc.).
- Migrar os inputs nativos para `AppInput` / `AppLabel` (fora do escopo desta mudança).
- Remover placeholders de outras telas (ex.: busca em `OrganizationsView`).

## Decisions

1. **Escopo só na view de cadastro público**  
   Alterar apenas `RegisterOrganizationView.tsx`, removendo as props `placeholder` existentes. Não há componente compartilhado de form nessa tela que imponha placeholder por padrão.

2. **ADDED na delta spec (não MODIFIED)**  
   Os requisitos atuais cobrem validações; a ausência de placeholder é um requisito de apresentação novo, sem mudar o comportamento de validação existente.

3. **Labels permanecem como única pista**  
   Não substituir placeholders por hint text auxiliar; o label já descreve o campo.

## Risks / Trade-offs

- **[Risk]** Usuários perdem o exemplo de “dois nomes” no placeholder → **Mitigation** A validação e a mensagem de erro em pt-BR continuam instruindo o formato quando o valor for inválido.
- **[Trade-off]** Consistência só nesta tela; outras views podem ainda usar placeholder onde fizer sentido (busca, filtros).
