## Why

Ao editar uma organização (jurídica ou empresa) e salvar sem alterar o CNPJ, a API retorna `CNPJ não pode ser alterado.`. O bloqueio de imutabilidade está falso-positivo: o formulário envia o CNPJ mascarado e o backend compara com o valor normalizado do banco.

## What Changes

- Normalizar o CNPJ (e o CEP, se necessário) nos schemas de update antes da comparação/persistência.
- Comparar CNPJ no service usando forma normalizada (mesmo valor → permitir; valor diferente → rejeitar).
- Opcional no FE: omitir `cnpj` do payload de update quando o campo estiver somente leitura (defesa adicional).
- Cobrir com teste: update com mesmo CNPJ mascarado retorna 200; CNPJ realmente diferente continua 400.

## Capabilities

### New Capabilities

<!-- Nenhuma. -->

### Modified Capabilities

- `legal-organization-registration`: correção do falso positivo na imutabilidade de CNPJ no update (organização jurídica e empresa).

## Impact

- Backend: `legal_organization_schema.py`, `organization_schema.py`, services de update; testes.
- Frontend (opcional/recomendado): não enviar `cnpj` em update nas views de edição.
- Sem migration de banco.
