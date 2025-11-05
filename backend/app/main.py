# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import user 
from app.routers import legal_organization, organization, department

app = FastAPI(
    title="Executiva Cloud API",
    description="Executiva Cloud API"
)

origins = [
    "http://localhost:3000",
]

# 3. Adicione o Middleware de CORS na sua aplicação
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,         # Permite as origens da lista
    allow_credentials=True,      # Permite cookies (importante para autenticação)
    allow_methods=["*"],         # Permite todos os métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"],         # Permite todos os cabeçalhos
)

# Inclui as rotas do módulo 'user' na aplicação principal
# Todas as rotas em user.py serão acessíveis. Ex: /users/, /users/1, etc.
app.include_router(user.router)
app.include_router(legal_organization.router)
app.include_router(organization.router)
app.include_router(department.router)

# Rota raiz simples para verificação
@app.get("/", tags=["root"])
async def root():
    return {"message": "Bem-vindo à API, acesse /docs para ver a documentação."}