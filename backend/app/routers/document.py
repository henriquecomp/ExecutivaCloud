from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import document_schema as schemas
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/", response_model=List[schemas.Document])
def get_all_documents(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: DocumentService = Depends(DocumentService),
):
    return service.get_all_documents(skip=skip, limit=limit, executive_id=executive_id)


@router.get("/{document_id}", response_model=schemas.Document)
def get_document(
    document_id: int,
    service: DocumentService = Depends(DocumentService),
):
    db_item = service.get_document(document_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")
    return db_item


@router.post("/", response_model=schemas.Document, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: schemas.DocumentCreate,
    service: DocumentService = Depends(DocumentService),
):
    try:
        return service.create_document(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{document_id}", response_model=schemas.Document)
def update_document(
    document_id: int,
    payload: schemas.DocumentUpdate,
    service: DocumentService = Depends(DocumentService),
):
    try:
        return service.update_document(document_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{document_id}", response_model=Dict[str, str])
def delete_document(
    document_id: int,
    service: DocumentService = Depends(DocumentService),
):
    try:
        return service.delete_document(document_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)
