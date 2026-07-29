## Context

A mudança `org-cnpj-cep-masks-and-lock` rejeita update quando `update_dict["cnpj"] != db_org.cnpj`. Em `Create`, `RequiredCnpj` (BeforeValidator) normaliza o valor. Em `LegalOrganizationUpdate` / `OrganizationUpdate`, o campo é `Optional[str]` e o `model_validator` chama `validate_cnpj(self.cnpj)` **sem gravar o retorno** — o dump continua com máscara (ex.: `11.222.333/0001-81`) enquanto o banco guarda `11222333000181`.

## Goals / Non-Goals

**Goals:**

- Salvar edição com o mesmo CNPJ (com ou sem máscara) sem erro.
- Continuar rejeitando CNPJ realmente diferente do persistido.
- Evitar falso positivo por formatação.

**Non-Goals:**

- Permitir alteração real de CNPJ.
- Mudar regras de CEP ou endereço.

## Decisions

1. **Atribuir normalização no validator de update**  
   Em ambos os schemas Update: `self.cnpj = validate_cnpj(self.cnpj)` (e analogamente CEP/UF se o validator já as valida, para consistência: `self.zipCode = validate_cep(...)`, `self.state = validate_uf(...)`). Alternativa equivalente: tipar `cnpj: OptionalCnpj` e `zipCode: OptionalCep` com BeforeValidator — preferível se já existirem no projeto.

2. **Comparação defensiva no service**  
   Comparar `normalize_cnpj_raw(update)` com `normalize_cnpj_raw(db)` (ou valores já normalizados pelo schema). Só então levantar `CNPJ não pode ser alterado.`

3. **FE: omitir `cnpj` no update quando `isEditing`**  
   Reduz risco de overwrite acidential e evita depender só da comparação. Validadores de update que exigem CNPJ no pacote de endereço precisam continuar recebendo o CNPJ **ou** a regra de “required_on_update” precisa aceitar omitido quando o CNPJ não mudará — se o FE omite, ajustar schema/serviço para não exigir `cnpj` no partial update de endereço, **ou** manter envio do CNPJ mas com normalização (decisão 1 é suficiente; omissão FE é opcional).

   **Decisão prática:** priorizar fix no schema/service (obrigatório). No FE, manter envio do CNPJ mascarado (já suportado após normalização) para não quebrar `required_on_update` sem mudança maior.

## Risks / Trade-offs

- **[Risk]** Testes que esperavam rejeição por máscara diferente deixam de falhar → **Mitigation** Novos testes explicitam: mesmo CNPJ mascarado = 200; CNPJ distinto = 400.
