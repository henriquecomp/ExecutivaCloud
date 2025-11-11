# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importa o roteador de usuários que acabamos de criar
from app.routers import user 
from app.routers import login

app = FastAPI(
    title="Executiva Cloud API",
    description="Executiva Cloud API"
)

origins = [
    "http://localhost:3000",        # Exemplo de um frontend React/Vue/Angular em desenvolvimento
    "https://seusite-frontend.com", # Exemplo de domínio em produção
    # Adicione outras origens aqui, se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Lista de origens permitidas
    allow_credentials=True,         # Permite cookies e cabeçalhos de autenticação
    allow_methods=["*"],            # Permite todos os métodos (GET, POST, PUT, DELETE, etc)
    allow_headers=["*"],            # Permite todos os cabeçalhos
)

# Inclui as rotas do módulo 'user' na aplicação principal
# Todas as rotas em user.py serão acessíveis. Ex: /users/, /users/1, etc.
app.include_router(user.router)
app.include_router(login.router)

# Rota raiz simples para verificação
@app.get("/", tags=["root"])
async def root():
    return {"message": "Bem-vindo à API, acesse /docs para ver a documentação."}