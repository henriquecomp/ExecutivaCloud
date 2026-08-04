## Context

O menu Empresas lista entidades `Organization` vinculadas a uma `LegalOrganization`. O papel `admin_legal_organization` cadastra essas empresas; o `master` tem acesso global. Hoje as rotas `/organizations/` não usam `get_current_user` nem filtram por tenant — o isolamento depende só do frontend (`OrganizationsView.visibleOrganizations`), o que é insuficiente e pode falhar após refresh.

Já existe padrão de escopo em `executive_scope.py` e em `user_management_service.py` (`_org_ids_under_legal`).

## Goals / Non-Goals

**Goals:**

- Garantir no backend que só a organização matriz responsável e o master listam/gerenciam empresas
- Cadastro de empresa por `admin_legal_organization` sempre vinculado à sua matriz
- Menu Empresas mostrar busca, edição e exclusão para a matriz responsável
- Evitar corrida de `loadCoreData` que sobrescreve a lista após create
- Cobrir com pytest isolamento entre tenants

**Non-Goals:**

- Reexibir o menu Organizações para admin de matriz
- Criar automaticamente uma `Organization` no cadastro público da matriz
- Escopo de `admin_company` além de 403 na listagem/gestão de Empresas (já oculto no nav)
- Migration de schema

## Decisions

1. **Escopo no service (não só no front)**  
   - Autenticar todas as rotas de organization com `get_current_user`.  
   - `master`: todas as empresas.  
   - `admin_legal_organization`: `Organization.legalOrganizationId == actor.legal_organization_id`.  
   - Outros papéis: HTTP 403 com `detail` em pt-BR.  
   - Alternativa rejeitada: confiar só no filtro React (já falhou operacionalmente).

2. **Create força o vínculo da matriz**  
   - No create, sobrescrever `legalOrganizationId` com o da sessão do `admin_legal_organization`.  
   - Master pode informar `legalOrganizationId` no body (gestão global).  
   - Alternativa rejeitada: confiar no select do formulário sem validação server-side.

3. **Helper de escopo dedicado**  
   - Extrair `organization_scope.py` no estilo de `executive_scope.py` (assert_can_access / filter_query) para reutilizar em get/update/delete.  
   - Alternativa: lógica inline no service — menos reutilizável.

4. **Frontend**  
   - Contador de geração (ou AbortController) em `loadCoreData` para descartar respostas obsoletas.  
   - Após create, atualizar estado com a resposta da API e chamar refresh.  
   - Manter filtro client-side como defesa em profundidade.

## Risks / Trade-offs

- [Risk] Testes existentes chamam `/organizations/` sem token → Mitigation: autenticar fixtures nos testes afetados  
- [Risk] **BREAKING** para clientes anônimos → Mitigation: app já envia Bearer; documentar no proposal  
- [Risk] Dados legados com `legalOrganizationId` incorreto → Mitigation: fora de escopo; master continua vendo tudo para correção manual  

## Migration Plan

1. Deploy API com auth + escopo  
2. Frontend com refresh estável (mesmo release)  
3. Rollback: reverter commit; sem migration de DB  

## Open Questions

Nenhuma — regra de visibilidade confirmada: apenas organização cadastrante e master.
