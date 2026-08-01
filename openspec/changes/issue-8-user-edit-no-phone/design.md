## Contexto

O telefone do usuário (`Usuario.phone`) é exibido na listagem de gestão, mas a issue #8 exige que a alteração não esteja disponível nesse fluxo.

## Decisões

1. **UI**: manter coluna Telefone na tabela (somente leitura); remover apenas do modal de edição.
2. **API**: remover `phone` de `UserManagementPatch` para que clientes antigos não consigam alterar por PATCH; não é necessário mensagem de erro dedicada se o campo for omitido do schema.
3. **Service**: remover bloco que aplicava `updates["phone"]` em `patch_user`.

## Riscos

- Integrações que dependiam de PATCH de telefone pela gestão deixam de funcionar — alinhado ao requisito do produto.
