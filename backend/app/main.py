# main.py
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError
from starlette.requests import Request

import app.models  # noqa: F401 — registra todos os modelos SQLAlchemy na ordem correta

_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.is_file():
    load_dotenv(_env_path)
from fastapi.middleware.cors import CORSMiddleware

# Importa o roteador de usuários que acabamos de criar
from app.routers import (
    user_management,
    user,
    auth,
    legal_organization,
    organization,
    department,
    executive,
    secretary,
    event_type,
    event,
    document_category,
    document,
    contact_type,
    contact,
    task,
    report,
    settings_backup,
    expense_category,
    expense,
)

app = FastAPI(title="Executiva Cloud API", description="Executiva Cloud API")

_cors = os.getenv("CORS_ORIGINS", "").strip()
# Vite (3000/3001) costuma faltar quando CORS_ORIGINS vem só do Docker/produção
_always_allow = ("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001")
if _cors:
    origins = [o.strip() for o in _cors.split(",") if o.strip()]
    for o in _always_allow:
        if o not in origins:
            origins.append(o)
else:
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

# Regex cobre qualquer porta do Vite/Webpack (ex.: 3000, 5173) sem depender só da lista acima
_local_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
_local_origin_re = re.compile(_local_origin_regex)


def _cors_headers_for_request(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if not origin:
        return {}
    if origin in origins or _local_origin_re.match(origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=_local_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas literais /users/management/* antes de /users/{user_id:int}
app.include_router(user_management.router)
# Inclui as rotas do módulo 'user' na aplicação principal
# Todas as rotas em user.py serão acessíveis. Ex: /users/, /users/1, etc.
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(legal_organization.router)
app.include_router(organization.router)
app.include_router(department.router)
app.include_router(executive.router)
app.include_router(secretary.router)
app.include_router(event_type.router)
app.include_router(event.router)
app.include_router(document_category.router)
app.include_router(document.router)
app.include_router(contact_type.router)
app.include_router(contact.router)
app.include_router(task.router)
app.include_router(report.router)
app.include_router(settings_backup.router)
app.include_router(expense_category.router)
app.include_router(expense.router)


@app.exception_handler(OperationalError)
async def sqlalchemy_operational_error_handler(request: Request, exc: OperationalError):
    """
    Erros de SQLite (ex.: tabela inexistente sem migration) viram 500 sem headers CORS no
    handler padrão; o navegador mostra só 'blocked by CORS'. Devolvemos JSON + CORS.
    """
    return JSONResponse(
        status_code=500,
        content={
            "detail": (
                "Erro no banco de dados (tabela ou schema incompatível). "
                "Na API, execute: alembic upgrade head"
            )
        },
        headers=_cors_headers_for_request(request),
    )


# Rota raiz simples para verificação
@app.get("/", tags=["root"])
async def root():
    return {"message": "Bem-vindo à API, acesse /docs para ver a documentação."}
