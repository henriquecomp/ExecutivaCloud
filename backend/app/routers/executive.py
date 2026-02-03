from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.executive_schema import Executive, ExecutiveCreate, ExecutiveUpdate
from app.services.executive_service import ExecutiveService

router = APIRouter(prefix="/executives", tags=["Executives"])
service = ExecutiveService()


@router.post("/", response_model=Executive, status_code=status.HTTP_201_CREATED)
def create_executive(executive: ExecutiveCreate, db: Session = Depends(get_db)):
    return service.create_executive(db, executive)


@router.get("/", response_model=List[Executive])
def read_executives(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.list_executives(db, skip, limit)


@router.get("/{executive_id}", response_model=Executive)
def read_executive(executive_id: int, db: Session = Depends(get_db)):
    return service.get_executive(db, executive_id)


@router.put("/{executive_id}", response_model=Executive)
def update_executive(
    executive_id: int, executive: ExecutiveUpdate, db: Session = Depends(get_db)
):
    return service.update_executive(db, executive_id, executive)


@router.delete("/{executive_id}")
def delete_executive(executive_id: int, db: Session = Depends(get_db)):
    return service.delete_executive(db, executive_id)
