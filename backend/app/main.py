# main.py
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

from app.core.allowed_origins import LOCAL_ORIGIN_REGEX, get_cors_origins, origin_is_allowed

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
    support,
    expense_category,
    expense,
)

app = FastAPI(title="Executiva Cloud API", description="Executiva Cloud API")

origins = get_cors_origins()


def _cors_headers_for_request(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if not origin:
        return {}
    if origin_is_allowed(origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=LOCAL_ORIGIN_REGEX,
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
app.include_router(support.router)
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
