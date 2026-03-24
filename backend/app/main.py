# main.py
import os

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
    event_type,
    event,
    document_category,
    document,
    contact_type,
    contact,
    task,
    report,
    settings_backup,
)

app = FastAPI(title="Executiva Cloud API", description="Executiva Cloud API")

_cors = os.getenv("CORS_ORIGINS", "").strip()
if _cors:
    origins = [o.strip() for o in _cors.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
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
app.include_router(event_type.router)
app.include_router(event.router)
app.include_router(document_category.router)
app.include_router(document.router)
app.include_router(contact_type.router)
app.include_router(contact.router)
app.include_router(task.router)
app.include_router(report.router)
app.include_router(settings_backup.router)


# Rota raiz simples para verificação
@app.get("/", tags=["root"])
async def root():
    return {"message": "Bem-vindo à API, acesse /docs para ver a documentação."}
