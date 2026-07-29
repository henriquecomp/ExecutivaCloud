## ADDED Requirements

### Requirement: Update com mesmo CNPJ não é rejeitado
O sistema DEVE aceitar atualização de organização jurídica e de empresa quando o CNPJ enviado for o mesmo já persistido, independentemente de máscara/formatação. A rejeição `CNPJ não pode ser alterado.` DEVE ocorrer somente quando o CNPJ normalizado for diferente do cadastrado.

#### Scenario: Salvar edição sem mudar CNPJ (com máscara)
- **WHEN** o usuário edita organização jurídica ou empresa e salva com o mesmo CNPJ exibido mascarado
- **THEN** a atualização é aceita (status 2xx)
- **THEN** o sistema NÃO retorna `CNPJ não pode ser alterado.`

#### Scenario: Tentativa de trocar CNPJ continua bloqueada
- **WHEN** uma requisição de update envia um CNPJ normalizado diferente do persistido
- **THEN** o sistema rejeita com status 400 e mensagem `CNPJ não pode ser alterado.`
