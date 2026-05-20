from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import user_model as user_models
from app.schemas.executive_schema import Executive, ExecutiveCreate, ExecutiveUpdate
from app.services.executive_service import ExecutiveService

router = APIRouter(prefix="/executives", tags=["Executives"])
service = ExecutiveService()


@router.post("/", response_model=Executive, status_code=status.HTTP_201_CREATED)
def create_executive(
    executive: ExecutiveCreate,
    db: Session = Depends(get_db),
    current: user_models.Usuario = Depends(get_current_user),
):
    return service.create_executive(db, current, executive)


@router.get("/", response_model=List[Executive])
def read_executives(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current: user_models.Usuario = Depends(get_current_user),
):
    return service.list_executives(db, current, skip, limit)


@router.get("/{executive_id}", response_model=Executive)
def read_executive(
    executive_id: int,
    db: Session = Depends(get_db),
    current: user_models.Usuario = Depends(get_current_user),
):
    return service.get_executive(db, current, executive_id)


@router.put("/{executive_id}", response_model=Executive)
def update_executive(
    executive_id: int,
    executive: ExecutiveUpdate,
    db: Session = Depends(get_db),
    current: user_models.Usuario = Depends(get_current_user),
):
    return service.update_executive(db, current, executive_id, executive)


@router.delete("/{executive_id}")
def delete_executive(
    executive_id: int,
    db: Session = Depends(get_db),
    current: user_models.Usuario = Depends(get_current_user),
):
    return service.delete_executive(db, current, executive_id)
