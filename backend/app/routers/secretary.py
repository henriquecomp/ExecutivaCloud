from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.secretary_schema import Secretary, SecretaryCreate, SecretaryUpdate
from app.services.secretary_service import SecretaryService

router = APIRouter(prefix="/secretaries", tags=["Secretaries"])
service = SecretaryService()

@router.post("/", response_model=Secretary, status_code=status.HTTP_201_CREATED)
def create_secretary(secretary: SecretaryCreate, db: Session = Depends(get_db)):
    return service.create_secretary(db, secretary)

@router.get("/", response_model=List[Secretary])
def read_secretaries(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return service.list_secretaries(db, skip, limit)

@router.get("/{secretary_id}", response_model=Secretary)
def read_secretary(secretary_id: int, db: Session = Depends(get_db)):
    return service.get_secretary(db, secretary_id)

@router.put("/{secretary_id}", response_model=Secretary)
def update_secretary(secretary_id: int, secretary: SecretaryUpdate, db: Session = Depends(get_db)):
    return service.update_secretary(db, secretary_id, secretary)

@router.delete("/{secretary_id}")
def delete_secretary(secretary_id: int, db: Session = Depends(get_db)):
    return service.delete_secretary(db, secretary_id)