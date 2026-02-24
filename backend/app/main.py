# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa o roteador de usuários que acabamos de criar
from app.routers import (
    user,
    login,
    legal_organization,
    organization,
    department,
    executive,
    secretary
)

app = FastAPI(title="Executiva Cloud API", description="Executiva Cloud API")

origins = [
    "http://localhost:3001",  # Exemplo de um frontend React/Vue/Angular em desenvolvimento
    # Adicione outras origens aqui, se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Lista de origens permitidas
    allow_credentials=True,  # Permite cookies e cabeçalhos de autenticação
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, PUT, DELETE, etc)
    allow_headers=["*"],  # Permite todos os cabeçalhos
)

# Inclui as rotas do módulo 'user' na aplicação principal
# Todas as rotas em user.py serão acessíveis. Ex: /users/, /users/1, etc.
app.include_router(user.router)
app.include_router(login.router)
app.include_router(legal_organization.router)
app.include_router(organization.router)
app.include_router(department.router)
app.include_router(executive.router)
app.include_router(secretary.router) # <-- ADICIONADO


# Rota raiz simples para verificação
@app.get("/", tags=["root"])
async def root():
    return {"message": "Bem-vindo à API, acesse /docs para ver a documentação."}
