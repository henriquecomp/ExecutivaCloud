# Estrutura de Pastas

meu_projeto/
├── app/
│   ├── __init__.py
│   ├── main.py             # Ponto de entrada: cria a instância do FastAPI e inclui os routers
│   ├── routers/            # Camada de Apresentação (API Endpoints)
│   │   ├── __init__.py
│   │   ├── usuarios.py
│   │   └── produtos.py
│   ├── schemas/            # Camada de Dados (Modelos Pydantic)
│   │   ├── __init__.py
│   │   ├── usuario_schema.py
│   │   └── produto_schema.py
│   ├── services/           # Camada de Serviço (Lógica de Negócio)
│   │   ├── __init__.py
│   │   ├── usuario_service.py
│   │   └── produto_service.py
│   ├── models/             # Camada de Persistência (Modelos do ORM, como SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── usuario_model.py
│   │   └── produto_model.py
│   ├── db/                 # Configuração e sessão do banco de dados
│   │   ├── __init__.py
│   │   └── database.py
│   └── core/               # Configurações gerais (settings)
│       ├── __init__.py
│       └── config.py
└── tests/                  # Testes unitários e de integração
Como funciona:

routers (Apresentação): Define os endpoints da API usando APIRouter. Esta camada é responsável por receber as requisições HTTP, validar os dados de entrada (usando os schemas) e chamar a camada de serviço. Ela não contém lógica de negócio.

services (Lógica de Negócio): O coração da sua aplicação. Contém as regras de negócio e orquestra as operações. Por exemplo, um usuario_service teria funções como criar_novo_usuario, que pode envolver validações, hash de senha e, finalmente, chamar a camada de persistência para salvar os dados.

models e db (Persistência): Responsável pela comunicação com o banco de dados. models define as tabelas (usando um ORM como SQLAlchemy ou Tortoise ORM), e db gerencia a conexão e as sessões.

schemas (Contrato de Dados): Define a estrutura dos dados que entram e saem da sua API usando Pydantic. Eles garantem a validação, serialização e documentação automática.

# Iniciar o ambiente virtual
python -m venv .venv
source .venv/bin/activate (macos/linux)
.venv\Scripts\activate (windows)

# Rodar o fastapi
uvicorn main:app --reload