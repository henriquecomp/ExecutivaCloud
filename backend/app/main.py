# main.py
from fastapi import FastAPI
# Importa o roteador de usuários que acabamos de criar
from app.routers import user 
from app.routers import legal_organization, organization, department

app = FastAPI(
    title="Executiva Cloud API",
    description="Executiva Cloud API"
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