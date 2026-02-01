from fastapi import APIRouter, Depends, HTTPException, status
from app.services.executive_service import ExecutiveService
from app.schemas import executive_schema as schemas
from typing import List, Dict

router = APIRouter(prefix="/executives", tags=["Executives"])


@router.post("/", response_model=schemas.Executive, status_code=status.HTTP_201_CREATED)
def create_executive(
    executive: schemas.ExecutiveCreate,
    service: ExecutiveService = Depends(ExecutiveService),
):
    """
    Cria um novo Executivo.
    """
    try:
        return service.create_executive(executive)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[schemas.Executive])
def get_all_executives(
    skip: int = 0,
    limit: int = 100,
    service: ExecutiveService = Depends(ExecutiveService),
):
    """
    Lista todos os Executivos.
    """
    return service.get_all_executives(skip=skip, limit=limit)


@router.get("/{exec_id}", response_model=schemas.Executive)
def get_executive(exec_id: int, service: ExecutiveService = Depends(ExecutiveService)):
    """
    Busca um Executivo pelo ID.
    """
    db_exec = service.get_executive(exec_id)
    if db_exec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Executivo não encontrado"
        )
    return db_exec


@router.put("/{exec_id}", response_model=schemas.Executive)
def update_executive(
    exec_id: int,
    exec_data: schemas.ExecutiveUpdate,
    service: ExecutiveService = Depends(ExecutiveService),
):
    """
    Atualiza dados de um Executivo.
    """
    try:
        return service.update_executive(exec_id, exec_data)
    except ValueError as e:
        if "não encontrado" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{exec_id}", response_model=Dict[str, str])
def delete_executive(
    exec_id: int, service: ExecutiveService = Depends(ExecutiveService)
):
    """
    Remove um Executivo.
    """
    try:
        return service.delete_executive(exec_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
