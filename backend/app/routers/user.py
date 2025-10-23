from fastapi import APIRouter, Depends, HTTPException, status
# REMOVA a importação de get_db (não é mais usada aqui)
# from app.core.database import get_db 
from app.schemas import user_schema as schemas
# IMPORTE A CLASSE, não a função factory
from app.services.user_service import UserService 
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.post("/", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED)
def create_user_route(
    user: schemas.UsuarioCreate, 
    service: UserService = Depends(UserService) # <--- MUDANÇA AQUI
):
    """ Cria um novo usuário no sistema. """
    try:
        # 'service' é uma instância de UserService já com o 'db'
        return service.create_user(user) # <-- Não precisa mais passar 'db'
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=schemas.Usuario)
def get_user_route(
    user_id: int, 
    service: UserService = Depends(UserService) # <--- MUDANÇA AQUI
):
    db_user = service.get_user_by_id(user_id) 
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return db_user