from fastapi import APIRouter, Depends, HTTPException, status
# REMOVA a importação de get_db (não é mais usada aqui)
# from app.core.database import get_db 
from app.schemas import login_schema as schemas
# IMPORTE A CLASSE, não a função factory
from app.services.user_service import UserService 
from typing import List

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/login", response_model=schemas.Login, status_code=status.HTTP_200_OK)
def login_route(
    login: schemas.Login, 
    service: UserService = Depends(UserService) # <--- MUDANÇA AQUI
):
    """ Loga um usuário no sistema. """
    try:
        # 'service' é uma instância de UserService já com o 'db'
        return service.get_user_by_id(login.id) # <-- Não precisa mais passar 'db'
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

