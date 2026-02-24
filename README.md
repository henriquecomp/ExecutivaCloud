# Desenvolvimento

- Desenvolvido a tela de legal_organizations

# TODO

- O legal_organization nao esta atualizando apos o cadastro. - OK
- O organization nao esta atualizando apos o cadastro. - OK
- Separar os formulários do legal_organizations e aplicar o DRY - OK
- Fazer o gerencia executivos - OK

- Executar o comando alembic para atualizar as secretárias
  alembic revision --autogenerate -m "create_secretary_model_and_associations"
  alembic upgrade head
